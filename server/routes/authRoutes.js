const express = require('express');
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword); // extra

module.exports = router;