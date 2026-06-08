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

const frontendUrl = () =>
    process.env.FRONTEND_URL || process.env.SITE_URL || 'http://localhost:3000';

/**
 * Encode intent as a base64 JSON string to pass through OAuth `state`.
 * Google OAuth preserves the `state` param and returns it unchanged in the callback.
 */
const buildOAuthState = (intent) =>
    Buffer.from(JSON.stringify({ intent })).toString('base64');

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

// ─── Google OAuth — Sign In ────────────────────────────────────────────────
// Passes intent=login in state so the callback knows this came from sign-in.
router.get(
    '/google',
    requireGoogleOAuth,
    (req, res, next) => {
        const intent = req.query.intent || 'login'; // ?intent=login or ?intent=register
        passport.authenticate('google', {
            scope: ['profile', 'email'],
            state: buildOAuthState(intent),
        })(req, res, next);
    }
);

// ─── Google OAuth — Callback ───────────────────────────────────────────────
router.get(
    '/google/callback',
    requireGoogleOAuth,
    passport.authenticate('google', {
        failureRedirect: `${frontendUrl()}/auth/signin?error=google`,
        session: false,
    }),
    (req, res) => {
        const user = req.user;
        const base = frontendUrl();

        /**
         * Block re-registration: if the user came from the sign-up page
         * (intent=register) but the account already existed (isNew=false),
         * redirect back to sign-in with an `account_exists` error so the
         * signup page can show a helpful message.
         */
        if (user.oauthIntent === 'register' && !user.isNew) {
            return res.redirect(`${base}/auth/signup?error=account_exists`);
        }

        /**
         * Block login with unregistered account: if the user came from
         * sign-in (intent=login) but no account existed before this request,
         * that means they were auto-created above. That's fine — just log them
         * in. If you'd rather force them to the signup flow, uncomment below:
         *
         * if (user.oauthIntent === 'login' && user.isNew) {
         *     return res.redirect(`${base}/auth/signin?error=no_account`);
         * }
         */

        const token = generateToken(user.id, user.role);

        // Redirect to the appropriate page depending on which form triggered this
        if (user.oauthIntent === 'register') {
            return res.redirect(`${base}/auth/signup?token=${token}`);
        }
        return res.redirect(`${base}/auth/signin?token=${token}`);
    }
);

module.exports = router;
