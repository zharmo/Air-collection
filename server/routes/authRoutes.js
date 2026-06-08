const express = require('express');
const passport = require('passport');
const { registerUser, loginUser, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const generateToken = require('../utils/generateToken');
const router = express.Router();

const requireGoogleOAuth = (req, res, next) => {
    if (passport._strategy('google')) {
        return next();
    }

    return sendError(res, 'Google OAuth is not configured on this server', 503);
};

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
    requireGoogleOAuth,
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google callback – after user approves
router.get('/google/callback',
    requireGoogleOAuth,
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL || process.env.SITE_URL || 'http://localhost:3000'}/auth/signin?error=google`,
        session: false,
    }),
    (req, res) => {
        const user = req.user;
        const token = generateToken(user.id, user.role);
        const frontendUrl = process.env.FRONTEND_URL || process.env.SITE_URL || 'http://localhost:3000';
        // Redirect to frontend signin page with the token as a query parameter
        res.redirect(`${frontendUrl}/auth/signin?token=${token}`);
    }
);

module.exports = router;
