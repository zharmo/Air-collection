const express = require('express');
const crypto = require('crypto');
const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { ensureOrderCustomerColumns, normalizeCheckoutCustomer } = require('../utils/orderCustomerFields');
const { StockError, validateAndReserveOrderStock } = require('../utils/orderStock');
const { sendOrderConfirmation, sendNewOrderNotification } = require('../services/emailService');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
 * Ensure the advance_payment column exists (JSONB, nullable).
 * ───────────────────────────────────────────────────────────── */
const ensureAdvancePaymentColumn = async (pool) => {
    await pool.query(`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS advance_payment JSONB DEFAULT NULL
    `);
};

/* ─────────────────────────────────────────────────────────────
 * Ensure promo code columns exist.
 * ───────────────────────────────────────────────────────────── */
const ensurePromoCodeColumns = async (pool) => {
    await pool.query(`
        ALTER TABLE orders
            ADD COLUMN IF NOT EXISTS promo_code       VARCHAR(50)   DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS discount         NUMERIC(10,2) DEFAULT 0,
            ADD COLUMN IF NOT EXISTS discount_type    VARCHAR(20)   DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS discount_value   NUMERIC(10,2) DEFAULT NULL
    `);
};

/* ─────────────────────────────────────────────────────────────
 * Normalise discount data from the checkout request body.
 * Handles both camelCase and snake_case variants.
 * ───────────────────────────────────────────────────────────── */
const normaliseDiscount = (body) => {
    const promoCode = body.promoCode || body.promo_code || null;
    const discount = body.discount !== undefined ? parseFloat(body.discount) : 0;
    const discountType = body.discountType || body.discount_type || null;
    const discountValue = body.discountValue !== undefined ? parseFloat(body.discountValue) 
                        : (body.discount_value !== undefined ? parseFloat(body.discount_value) : null);
    return { promoCode, discount, discountType, discountValue };
};

/* ─────────────────────────────────────────────────────────────
 * POST /guest-orders  — guest checkout
 * ───────────────────────────────────────────────────────────── */
router.post('/', async (req, res) => {
    let client;
    try {
        const { customer, items, subtotal, deliveryFee, total, paymentMethod } = req.body;

        // ── Normalise discount fields ──
        const { promoCode, discount, discountType, discountValue } = normaliseDiscount(req.body);

        await ensureOrderCustomerColumns(pool);
        await ensureAdvancePaymentColumn(pool);
        await ensurePromoCodeColumns(pool);

        const locationLabel   = customer.location === 'inside' ? 'Inside Hargeisa' : 'Outside Hargeisa';
        const shippingAddress = `${customer.address}, ${locationLabel}`;
        const billingAddress  = shippingAddress;

        const { customerName, customerEmail, customerPhone } = normalizeCheckoutCustomer(customer);

        // Capture advance payment details (only present for outside Hargeisa orders)
        const advancePayment = customer.advancePayment
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
        // order_number is no longer built from Date.now() (that's what was
        // producing "GUEST-1783337089392-501"). We insert the order first
        // with a throwaway placeholder — just to satisfy the NOT NULL +
        // UNIQUE constraint on order_number for a split second — then set
        // order_number to the row's own database id, which is a Postgres
        // SERIAL: already unique, already sequential, and shared across
        // every order in the table regardless of guest or registered.
        const tempOrderNumber = `TEMP-${crypto.randomUUID()}`;

        const orderResult = await client.query(
            `INSERT INTO orders (
                user_id, order_number, total_amount, shipping_address, billing_address,
                payment_method, payment_status, status, delivery_fee,
                customer_name, customer_email, customer_phone,
                advance_payment,
                promo_code, discount, discount_type, discount_value
             )
             VALUES (NULL,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
             RETURNING *`,
            [
                tempOrderNumber, total, shippingAddress, billingAddress,
                paymentMethod, 'pending', 'pending', deliveryFee,
                customerName, customerEmail, customerPhone,
                advancePayment ? JSON.stringify(advancePayment) : null,
                promoCode,          // now correctly normalised
                discount,           // now correctly normalised (number)
                discountType,       // now correctly normalised
                discountValue,      // now correctly normalised (number)
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
            items,
            subtotal,
            deliveryFee,
            total,
            shippingAddress,
            location:     customer.location,
            paymentMethod,
            advancePayment,
            promoCode,
            discount,
            discountType,
            discountValue,
        };

        // Customer confirmation
        if (customerEmail) {
            sendOrderConfirmation(customerEmail, emailPayload)
                .catch(err => console.error('Customer email error (guest):', err.message));
        }

        // Admin new-order alert
        sendNewOrderNotification(emailPayload)
            .catch(err => console.error('Admin email error (guest):', err.message));

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error('Guest order error:', error);
        if (error instanceof StockError) {
            return sendError(res, error.message, error.statusCode);
        }
        sendError(res, 'Failed to place order', 500);
    } finally {
        if (client) client.release();
    }
});

/* ─────────────────────────────────────────────────────────────
 * GET /guest-orders/:id  — fetch guest order (no auth)
 * ───────────────────────────────────────────────────────────── */
router.get('/:id', async (req, res) => {
    try {
        await ensureOrderCustomerColumns(pool);
        await ensurePromoCodeColumns(pool);

        const orderId = req.params.id;

        const orderResult = await pool.query(
            `SELECT o.*,
                    o.customer_name  AS user_name,
                    o.customer_email AS user_email,
                    o.customer_phone AS user_phone,
                    o.advance_payment,
                    (SELECT json_agg(json_build_object(
                        'name',     oi.product_name,
                        'quantity', oi.quantity,
                        'price',    oi.price,
                        'total',    oi.total,
                        'size',     oi.size,
                        'color',    oi.color,
                        'image',    oi.image_url
                    ))
                    FROM order_items oi WHERE oi.order_id = o.id) AS items
             FROM orders o
             WHERE o.id = $1`,
            [orderId]
        );

        if (orderResult.rows.length === 0) return sendError(res, 'Order not found', 404);

        sendSuccess(res, orderResult.rows[0]);
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
});

module.exports = router;