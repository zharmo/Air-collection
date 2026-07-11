const express = require('express');
const crypto = require('crypto');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { ensureOrderCustomerColumns, normalizeCheckoutCustomer } = require('../utils/orderCustomerFields');
const { StockError, validateAndReserveOrderStock } = require('../utils/orderStock');
const { sendOrderConfirmation, sendNewOrderNotification } = require('../services/emailService');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
 * Ensure the advance_payment column exists (JSONB, nullable).
 * Called once on first request — safe to call multiple times.
 * ───────────────────────────────────────────────────────────── */
const ensureAdvancePaymentColumn = async (pool) => {
    await pool.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS advance_payment JSONB DEFAULT NULL
    `);
};

/* ─────────────────────────────────────────────────────────────
 * Ensure location / city / mobile-money columns exist.
 * Called once on first request — safe to call multiple times.
 *
 * NOTE: "location" defaults to NULL (not 'inside') so that orders
 * created BEFORE this column existed don't get silently mislabeled.
 * New orders always explicitly set location, so NULL only ever
 * appears on legacy rows.
 * ───────────────────────────────────────────────────────────── */
const ensureLocationAndMobilePaymentColumns = async (pool) => {
    await pool.query(`
        ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS location               VARCHAR(20)  DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS city                   VARCHAR(100) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS mobile_provider         VARCHAR(50)  DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS mobile_transfer_phone   VARCHAR(50)  DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS mobile_transfer_name    VARCHAR(150) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS mobile_amount_paid      NUMERIC(10,2) DEFAULT NULL
    `);
};

/* ─────────────────────────────────────────────────────────────
 * Normalise mobile payment data from the checkout request body.
 * The checkout page sends THREE possible shapes for safety:
 *   1. mobilePayment  { provider, transferPhone, transferName, amountPaid }
 *   2. mobile_payment { provider, transfer_phone, transfer_name, amount_paid }
 *   3. flat fields    mobile_provider, mobile_transfer_phone, etc.
 * This function reads whichever is present and returns one clean object,
 * or null if no mobile payment was made.
 * ───────────────────────────────────────────────────────────── */
const normaliseMobilePayment = (body) => {
    const mp = body.mobilePayment || body.mobile_payment || null;

    const provider      = mp?.provider       ?? body.mobile_provider       ?? null;
    const transferPhone = mp?.transferPhone   ?? mp?.transfer_phone         ?? body.mobile_transfer_phone ?? null;
    const transferName  = mp?.transferName    ?? mp?.transfer_name          ?? body.mobile_transfer_name  ?? null;
    const amountPaid    = mp?.amountPaid      ?? mp?.amount_paid            ?? body.mobile_amount_paid    ?? null;

    if (!provider) return null;

    return {
        provider:      String(provider).toLowerCase(),
        transferPhone: transferPhone || null,
        transferName:  transferName  || null,
        amountPaid:    amountPaid !== null ? Number(amountPaid) : null,
    };
};

/* ─────────────────────────────────────────────────────────────
 * GET /orders  — admin sees all, user sees own
 * ───────────────────────────────────────────────────────────── */
router.get('/', protect, async (req, res) => {
    try {
        await ensureOrderCustomerColumns(pool);
        await ensureLocationAndMobilePaymentColumns(pool);

        const userId   = req.user.id;
        const userRole = req.user.role;

        let query = `
            SELECT o.*,
                COALESCE(NULLIF(o.customer_name,  ''), u.name)  AS user_name,
                COALESCE(NULLIF(o.customer_email, ''), u.email) AS customer_email,
                NULLIF(o.customer_phone, '')                    AS customer_phone,
                CASE WHEN o.user_id IS NULL THEN 'new' ELSE 'returning' END AS customer_type,
                CASE
                    WHEN o.shipping_address ILIKE '%Outside Hargeisa%' THEN 'Outside Hargeisa'
                    WHEN o.shipping_address ILIKE '%Inside Hargeisa%'  THEN 'Inside Hargeisa'
                    ELSE NULL
                END AS shipping_region,
                (SELECT json_agg(json_build_object(
                    'product_name', oi.product_name,
                    'quantity',     oi.quantity,
                    'price',        oi.price,
                    'total',        oi.total,
                    'image',        oi.image_url
                ))
                FROM order_items oi WHERE oi.order_id = o.id) AS items
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
        `;

        const params = [];
        if (userRole !== 'admin') {
            query += ` WHERE o.user_id = $1`;
            params.push(userId);
        }
        query += ` ORDER BY o.created_at DESC`;

        const result = await pool.query(query, params);
        sendSuccess(res, result.rows);
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
});

/* ─────────────────────────────────────────────────────────────
 * POST /orders  — create order (logged-in user)
 * ───────────────────────────────────────────────────────────── */
router.post('/', protect, async (req, res) => {
    let client;
    try {
        const {
            customer, items, subtotal, deliveryFee, total, paymentMethod,
            /*
             * location / city are sent at the TOP LEVEL of the request body
             * by the checkout page — NOT nested inside `customer`.
             */
            location,
            city,
            shipping_address: shippingAddressFromBody,
        } = req.body;

        await ensureOrderCustomerColumns(pool);
        await ensureAdvancePaymentColumn(pool);
        await ensureLocationAndMobilePaymentColumns(pool);

        const userId = req.user.id;

        /*
         * Shipping address:
         *   The checkout page already builds a full address string
         *   like "Street, City, Somaliland" and sends it as
         *   `shipping_address`. Use that directly when present.
         *   Fallback (legacy clients): build from customer.address + location.
         */
        const locationValue = location || customer?.location || 'inside';
        const cityValue     = city || (locationValue === 'outside' ? 'Outside Hargeisa' : 'Hargeisa');

        const shippingAddress = shippingAddressFromBody
            || `${customer?.address || ''}, ${locationValue === 'inside' ? 'Inside Hargeisa' : 'Outside Hargeisa'}`;

        const billingAddress = shippingAddress;

        const { customerName, customerEmail, customerPhone } = normalizeCheckoutCustomer(customer);

        /* Mobile money proof — normalised from any shape the checkout sends */
        const mobilePayment = normaliseMobilePayment(req.body);

        /* Legacy advance_payment JSONB column — keep for backwards compat */
        const advancePayment = customer?.advancePayment
            ? {
                provider:    customer.advancePayment.provider    || null,
                amount:      customer.advancePayment.amount      || deliveryFee,
                receiptName: customer.advancePayment.receiptName || null,
                senderPhone: customer.advancePayment.senderPhone || null,
              }
            : null;

        client = await pool.connect();
        await client.query('BEGIN');

        await validateAndReserveOrderStock(client, items);

        // ── ORDER NUMBER CHANGE ──
        // order_number is no longer built from Date.now() (that produced
        // "AC-1783..." for logged-in users). We insert the order first
        // with a throwaway placeholder — just to satisfy the NOT NULL +
        // UNIQUE constraint on order_number for a split second — then set
        // order_number to the row's own database id: a Postgres SERIAL
        // that's already unique and sequential across EVERY order, guest
        // or registered, since both flows insert into this same table.
        const tempOrderNumber = `TEMP-${crypto.randomUUID()}`;

        const orderResult = await client.query(
            `INSERT INTO orders (
                user_id, order_number, total_amount, shipping_address, billing_address,
                payment_method, payment_status, status, delivery_fee,
                customer_name, customer_email, customer_phone,
                advance_payment,
                location, city,
                mobile_provider, mobile_transfer_phone, mobile_transfer_name, mobile_amount_paid
             )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
             RETURNING *`,
            [
                userId, tempOrderNumber, total, shippingAddress, billingAddress,
                paymentMethod, 'pending', 'pending', deliveryFee,
                customerName, customerEmail, customerPhone,
                advancePayment ? JSON.stringify(advancePayment) : null,
                locationValue, cityValue,
                mobilePayment?.provider      || null,
                mobilePayment?.transferPhone || null,
                mobilePayment?.transferName  || null,
                mobilePayment?.amountPaid    ?? null,
            ]
        );
        let order = orderResult.rows[0];

        // Now assign the short, sequential order number based on the row's own id
        const orderNumber = String(order.id);
        const updateResult = await client.query(
            `UPDATE orders SET order_number = $1 WHERE id = $2 RETURNING *`,
            [orderNumber, order.id]
        );
        order = updateResult.rows[0];

        for (const item of items) {
            await client.query(
                `INSERT INTO order_items
                    (order_id, product_id, product_name, quantity, price, total, size, color, image_url)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
                [
                    order.id, item.productId, item.name,
                    item.quantity, item.price, item.price * item.quantity,
                    item.size  || null,
                    item.color || null,
                    item.image || null,
                ]
            );
        }

        await client.query('COMMIT');

        // ── Respond immediately — emails are fire-and-forget ──
        sendSuccess(res, { orderNumber, orderId: order.id }, 'Order placed successfully', 201);

        // ── Email payload shared by both notifications ──
        const emailPayload = {
            customerName,
            customerEmail,
            customerPhone,
            orderNumber,
            orderId: order.id,
            items,
            subtotal,
            deliveryFee,
            total,
            shippingAddress,
            location: locationValue,
            city:     cityValue,
            paymentMethod,
            mobilePayment,   // { provider, transferPhone, transferName, amountPaid } | null
            advancePayment,  // legacy — kept for backwards compat
        };

        // Customer confirmation
        if (customerEmail) {
            sendOrderConfirmation(customerEmail, emailPayload)
                .catch(err => console.error('Customer email error:', err.message));
        }

        // Admin new-order alert
        sendNewOrderNotification(emailPayload)
            .catch(err => console.error('Admin email error:', err.message));

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error(error);
        if (error instanceof StockError) {
            return sendError(res, error.message, error.statusCode);
        }
        sendError(res, 'Failed to create order', 500);
    } finally {
        if (client) client.release();
    }
});

/* ─────────────────────────────────────────────────────────────
 * GET /orders/:id  — single order (admin or owner)
 * ───────────────────────────────────────────────────────────── */
router.get('/:id', protect, async (req, res) => {
    try {
        await ensureOrderCustomerColumns(pool);
        await ensureLocationAndMobilePaymentColumns(pool);

        const orderId  = req.params.id;
        const userId   = req.user.id;
        const userRole = req.user.role;

        let query = `
            SELECT o.*,
                COALESCE(NULLIF(o.customer_name,  ''), u.name)  AS user_name,
                COALESCE(NULLIF(o.customer_email, ''), u.email) AS user_email,
                NULLIF(o.customer_phone, '')                    AS user_phone,
                o.advance_payment,
                (SELECT json_agg(json_build_object(
                    'id',           oi.id,
                    'product_name', oi.product_name,
                    'quantity',     oi.quantity,
                    'price',        oi.price,
                    'total',        oi.total,
                    'size',         oi.size,
                    'color',        oi.color,
                    'image',        oi.image_url
                ))
                FROM order_items oi WHERE oi.order_id = o.id) AS items
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE o.id = $1
        `;
        const params = [orderId];
        if (userRole !== 'admin') {
            query += ` AND o.user_id = $2`;
            params.push(userId);
        }

        const result = await pool.query(query, params);
        if (result.rows.length === 0) return sendError(res, 'Order not found', 404);

        const row = result.rows[0];

        /*
         * Build a `mobile_payment` object from the flat columns so the
         * frontend (success page, admin page) can read order.mobile_payment
         * directly, matching the shape used everywhere else.
         */
        if (row.mobile_provider) {
            row.mobile_payment = {
                provider:       row.mobile_provider,
                transfer_phone: row.mobile_transfer_phone,
                transfer_name:  row.mobile_transfer_name,
                amount_paid:    row.mobile_amount_paid,
            };
        }

        sendSuccess(res, row);
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
});

/* ─────────────────────────────────────────────────────────────
 * PUT /orders/:id/status  — update status (admin only)
 * ───────────────────────────────────────────────────────────── */
router.put('/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const { id }     = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return sendError(res, 'Invalid status', 400);
        }

        const result = await pool.query(
            'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rows.length === 0) return sendError(res, 'Order not found', 404);

        sendSuccess(res, result.rows[0], 'Status updated');
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
});

/* ─────────────────────────────────────────────────────────────
 * DELETE /orders/:id  — delete order (admin only)
 * ───────────────────────────────────────────────────────────── */
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM order_items WHERE order_id = $1', [id]);
        const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return sendError(res, 'Order not found', 404);
        sendSuccess(res, { id }, 'Order deleted');
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
});

module.exports = router;