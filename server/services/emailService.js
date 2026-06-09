const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

dotenv.config({ path: path.join(__dirname, '../.env') });

/* ─────────────────────────────────────────────────────────────
 * Transporter
 * ───────────────────────────────────────────────────────────── */
const isEmailConfigured = () => Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const getAdminEmail = () => (process.env.ADMIN_EMAIL || process.env.EMAIL_USER || '').trim();

const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 465),
  secure: String(process.env.EMAIL_SECURE || 'true') === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ─────────────────────────────────────────────────────────────
 * Base send helper
 * ───────────────────────────────────────────────────────────── */
const sendEmail = async (to, subject, html, options = {}) => {
  try {
    if (!isEmailConfigured()) {
      console.error('Email service is not configured. Set EMAIL_USER and EMAIL_PASS in server/.env.');
      return false;
    }

    const transporter = createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Air Collection" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    if (options.replyTo) {
      mailOptions.replyTo = options.replyTo;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return false;
  }
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

/* ─────────────────────────────────────────────────────────────
 * Shared design tokens (inline — email clients ignore <style>)
 * ───────────────────────────────────────────────────────────── */
const T = {
  bg:         '#FAF9F7',
  surface:    '#FFFFFF',
  border:     '#E8E4DF',
  text:       '#0D0D0D',
  muted:      '#8A7F76',
  accent:     '#B8955A',
  accentBg:   '#F5EFE6',
  errorBg:    '#FFF5F5',
  fontStack:  'Georgia, "Times New Roman", serif',
  sansStack:  '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
};

/* ─────────────────────────────────────────────────────────────
 * Email wrapper shell  (shared header + footer)
 * ───────────────────────────────────────────────────────────── */
const shell = (content, previewText = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Air Collection</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${T.bg};font-family:${T.sansStack};-webkit-font-smoothing:antialiased;">
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${T.bg};">${previewText}</div>` : ''}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:${T.bg};padding:40px 16px 64px;">
    <tr><td align="center">

      <!-- Card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:600px;">

        <!-- Logo header -->
        <tr>
          <td style="padding:0 0 28px;text-align:center;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="border-bottom:1px solid ${T.border};padding-bottom:24px;text-align:center;">
                  <span style="font-family:${T.fontStack};font-size:26px;font-weight:700;
                               letter-spacing:0.12em;color:${T.text};text-transform:uppercase;">
                    AIR COLLECTION
                  </span>
                  <br/>
                  <span style="font-family:${T.sansStack};font-size:11px;letter-spacing:0.2em;
                               color:${T.accent};text-transform:uppercase;font-weight:500;">
                    Light as Air
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Main content -->
        <tr>
          <td style="background:${T.surface};border:1px solid ${T.border};">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:28px 0 0;text-align:center;">
            <p style="font-size:11px;color:${T.muted};margin:0 0 6px;letter-spacing:0.08em;text-transform:uppercase;">
              Air Collection · Hargeisa, Somaliland
            </p>
            <p style="font-size:11px;color:${T.muted};margin:0;">
              Questions? Reply to this email or contact our support team.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

/* ─────────────────────────────────────────────────────────────
 * Helper: items rows HTML
 * ───────────────────────────────────────────────────────────── */
const buildItemsTable = (items = []) => {
  const rows = items.map(item => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid ${T.border};
                 font-family:${T.sansStack};font-size:13px;color:${T.text};">
        <strong style="display:block;margin-bottom:3px;">${item.name || item.product_name || ''}</strong>
        <span style="color:${T.muted};font-size:11.5px;">
          ${item.size  ? `Size: ${item.size}` : ''}
          ${item.size && item.color ? ' &middot; ' : ''}
          ${item.color ? `Color: ${item.color}` : ''}
        </span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid ${T.border};
                 text-align:center;font-family:${T.sansStack};font-size:13px;
                 color:${T.muted};white-space:nowrap;">
        &times; ${item.quantity}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid ${T.border};
                 text-align:right;font-family:${T.sansStack};font-size:13px;
                 font-weight:600;color:${T.text};white-space:nowrap;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>`).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="border-collapse:collapse;border:1px solid ${T.border};">
      <thead>
        <tr style="background:${T.bg};">
          <th style="padding:10px 16px;text-align:left;font-family:${T.sansStack};
                     font-size:10px;font-weight:700;letter-spacing:0.12em;
                     text-transform:uppercase;color:${T.muted};border-bottom:1px solid ${T.border};">
            Product
          </th>
          <th style="padding:10px 16px;text-align:center;font-family:${T.sansStack};
                     font-size:10px;font-weight:700;letter-spacing:0.12em;
                     text-transform:uppercase;color:${T.muted};border-bottom:1px solid ${T.border};">
            Qty
          </th>
          <th style="padding:10px 16px;text-align:right;font-family:${T.sansStack};
                     font-size:10px;font-weight:700;letter-spacing:0.12em;
                     text-transform:uppercase;color:${T.muted};border-bottom:1px solid ${T.border};">
            Amount
          </th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
};

/* ─────────────────────────────────────────────────────────────
 * Helper: info row (label / value)
 * ───────────────────────────────────────────────────────────── */
const infoRow = (label, value, last = false) => `
  <tr>
    <td style="padding:9px 0;border-bottom:${last ? 'none' : `1px solid ${T.border}`};
               font-family:${T.sansStack};font-size:12px;color:${T.muted};font-weight:500;">
      ${label}
    </td>
    <td style="padding:9px 0;border-bottom:${last ? 'none' : `1px solid ${T.border}`};
               text-align:right;font-family:${T.sansStack};font-size:12.5px;
               color:${T.text};font-weight:600;">
      ${value || '—'}
    </td>
  </tr>`;

/* ─────────────────────────────────────────────────────────────
 * Helper: section heading inside email body
 * ───────────────────────────────────────────────────────────── */
const sectionHeading = (title) => `
  <p style="font-family:${T.sansStack};font-size:10px;font-weight:700;
             letter-spacing:0.14em;text-transform:uppercase;
             color:${T.accent};margin:0 0 14px;">
    ${title}
  </p>`;

/* ─────────────────────────────────────────────────────────────
 * 1.  CUSTOMER — Order Confirmation
 * ───────────────────────────────────────────────────────────── */
const sendOrderConfirmation = async (to, order) => {
  if (!to) return false;

  const {
    customerName, orderNumber, items = [],
    subtotal, deliveryFee, total,
    shippingAddress, location,
    advancePayment,           // { provider, amount, receiptName, senderPhone } | null
  } = order;

  const isOutside   = location === 'outside' || (shippingAddress || '').toLowerCase().includes('outside');
  const providerLbl = advancePayment?.provider === 'edahab' ? 'E-Dahab' : 'Zaad';

  /* ── Advance payment block (only for outside Hargeisa) ── */
  const advanceBlock = (isOutside && advancePayment) ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin-top:28px;background:#FBF7F0;border:1px solid #E8D9C0;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="font-family:${T.sansStack};font-size:10px;font-weight:700;
                     letter-spacing:0.14em;text-transform:uppercase;
                     color:${T.accent};margin:0 0 6px;">
            Advance Delivery Payment
          </p>
          <p style="font-family:Georgia,serif;font-size:14px;font-weight:700;
                     color:${T.text};margin:0 0 16px;">
            Your $${Number(advancePayment.amount).toFixed(2)} delivery payment is being verified
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${infoRow('Provider',      providerLbl)}
            ${infoRow('Receipt Name',  advancePayment.receiptName)}
            ${infoRow('Sent From',     advancePayment.senderPhone)}
            ${infoRow('Amount',        `$${Number(advancePayment.amount).toFixed(2)}`, true)}
          </table>
          <p style="font-family:${T.sansStack};font-size:11.5px;color:${T.muted};
                     margin:14px 0 0;line-height:1.6;">
            We will verify your payment before dispatching your order.
            If you have any issues, please contact us with your order number.
          </p>
        </td>
      </tr>
    </table>` : '';

  const content = `
    <!-- Hero -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:${T.accentBg};border-bottom:1px solid #E8D9C0;">
      <tr>
        <td style="padding:36px 40px;">
          <p style="font-family:${T.sansStack};font-size:11px;font-weight:600;
                     letter-spacing:0.16em;text-transform:uppercase;
                     color:${T.accent};margin:0 0 10px;">
            Order Confirmed
          </p>
          <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:700;
                      color:${T.text};margin:0 0 10px;line-height:1.2;">
            Thank you, ${customerName || 'valued customer'}!
          </h1>
          <p style="font-family:${T.sansStack};font-size:13.5px;color:${T.muted};
                     margin:0 0 16px;line-height:1.6;">
            We've received your order and will begin processing it shortly.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:${T.surface};border:1px solid #E8D9C0;
                          padding:8px 18px;font-family:${T.sansStack};
                          font-size:12px;font-weight:700;letter-spacing:0.08em;
                          color:${T.text};">
                ORDER #${orderNumber}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Body -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:32px 40px;">

          <!-- Items -->
          ${sectionHeading('Order Items')}
          ${buildItemsTable(items)}

          <!-- Totals -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="margin-top:4px;">
            <tr>
              <td style="padding:10px 16px;text-align:right;
                          font-family:${T.sansStack};font-size:12.5px;color:${T.muted};">
                Subtotal
              </td>
              <td style="padding:10px 16px;text-align:right;width:100px;
                          font-family:${T.sansStack};font-size:12.5px;
                          font-weight:500;color:${T.text};">
                $${Number(subtotal).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding:4px 16px;text-align:right;
                          font-family:${T.sansStack};font-size:12.5px;color:${T.muted};">
                Delivery Fee${isOutside ? ' (paid in advance)' : ''}
              </td>
              <td style="padding:4px 16px;text-align:right;
                          font-family:${T.sansStack};font-size:12.5px;
                          font-weight:500;color:${T.text};">
                $${Number(deliveryFee).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:0 16px;">
                <hr style="border:none;border-top:1.5px solid ${T.text};margin:10px 0 0;"/>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 16px;text-align:right;
                          font-family:Georgia,serif;font-size:16px;font-weight:700;color:${T.text};">
                Grand Total
              </td>
              <td style="padding:10px 16px;text-align:right;
                          font-family:${T.sansStack};font-size:20px;font-weight:700;color:${T.text};">
                $${Number(total).toFixed(2)}
              </td>
            </tr>
          </table>

          <!-- Shipping -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="margin-top:28px;border-top:1px solid ${T.border};padding-top:24px;">
            <tr>
              <td style="padding-top:24px;">
                ${sectionHeading('Shipping Address')}
                <p style="font-family:${T.sansStack};font-size:13px;color:${T.text};
                           margin:0;line-height:1.8;">
                  ${(shippingAddress || '').split(',').map(p => p.trim()).filter(Boolean).join('<br/>')}
                </p>
              </td>
            </tr>
          </table>

          <!-- Payment method -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="margin-top:28px;border-top:1px solid ${T.border};">
            <tr>
              <td style="padding-top:24px;">
                ${sectionHeading('Payment Method')}
                <p style="font-family:${T.sansStack};font-size:13px;color:${T.text};margin:0 0 4px;">
                  💵&nbsp; Cash on Delivery
                </p>
                <p style="font-family:${T.sansStack};font-size:12px;color:${T.muted};margin:0;">
                  ${isOutside
                    ? 'Delivery fee paid in advance. Product total collected upon delivery.'
                    : 'Pay the full amount when your order arrives.'}
                </p>
              </td>
            </tr>
          </table>

          <!-- Advance payment block -->
          ${advanceBlock}

          <!-- Delivery estimate -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="margin-top:28px;background:${T.bg};border:1px solid ${T.border};">
            <tr>
              <td style="padding:18px 22px;">
                <p style="font-family:${T.sansStack};font-size:12px;font-weight:700;
                           color:${T.text};margin:0 0 4px;">
                  📦 Estimated Delivery: 3–5 Business Days
                </p>
                <p style="font-family:${T.sansStack};font-size:12px;color:${T.muted};margin:0;line-height:1.6;">
                  We'll notify you once your order has been handed to our courier.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>`;

  return sendEmail(
    to,
    `Order Confirmed — #${orderNumber} | Air Collection`,
    shell(content, `Your order #${orderNumber} has been confirmed. Thank you for shopping with Air Collection.`)
  );
};

/* ─────────────────────────────────────────────────────────────
 * 2.  ADMIN — New Order Alert
 * ───────────────────────────────────────────────────────────── */
const sendNewOrderNotification = async (order) => {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    console.warn('⚠️  ADMIN_EMAIL not set — skipping admin notification');
    return false;
  }

  const {
    customerName, customerEmail, customerPhone,
    orderNumber, items = [],
    subtotal, deliveryFee, total,
    shippingAddress, location,
    paymentMethod,
    advancePayment,
  } = order;

  const isOutside    = location === 'outside' || (shippingAddress || '').toLowerCase().includes('outside');
  const providerLbl  = advancePayment?.provider === 'edahab' ? 'E-Dahab' : 'Zaad';

  /* ── Advance payment section for admin ── */
  const advanceSection = (isOutside && advancePayment) ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin-top:24px;background:#FBF7F0;border:1px solid #E8D9C0;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="font-family:${T.sansStack};font-size:10px;font-weight:700;
                     letter-spacing:0.14em;text-transform:uppercase;
                     color:${T.accent};margin:0 0 12px;">
            ⚠️  Advance Delivery Payment — Verify Before Dispatching
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${infoRow('Provider',      providerLbl)}
            ${infoRow('Amount Paid',   `$${Number(advancePayment.amount).toFixed(2)}`)}
            ${infoRow('Receipt Name',  `<strong>${advancePayment.receiptName}</strong>`)}
            ${infoRow('Sent From',     `<strong>${advancePayment.senderPhone}</strong>`, true)}
          </table>
        </td>
      </tr>
    </table>` : '';

  const content = `
    <!-- Alert hero -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#0D0D0D;">
      <tr>
        <td style="padding:28px 40px;">
          <p style="font-family:${T.sansStack};font-size:10px;font-weight:700;
                     letter-spacing:0.18em;text-transform:uppercase;
                     color:${T.accent};margin:0 0 8px;">
            New Order Received
          </p>
          <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;
                      color:#FFFFFF;margin:0 0 6px;line-height:1.2;">
            Order #${orderNumber}
          </h1>
          <p style="font-family:${T.sansStack};font-size:12px;color:#8A7F76;margin:0;">
            ${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            &nbsp;·&nbsp;
            ${isOutside ? 'Outside Hargeisa' : 'Inside Hargeisa'}
          </p>
        </td>
      </tr>
    </table>

    <!-- Body -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:32px 40px;">

          <!-- Customer info -->
          ${sectionHeading('Customer Details')}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="margin-bottom:28px;">
            ${infoRow('Full Name',  customerName)}
            ${infoRow('Email',      customerEmail)}
            ${infoRow('Phone',      customerPhone)}
            ${infoRow('Address',    shippingAddress)}
            ${infoRow('Zone',       isOutside ? 'Outside Hargeisa' : 'Inside Hargeisa', true)}
          </table>

          <!-- Items -->
          ${sectionHeading('Order Items')}
          ${buildItemsTable(items)}

          <!-- Totals -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="margin-top:4px;">
            <tr>
              <td style="padding:10px 16px;text-align:right;
                          font-family:${T.sansStack};font-size:12.5px;color:${T.muted};">
                Subtotal
              </td>
              <td style="padding:10px 16px;text-align:right;width:100px;
                          font-family:${T.sansStack};font-size:12.5px;
                          font-weight:500;color:${T.text};">
                $${Number(subtotal).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding:4px 16px;text-align:right;
                          font-family:${T.sansStack};font-size:12.5px;color:${T.muted};">
                Delivery Fee
              </td>
              <td style="padding:4px 16px;text-align:right;
                          font-family:${T.sansStack};font-size:12.5px;
                          font-weight:500;color:${T.text};">
                $${Number(deliveryFee).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:0 16px;">
                <hr style="border:none;border-top:1.5px solid ${T.text};margin:10px 0 0;"/>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 16px;text-align:right;
                          font-family:Georgia,serif;font-size:16px;font-weight:700;color:${T.text};">
                Grand Total
              </td>
              <td style="padding:10px 16px;text-align:right;
                          font-family:${T.sansStack};font-size:20px;font-weight:700;color:${T.text};">
                $${Number(total).toFixed(2)}
              </td>
            </tr>
          </table>

          <!-- Payment -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="margin-top:28px;border-top:1px solid ${T.border};">
            <tr>
              <td style="padding-top:24px;">
                ${sectionHeading('Payment')}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${infoRow('Method', 'Cash on Delivery')}
                  ${infoRow('Status', 'Pending')}
                  ${infoRow('Zone',   isOutside ? 'Outside Hargeisa — delivery fee paid in advance' : 'Inside Hargeisa', true)}
                </table>
              </td>
            </tr>
          </table>

          <!-- Advance payment details -->
          ${advanceSection}

        </td>
      </tr>
    </table>`;

  return sendEmail(
    adminEmail,
    `🛍️ New Order #${orderNumber} — $${Number(total).toFixed(2)} | Air Collection`,
    shell(content, `New order #${orderNumber} from ${customerName} — $${Number(total).toFixed(2)}`)
  );
};

/* ─────────────────────────────────────────────────────────────
 * 3.  Password reset  (unchanged logic, updated style)
 * ───────────────────────────────────────────────────────────── */
const sendPasswordResetEmail = async (to, resetToken) => {
  const siteUrl = process.env.FRONTEND_URL || process.env.SITE_URL || 'http://localhost:3000';
  const resetUrl = `${siteUrl}/auth/reset-password?token=${resetToken}`;

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:40px;">
          <p style="font-family:${T.sansStack};font-size:10px;font-weight:700;
                     letter-spacing:0.16em;text-transform:uppercase;
                     color:${T.accent};margin:0 0 10px;">
            Password Reset
          </p>
          <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:700;
                      color:${T.text};margin:0 0 16px;line-height:1.2;">
            Reset Your Password
          </h1>
          <p style="font-family:${T.sansStack};font-size:13.5px;color:${T.muted};
                     margin:0 0 28px;line-height:1.7;">
            You requested a password reset for your Air Collection account.
            Click the button below to set a new password.
            This link expires in <strong style="color:${T.text};">10 minutes</strong>.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:${T.text};">
                <a href="${resetUrl}"
                   style="display:inline-block;padding:16px 36px;
                          font-family:${T.sansStack};font-size:12px;
                          font-weight:700;letter-spacing:0.12em;
                          text-transform:uppercase;color:#FFFFFF;
                          text-decoration:none;">
                  Reset Password
                </a>
              </td>
            </tr>
          </table>
          <p style="font-family:${T.sansStack};font-size:11.5px;color:${T.muted};
                     margin:24px 0 0;line-height:1.6;">
            If you did not request this, you can safely ignore this email.
            Your password will not change.
          </p>
        </td>
      </tr>
    </table>`;

  return sendEmail(to, 'Reset Your Password — Air Collection', shell(content));
};

/* ─────────────────────────────────────────────────────────────
 * 4.  Contact form notification  (unchanged logic, updated style)
 * ───────────────────────────────────────────────────────────── */
const sendContactNotification = async (name, email, subject, message) => {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    console.warn('⚠️  ADMIN_EMAIL not set in .env — contact notification skipped');
    return false;
  }

  const contactName = String(name || '').trim();
  const contactEmail = String(email || '').trim();
  const contactSubject = String(subject || '').trim() || 'General Inquiry';
  const contactMessage = String(message || '').trim();

  const safeName = escapeHtml(contactName);
  const safeEmail = escapeHtml(contactEmail);
  const safeSubject = escapeHtml(contactSubject);
  const safeMessage = escapeHtml(contactMessage).replace(/\n/g, '<br/>');

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:32px 40px;">
          <p style="font-family:${T.sansStack};font-size:10px;font-weight:700;
                     letter-spacing:0.16em;text-transform:uppercase;
                     color:${T.accent};margin:0 0 10px;">
            Contact Form Submission
          </p>
          <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;
                      color:${T.text};margin:0 0 24px;">
            New Message
          </h1>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="margin-bottom:24px;">
            ${infoRow('From',    `${safeName} &lt;${safeEmail}&gt;`)}
            ${infoRow('Subject', safeSubject, true)}
          </table>
          <p style="font-family:${T.sansStack};font-size:10px;font-weight:700;
                     letter-spacing:0.12em;text-transform:uppercase;
                     color:${T.muted};margin:0 0 10px;">
            Message
          </p>
          <div style="background:${T.bg};border:1px solid ${T.border};
                       padding:16px 20px;font-family:${T.sansStack};
                       font-size:13.5px;color:${T.text};line-height:1.7;">
            ${safeMessage}
          </div>
        </td>
      </tr>
    </table>`;

  return sendEmail(
    adminEmail,
    `Contact: ${contactSubject} - from ${contactName}`,
    shell(content, `New message from ${contactName}: ${contactSubject}`),
    { replyTo: contactEmail }
  );
};

/* ─────────────────────────────────────────────────────────────
 * Exports
 * ───────────────────────────────────────────────────────────── */
module.exports = {
  sendEmail,
  isEmailConfigured,
  getAdminEmail,
  sendPasswordResetEmail,
  sendOrderConfirmation,
  sendNewOrderNotification,
  sendContactNotification,
};
