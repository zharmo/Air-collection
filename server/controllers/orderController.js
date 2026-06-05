const {
  createOrder,
  addOrderItems,
  getOrdersByUser,
  getOrderById,
  updateOrderStatus,
} = require('../models/Order');
const { getCartWithItems, clearCart } = require('../models/Cart');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Helper to generate order number
const generateOrderNumber = () => {
  return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
};

// @desc    Create new order (from cart)
// @route   POST /api/orders
const createNewOrder = async (req, res) => {
  try {
    const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;

    if (!shippingAddress || !billingAddress) {
      return sendError(res, 'Shipping and billing addresses are required', 400);
    }

    // Get user's cart
    const cart = await getCartWithItems(req.user.id);
    if (!cart.items || cart.items.length === 0) {
      return sendError(res, 'Cart is empty', 400);
    }

    // Calculate total
    const totalAmount = cart.total;

    const orderNumber = generateOrderNumber();

    const order = await createOrder(req.user.id, {
      orderNumber,
      totalAmount,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
    });

    // Prepare order items from cart items
    const orderItems = cart.items.map(item => ({
      product_id: item.product_id,
      name: item.name,
      sku: null, // we can fetch from product if needed
      quantity: item.quantity,
      price: item.price,
    }));
    await addOrderItems(order.id, orderItems);

    // Clear cart after successful order creation
    await clearCart(req.user.id);

    // Fetch full order with items
    const fullOrder = await getOrderById(order.id, req.user.id);

    sendSuccess(res, fullOrder, 'Order created successfully', 201);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/orders
const getUserOrders = async (req, res) => {
  try {
    const orders = await getOrdersByUser(req.user.id);
    sendSuccess(res, orders);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
const getOrder = async (req, res) => {
  try {
    const order = await getOrderById(req.params.id, req.user.id);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }
    sendSuccess(res, order);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Update order status (admin only)
// @route   PUT /api/orders/:id/status
const updateOrderStatusHandler = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }
    const order = await updateOrderStatus(req.params.id, status);
    if (!order) {
      return sendError(res, 'Order not found', 404);
    }
    sendSuccess(res, order, 'Order status updated');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

module.exports = {
  createNewOrder,
  getUserOrders,
  getOrder,
  updateOrderStatusHandler,
};