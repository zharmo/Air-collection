const express = require('express');
const { processPayment, getPaymentStatus } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect);
router.post('/', processPayment);
router.get('/:orderId', getPaymentStatus);

module.exports = router;