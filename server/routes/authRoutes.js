const express = require('express');
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Get current logged-in user info
router.get('/me', protect, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, avatar FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return sendError(res, 'User not found', 404);
        }
        sendSuccess(res, result.rows[0]);
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
});

module.exports = router;