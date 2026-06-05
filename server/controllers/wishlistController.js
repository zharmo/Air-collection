const {
  getWishlistWithProducts,
  addToWishlist,
  removeFromWishlist,
} = require('../models/Wishlist');
const { getProductById } = require('../models/Product');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// @desc    Get wishlist
// @route   GET /api/wishlist
const getWishlist = async (req, res) => {
  try {
    const wishlist = await getWishlistWithProducts(req.user.id);
    sendSuccess(res, wishlist);
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Add to wishlist
// @route   POST /api/wishlist/add
const addToWishlistHandler = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return sendError(res, 'Product ID required', 400);
    }
    const product = await getProductById(productId);
    if (!product) {
      return sendError(res, 'Product not found', 404);
    }
    await addToWishlist(req.user.id, productId);
    const updatedWishlist = await getWishlistWithProducts(req.user.id);
    sendSuccess(res, updatedWishlist, 'Added to wishlist');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/remove?productId=xxx
const removeFromWishlistHandler = async (req, res) => {
  try {
    const { productId } = req.query;
    if (!productId) {
      return sendError(res, 'Product ID required', 400);
    }
    await removeFromWishlist(req.user.id, productId);
    const updatedWishlist = await getWishlistWithProducts(req.user.id);
    sendSuccess(res, updatedWishlist, 'Removed from wishlist');
  } catch (error) {
    console.error(error);
    sendError(res, 'Server error', 500);
  }
};

module.exports = {
  getWishlist,
  addToWishlistHandler,
  removeFromWishlistHandler,
};