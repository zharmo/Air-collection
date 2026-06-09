const express = require('express');
const { getAdminEmail, isEmailConfigured, sendContactNotification } = require('../services/emailService');
const router = express.Router();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

router.post('/', async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const subject = String(req.body.subject || '').trim() || 'General Inquiry';
    const message = String(req.body.message || '').trim();

    if (!fullName || !email || !message) {
      return res.status(400).json({ success: false, message: 'Full name, email and message are required.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    if (!isEmailConfigured() || !getAdminEmail()) {
      return res.status(500).json({
        success: false,
        message: 'Contact email is not configured. Add EMAIL_USER, EMAIL_PASS and ADMIN_EMAIL in server/.env.',
      });
    }

    const sent = await sendContactNotification(fullName, email, subject, message);
    if (!sent) {
      return res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
    }

    return res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;
