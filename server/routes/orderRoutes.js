const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const router = express.Router();

// Get orders – admin sees all (including guest orders), user sees only their own
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = `
            SELECT o.*, u.name as user_name,
                (SELECT json_agg(json_build_object(
                    'product_name', oi.product_name,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'total', oi.total,
                    'image', oi.image_url
                ))
                FROM order_items oi WHERE oi.order_id = o.id) as items
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
        `;

        let params = [];
        if (userRole !== 'admin') {
            query += ` WHERE o.user_id = $1`;
            params = [userId];
        }
        query += ` ORDER BY o.created_at DESC`;

        const result = await pool.query(query, params);
        sendSuccess(res, result.rows);
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
});

// Create a new order (logged-in user)
router.post('/', protect, async (req, res) => {
    try {
        const { customer, items, subtotal, deliveryFee, total, paymentMethod } = req.body;
        const userId = req.user.id;
        const orderNumber = `AC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const shippingAddress = `${customer.address}, ${customer.location === 'inside' ? 'Inside Hargeisa' : 'Outside Hargeisa'}`;
        const billingAddress = shippingAddress;

        await pool.query('BEGIN');

        const orderResult = await pool.query(
            `INSERT INTO orders (user_id, order_number, total_amount, shipping_address, billing_address, payment_method, payment_status, status, delivery_fee)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [userId, orderNumber, total, shippingAddress, billingAddress, paymentMethod, 'pending', 'pending', deliveryFee]
        );
        const order = orderResult.rows[0];

        for (const item of items) {
            await pool.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, total, size, color, image_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [order.id, item.productId, item.name, item.quantity, item.price, item.price * item.quantity, item.size || null, item.color || null, item.image || null]
            );
        }

        await pool.query('COMMIT');

        sendSuccess(res, { orderNumber, orderId: order.id }, 'Order placed successfully', 201);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error(error);
        sendError(res, 'Failed to create order', 500);
    }
});

// Get a single order by ID (admin or owner)
router.get('/:id', protect, async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = `
            SELECT o.*, 
                (SELECT json_agg(json_build_object(
                    'id', oi.id,
                    'product_name', oi.product_name,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'total', oi.total,
                    'size', oi.size,
                    'color', oi.color,
                    'image', oi.image_url
                ))
                FROM order_items oi WHERE oi.order_id = o.id) as items,
                u.name as user_name, u.email as user_email
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

// Update order status (admin only)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
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

module.exports = router;