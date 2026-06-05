const express = require('express');
const { sendContactNotification } = require('../services/emailService');
const router = express.Router();

router.post('/', async (req, res) => {
  const { fullName, email, subject, message } = req.body;
  if (!fullName || !email || !message) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }
  const sent = await sendContactNotification(fullName, email, subject, message);
  if (sent) {
    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

module.exports = router;