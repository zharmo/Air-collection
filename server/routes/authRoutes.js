const express = require('express');
const passport = require('passport');
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const generateToken = require('../utils/generateToken');
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
        if (result.rows.length === 0) return sendError(res, 'User not found', 404);
        sendSuccess(res, result.rows[0]);
    } catch (error) {
        console.error(error);
        sendError(res, 'Server error', 500);
    }
});

// ========== Google OAuth Routes ==========
// Redirect to Google consent screen
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback – after user approves
router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/auth/signin' }),
    (req, res) => {
        const user = req.user;
        const token = generateToken(user.id, user.role);
        // Redirect to frontend signin page with the token as a query parameter
        res.redirect(`${process.env.FRONTEND_URL}/auth/signin?token=${token}`);
    }
);

module.exports = router;