const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../config/db');

const hasGoogleOAuthConfig = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (hasGoogleOAuthConfig) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails[0].value;
                    const googleId = profile.id;
                    const name = profile.displayName;

                    // Check if user already exists by email or google_id.
                    const existingUser = await pool.query(
                        `SELECT * FROM users WHERE email = $1 OR google_id = $2`,
                        [email, googleId]
                    );

                    let user;
                    if (existingUser.rows.length === 0) {
                        // Create new user. Password is NULL for Google OAuth users.
                        const newUser = await pool.query(
                            `INSERT INTO users (name, email, google_id, role, is_active)
                             VALUES ($1, $2, $3, $4, $5)
                             RETURNING id, name, email, role, google_id`,
                            [name, email, googleId, 'customer', true]
                        );
                        user = newUser.rows[0];
                    } else {
                        user = existingUser.rows[0];

                        // Link Google ID for existing email/password users.
                        if (!user.google_id) {
                            await pool.query(
                                `UPDATE users SET google_id = $1 WHERE id = $2`,
                                [googleId, user.id]
                            );
                            user.google_id = googleId;
                        }
                    }

                    return done(null, user);
                } catch (error) {
                    console.error('Google OAuth error:', error);
                    return done(error, null);
                }
            }
        )
    );
} else {
    console.warn('Google OAuth disabled: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not configured.');
}

// Serialize user ID into session (required for Passport session support)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session by ID
passport.deserializeUser(async (id, done) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role FROM users WHERE id = $1`,
            [id]
        );
        done(null, result.rows[0] || null);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
