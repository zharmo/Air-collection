const nodemailer = require('nodemailer');

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Send a generic email
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} html - HTML content
 */
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Air Collection" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
};

/**
 * Send password reset email
 * @param {string} to - user email
 * @param {string} resetToken - plain token (not hashed)
 */
const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.SITE_URL}/auth/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>You requested to reset your password for your Air Collection account.</p>
      <p>Click the link below to set a new password. This link expires in 10 minutes.</p>
      <a href="${resetUrl}" style="display: inline-block; background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 0;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
      <hr />
      <p style="font-size: 12px; color: #666;">Air Collection – Light as Air</p>
    </div>
  `;
  return sendEmail(to, 'Password Reset Request', html);
};

/**
 * Send order confirmation email
 * @param {string} to - customer email
 * @param {object} order - order details
 */
const sendOrderConfirmation = async (to, order) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>$${item.price}</td>
      <td>$${item.quantity * item.price}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Thank you for your order, ${order.userName}!</h2>
      <p>Order #${order.orderNumber}</p>
      <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot><tr><td colspan="3"><strong>Total</strong></td><td><strong>$${order.total}</strong></td></tr></tfoot>
      </table>
      <p>We'll notify you when your order ships.</p>
      <p>– Air Collection Team</p>
    </div>
  `;
  return sendEmail(to, `Order Confirmation #${order.orderNumber}`, html);
};

/**
 * Send contact form notification to admin
 * @param {string} name - sender name
 * @param {string} email - sender email
 * @param {string} subject - email subject
 * @param {string} message - email body
 */
const sendContactNotification = async (name, email, subject, message) => {
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>New Contact Message</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>
    </div>
  `;
  return sendEmail(process.env.ADMIN_EMAIL, `Contact: ${subject}`, html);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendOrderConfirmation,
  sendContactNotification,
};