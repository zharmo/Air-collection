const pool = require('../config/db');

const createOrder = async (userId, orderData) => {
  const { orderNumber, totalAmount, shippingAddress, billingAddress, paymentMethod, notes } = orderData;
  const result = await pool.query(
    `INSERT INTO orders (user_id, order_number, total_amount, shipping_address, billing_address, payment_method, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, orderNumber, totalAmount, shippingAddress, billingAddress, paymentMethod, notes]
  );
  return result.rows[0];
};

const addOrderItems = async (orderId, items) => {
  for (const item of items) {
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, price, total)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [orderId, item.product_id, item.name, item.sku, item.quantity, item.price, item.price * item.quantity]
    );
  }
};

const getOrdersByUser = async (userId) => {
  const result = await pool.query(
    `SELECT id, order_number, status, total_amount, created_at, payment_status
     FROM orders
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
};

const getOrderById = async (orderId, userId = null) => {
  let query = `
    SELECT o.*, u.name as user_name, u.email as user_email
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    WHERE o.id = $1
  `;
  const values = [orderId];
  if (userId) {
    query += ` AND o.user_id = $2`;
    values.push(userId);
  }
  const orderResult = await pool.query(query, values);
  if (orderResult.rows.length === 0) return null;

  const order = orderResult.rows[0];
  const itemsResult = await pool.query(
    `SELECT id, product_id, product_name, quantity, price, total
     FROM order_items
     WHERE order_id = $1`,
    [orderId]
  );
  order.items = itemsResult.rows;
  return order;
};

const updateOrderStatus = async (orderId, status) => {
  const result = await pool.query(
    `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, orderId]
  );
  return result.rows[0];
};

module.exports = {
  createOrder,
  addOrderItems,
  getOrdersByUser,
  getOrderById,
  updateOrderStatus,
};