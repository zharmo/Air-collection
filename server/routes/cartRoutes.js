const express = require('express');
const { getCart, addToCart, removeFromCart, updateCartItem, clearCartItems } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect); // all cart routes require login

router.get('/', getCart);
router.post('/add', addToCart);
router.delete('/remove', removeFromCart);
router.put('/update', updateCartItem);
router.delete('/clear', clearCartItems);

module.exports = router;