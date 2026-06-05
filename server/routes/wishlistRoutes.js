const express = require('express');
const { getWishlist, addToWishlistHandler, removeFromWishlistHandler } = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/add', addToWishlistHandler);
router.delete('/remove', removeFromWishlistHandler);

module.exports = router;