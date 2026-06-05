const express = require('express');
const { createNewOrder, getUserOrders, getOrder, updateOrderStatusHandler } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect);

router.post('/', createNewOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrder);
router.put('/:id/status', adminOnly, updateOrderStatusHandler);

module.exports = router;