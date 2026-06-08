const express = require('express');
const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { ensureOrderCustomerColumns, normalizeCheckoutCustomer } = require('../utils/orderCustomerFields');
const router = express.Router();

// POST - Guest checkout (create order)
router.post('/', async (req, res) => {
    try {
        const { customer, items, subtotal, deliveryFee, total, paymentMethod } = req.body;
        await ensureOrderCustomerColumns(pool);

        const orderNumber = `GUEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const shippingAddress = `${customer.address}, ${customer.location === 'inside' ? 'Inside Hargeisa' : 'Outside Hargeisa'}`;
        const billingAddress = shippingAddress;
        const { customerName, customerEmail, customerPhone } = normalizeCheckoutCustomer(customer);

        await pool.query('BEGIN');

        // Insert order with user_id = NULL for guests
        const orderResult = await pool.query(
            `INSERT INTO orders (
                user_id, order_number, total_amount, shipping_address, billing_address,
                payment_method, payment_status, status, delivery_fee,
                customer_name, customer_email, customer_phone
             )
             VALUES (NULL, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [
                orderNumber, total, shippingAddress, billingAddress,
                paymentMethod, 'pending', 'pending', deliveryFee,
                customerName, customerEmail, customerPhone
            ]
        );
        const order = orderResult.rows[0];

        // Insert order items (including image_url)
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
        console.error('Guest order error:', error);
        sendError(res, 'Failed to place order', 500);
    }
});

// GET - Guest order by ID (no authentication)
router.get('/:id', async (req, res) => {
    try {
        await ensureOrderCustomerColumns(pool);

        const orderId = req.params.id;
        const orderResult = await pool.query(
            `SELECT o.*,
                    o.customer_name as user_name,
                    o.customer_email as user_email,
                    o.customer_phone as user_phone,
                    (SELECT json_agg(json_build_object('name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price, 'total', oi.total, 'size', oi.size, 'color', oi.color, 'image', oi.image_url))
                     FROM order_items oi WHERE oi.order_id = o.id) as items
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
