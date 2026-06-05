const {
  getCartWithItems,
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  clearCart,
} = require('../models/Cart');
const { getProductById } = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Get cart
// @route   GET /api/cart
const getCart = async (req, res) => {
  try {
    const cart = await getCartWithItems(req.user.id);
    sendSuccess(res, cart);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity < 1) {
      return sendError(res, 'Product ID and positive quantity required', 400);
    }

    const product = await getProductById(productId);
    if (!product || !product.is_active) {
      return sendError(res, 'Product not available', 404);
    }
    if (product.stock_quantity < quantity) {
      return sendError(res, 'Insufficient stock', 400);
    }

    const cartItem = await addItemToCart(req.user.id, productId, quantity, product.price);
    const updatedCart = await getCartWithItems(req.user.id);
    sendSuccess(res, updatedCart, 'Item added to cart');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove?itemId=xxx
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.query;
    if (!itemId) {
      return sendError(res, 'Item ID required', 400);
    }
    await removeItemFromCart(req.user.id, itemId);
    const updatedCart = await getCartWithItems(req.user.id);
    sendSuccess(res, updatedCart, 'Item removed from cart');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update (extra, but we can include)
const updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    if (!itemId || quantity === undefined || quantity < 0) {
      return sendError(res, 'Item ID and valid quantity required', 400);
    }
    if (quantity === 0) {
      await removeItemFromCart(req.user.id, itemId);
    } else {
      await updateCartItemQuantity(req.user.id, itemId, quantity);
    }
    const updatedCart = await getCartWithItems(req.user.id);
    sendSuccess(res, updatedCart, 'Cart updated');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
const clearCartItems = async (req, res) => {
  try {
    await clearCart(req.user.id);
    const emptyCart = await getCartWithItems(req.user.id);
    sendSuccess(res, emptyCart, 'Cart cleared');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

module.exports = {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCartItems,
};