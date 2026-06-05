const { createPayment, updatePaymentStatus, getPaymentByOrderId } = require('../models/Payment');
const { getOrderById, updateOrderStatus } = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Process payment (stub – integrate Stripe)
// @route   POST /api/payment
const processPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, transactionId } = req.body;

    if (!orderId || !paymentMethod) {
      return sendError(res, 'Order ID and payment method required', 400);
    }

    // Verify order belongs to user
    const order = await getOrderById(orderId, req.user.id);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }

    if (order.payment_status === 'paid') {
      return sendError(res, 'Order already paid', 400);
    }

    // In real app, call Stripe/PayPal here.
    // Assume payment successful for demo.
    const paymentIntentId = `pi_${Date.now()}`;
    const paymentStatus = 'succeeded';

    const paymentData = {
      order_id: orderId,
      payment_intent_id: paymentIntentId,
      amount: order.total_amount,
      payment_method: paymentMethod,
      status: paymentStatus,
      transaction_id: transactionId || `txn_${Date.now()}`,
      metadata: { source: 'stub' },
    };

    const payment = await createPayment(paymentData);

    // Update order payment status
    await updateOrderStatus(orderId, order.status); // keep same status but mark paid in payments table
    // Actually update orders.payment_status (we need to add that column or just rely on payments)
    await require('../config/db').query(
      'UPDATE orders SET payment_status = $1 WHERE id = $2',
      ['paid', orderId]
    );

    sendSuccess(res, payment, 'Payment processed successfully');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Get payment status for an order
// @route   GET /api/payment/:orderId
const getPaymentStatus = async (req, res) => {
  try {
    const payment = await getPaymentByOrderId(req.params.orderId);
    if (!payment) {
      return sendError(res, 'Payment not found', 404);
    }
    sendSuccess(res, payment);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

module.exports = { processPayment, getPaymentStatus };