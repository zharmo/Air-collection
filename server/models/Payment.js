const pool = require('../config/db');

const createPayment = async (paymentData) => {
  const { order_id, payment_intent_id, amount, payment_method, status, transaction_id, metadata } = paymentData;
  const result = await pool.query(
    `INSERT INTO payments (order_id, payment_intent_id, amount, payment_method, status, transaction_id, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [order_id, payment_intent_id, amount, payment_method, status, transaction_id, metadata]
  );
  return result.rows[0];
};

const updatePaymentStatus = async (paymentIntentId, status) => {
  const result = await pool.query(
    `UPDATE payments SET status = $1, updated_at = NOW() WHERE payment_intent_id = $2 RETURNING *`,
    [status, paymentIntentId]
  );
  return result.rows[0];
};

const getPaymentByOrderId = async (orderId) => {
  const result = await pool.query('SELECT * FROM payments WHERE order_id = $1', [orderId]);
  return result.rows[0];
};

module.exports = {
  createPayment,
  updatePaymentStatus,
  getPaymentByOrderId,
};