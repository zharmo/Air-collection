const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { ensureOrderCustomerColumns, normalizeCheckoutCustomer } = require('../utils/orderCustomerFields');
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
 * GET /orders  — admin sees all, user sees own
 * ───────────────────────────────────────────────────────────── */
router.get('/', protect, async (req, res) => {
    try {
        await ensureOrderCustomerColumns(pool);

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
    try {
        const { customer, items, subtotal, deliveryFee, total, paymentMethod } = req.body;

        await ensureOrderCustomerColumns(pool);
        await ensureAdvancePaymentColumn(pool);

        const userId        = req.user.id;
        const orderNumber   = `AC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const locationLabel = customer.location === 'inside' ? 'Inside Hargeisa' : 'Outside Hargeisa';
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

        await pool.query('BEGIN');

        const orderResult = await pool.query(
            `INSERT INTO orders (
                user_id, order_number, total_amount, shipping_address, billing_address,
                payment_method, payment_status, status, delivery_fee,
                customer_name, customer_email, customer_phone,
                advance_payment
             )
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
             RETURNING *`,
            [
                userId, orderNumber, total, shippingAddress, billingAddress,
                paymentMethod, 'pending', 'pending', deliveryFee,
                customerName, customerEmail, customerPhone,
                advancePayment ? JSON.stringify(advancePayment) : null,
            ]
        );
        const order = orderResult.rows[0];

        for (const item of items) {
            await pool.query(
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

        await pool.query('COMMIT');

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
            location:       customer.location,
            paymentMethod,
            advancePayment,
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
        await pool.query('ROLLBACK');
        console.error(error);
        sendError(res, 'Failed to create order', 500);
    }
});

/* ─────────────────────────────────────────────────────────────
 * GET /orders/:id  — single order (admin or owner)
 * ───────────────────────────────────────────────────────────── */
router.get('/:id', protect, async (req, res) => {
    try {
        await ensureOrderCustomerColumns(pool);

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

        sendSuccess(res, result.rows[0]);
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