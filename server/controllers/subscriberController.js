const pool = require('../config/db');

// @desc    Subscribe an email to the newsletter
// @route   POST /api/subscribers
// @access  Public
const subscribe = async (req, res) => {
    const { email } = req.body;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'A valid email is required' });
    }

    try {
        const existing = await pool.query(
            'SELECT id, is_active FROM subscribers WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        // If email exists in ANY state (active or inactive)
        if (existing.rows.length > 0) {
            // If inactive, reactivate it silently
            if (!existing.rows[0].is_active) {
                await pool.query(
                    'UPDATE subscribers SET is_active = TRUE, subscribed_at = NOW(), unsubscribed_at = NULL WHERE email = $1',
                    [email.toLowerCase().trim()]
                );
            }
            // 🔥 CRITICAL FIX: Return 409 (Conflict) so frontend shows "already subscribed"
            return res.status(409).json({ success: false, message: 'Email already exists' });
        }

        // Brand new subscriber
        await pool.query(
            'INSERT INTO subscribers (email) VALUES ($1)',
            [email.toLowerCase().trim()]
        );

        return res.status(201).json({ success: true, message: 'Subscribed successfully' });
    } catch (err) {
        console.error('Subscribe error:', err);
        return res.status(500).json({ success: false, message: 'Something went wrong, please try again' });
    }
};

// @desc    Get all subscribers (for you to view/export)
// @route   GET /api/subscribers
// @access  Private (you should protect this — see note below)
const getSubscribers = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, is_active, subscribed_at FROM subscribers ORDER BY subscribed_at DESC'
        );
        return res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
    } catch (err) {
        console.error('Get subscribers error:', err);
        return res.status(500).json({ success: false, message: 'Failed to fetch subscribers' });
    }
};

module.exports = { subscribe, getSubscribers };