const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const router = express.Router();

// Create a new order
router.post('/', protect, async (req, res) => {
    console.log('🔵 POST /api/orders - Request received');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('User ID:', req.user?.id);

    try {
        const { customer, items, subtotal, deliveryFee, total, paymentMethod } = req.body;
        const userId = req.user.id;
        const orderNumber = `AC-${Date.now()}`;
        const shippingAddress = `${customer.address}, ${customer.location === 'inside' ? 'Inside Hargeisa' : 'Outside Hargeisa'}`;
        // Use same address for billing
        const billingAddress = shippingAddress;

        if (!items || items.length === 0) {
            console.error('❌ No items in order');
            return sendError(res, 'Order must contain at least one item', 400);
        }

        await pool.query('BEGIN');

        // Insert order – now includes billing_address
        const orderResult = await pool.query(
            `INSERT INTO orders (user_id, order_number, total_amount, shipping_address, billing_address, payment_method, payment_status, status, delivery_fee)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [userId, orderNumber, total, shippingAddress, billingAddress, paymentMethod || 'cash_on_delivery', 'pending', 'pending', deliveryFee || 0]
        );
        const order = orderResult.rows[0];
        console.log(`✅ Order inserted: id=${order.id}, order_number=${order.order_number}`);

        // Insert order items
        for (const item of items) {
            await pool.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, total, size, color)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    order.id,
                    item.productId || null,
                    item.name,
                    item.quantity,
                    item.price,
                    item.price * item.quantity,
                    item.size || null,
                    item.color || null
                ]
            );
        }
        console.log(`✅ ${items.length} order items inserted`);

        await pool.query('COMMIT');

        sendSuccess(res, { orderNumber, orderId: order.id }, 'Order placed successfully', 201);
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Order creation error:', error);
        sendError(res, error.message || 'Failed to create order', 500);
    }
});

// Get order by ID for success page
router.get('/:id', protect, async (req, res) => {
    try {
        const orderId = req.params.id;
        const orderResult = await pool.query(
            `SELECT o.*, 
                    (SELECT json_agg(json_build_object(
                        'name', oi.product_name,
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'total', oi.total,
                        'size', oi.size,
                        'color', oi.color
                    ))
                     FROM order_items oi WHERE oi.order_id = o.id) as items,
                    u.name as user_name, u.email as user_email
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             WHERE o.id = $1 AND o.user_id = $2`,
            [orderId, req.user.id]
        );
        if (orderResult.rows.length === 0) return sendError(res, 'Order not found', 404);
        sendSuccess(res, orderResult.rows[0]);
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
});

module.exports = router;