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

const buildOAuthState = (intent) =>
    Buffer.from(JSON.stringify({ intent })).toString('base64');

const getOAuthIntent = (state) => {
    if (state === 'signup') return 'register';
    if (state === 'signin') return 'login';

    try {
        if (state) {
            const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
            return stateData.intent || 'login';
        }
    } catch {
        return 'login';
    }

    return 'login';
};

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

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

router.get(
    '/google',
    requireGoogleOAuth,
    (req, res, next) => {
        const legacyModeIntent = req.query.mode === 'signup' ? 'register' : 'login';
        const intent = req.query.intent || legacyModeIntent;

        passport.authenticate('google', {
            scope: ['profile', 'email'],
            state: buildOAuthState(intent),
        })(req, res, next);
    }
);

router.get(
    '/google/callback',
    requireGoogleOAuth,
    (req, res, next) => {
        const base = frontendUrl();
        const intent = getOAuthIntent(req.query.state);
        const failurePath = intent === 'register' ? '/auth/signup' : '/auth/signin';

        passport.authenticate('google', { session: false }, (err, user, info) => {
            if (err) {
                console.error('Google OAuth callback error:', err);
                return res.redirect(`${base}${failurePath}?error=google`);
            }

            if (!user) {
                const message = info?.message || 'Google authentication failed. Please try again.';
                const error = message.toLowerCase().includes('already registered')
                    ? 'account_exists'
                    : message;
                return res.redirect(`${base}${failurePath}?error=${encodeURIComponent(error)}`);
            }

            const token = generateToken(user.id, user.role);

            if (user.oauthIntent === 'register') {
                return res.redirect(`${base}/auth/signup?token=${token}`);
            }

            return res.redirect(`${base}/auth/signin?token=${token}`);
        })(req, res, next);
    }
);

module.exports = router;
