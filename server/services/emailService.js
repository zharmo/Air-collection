const path = require("path");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

dotenv.config({ path: path.join(__dirname, "../.env") });

/* ═══════════════════════════════════════════════════════════════
 * TRANSPORT
 * ═══════════════════════════════════════════════════════════════ */
const isEmailConfigured = () =>
  Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const getAdminEmail = () =>
  (process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "").trim();

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT || 465),
    secure: String(process.env.EMAIL_SECURE || "true") === "true",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

const sendEmail = async (to, subject, html, options = {}) => {
  try {
    if (!isEmailConfigured()) {
      console.error(
        "Email not configured — set EMAIL_USER and EMAIL_PASS in server/.env",
      );
      return false;
    }
    const transporter = createTransporter();
    const mail = {
      from:
        process.env.EMAIL_FROM ||
        `"Air Collection" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };
    if (options.replyTo) mail.replyTo = options.replyTo;
    const info = await transporter.sendMail(mail);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error("❌ Email error:", err.message);
    return false;
  }
};

const escapeHtml = (v = "") =>
  String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/* ═══════════════════════════════════════════════════════════════
 * MOBILE PAYMENT NORMALISATION
 * ═══════════════════════════════════════════════════════════════ */
const normaliseMP = (mp) => {
  if (!mp || !mp.provider) return null;
  const provider = (mp.provider || "").toLowerCase();
  return {
    provider,
    providerLabel:
      provider === "edahab"
        ? "E-Dahab"
        : provider === "zaad"
          ? "Zaad"
          : mp.provider,
    senderPhone: mp.transfer_phone || mp.transferPhone || "",
    receiptName: mp.transfer_name || mp.transferName || "",
    amount: Number(mp.amount_paid ?? mp.amountPaid ?? 0),
  };
};

/* ═══════════════════════════════════════════════════════════════
 * CITY / LOCATION DETECTION
 * ═══════════════════════════════════════════════════════════════ */
const OUTSIDE_CITIES_LC = ["burco", "boorama", "berbera", "borama", "others"];
const OUTSIDE_CITIES_LABELS = {
  burco: "Burco",
  boorama: "Boorama",
  borama: "Boorama",
  berbera: "Berbera",
  others: "Others",
};

const resolveLocation = ({
  location = "",
  city = "",
  shippingAddress = "",
  streetAddress = "",
}) => {
  const combined = [location, city, shippingAddress, streetAddress]
    .join(" ")
    .toLowerCase()
    .replace(/[,.\-]/g, " ");

  const words = combined.split(/\s+/).filter(Boolean);
  const foundWord = words.find((w) => OUTSIDE_CITIES_LC.includes(w)) || null;

  const isOutside =
    location === "outside" ||
    combined.includes("outside") ||
    (!!city && OUTSIDE_CITIES_LC.includes(city.toLowerCase())) ||
    foundWord !== null;

  const cityKey =
    (city && OUTSIDE_CITIES_LC.includes(city.toLowerCase())
      ? city.toLowerCase()
      : null) ||
    foundWord ||
    null;

  const rawCity = cityKey ? OUTSIDE_CITIES_LABELS[cityKey] || city || "" : "";
  const cityLabel = isOutside
    ? rawCity
      ? `Outside Hargeisa / ${rawCity}`
      : "Outside Hargeisa"
    : "Inside Hargeisa";

  const addrLine =
    streetAddress ||
    (shippingAddress ? shippingAddress.split(",")[0].trim() : "") ||
    shippingAddress;

  return { isOutside, rawCity, cityLabel, addrLine };
};

/* ═══════════════════════════════════════════════════════════════
 * DESIGN TOKENS
 * ═══════════════════════════════════════════════════════════════ */
const T = {
  bg: "#F9F8F6",
  surface: "#FFFFFF",
  border: "#E5E0DA",
  text: "#0D0D0D",
  muted: "#7A7068",
  accent: "#B8955A",
  accentBg: "#F5EFE6",
  green: "#166534",
  greenBg: "#F0FDF4",
  greenBdr: "#BBF7D0",
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
};

/* ═══════════════════════════════════════════════════════════════
 * LOGO
 * ═══════════════════════════════════════════════════════════════ */
const logoHtml = () => {
  const base = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
  if (base) {
    return `<img src="${base}/images/hero/air-collection-hero.jpg" alt="Air Collection"
                 width="160" style="display:block;max-width:160px;height:auto;margin:0 auto 4px;border:0;"/>`;
  }
  return `<span style="font-family:${T.serif};font-size:26px;font-weight:700;
                        letter-spacing:0.12em;color:${T.text};text-transform:uppercase;">
            AIR COLLECTION
          </span>`;
};

/* ═══════════════════════════════════════════════════════════════
 * EMAIL SHELL — shared header / footer wrapper
 * ═══════════════════════════════════════════════════════════════ */
const shell = (content, preview = "", hideLogo = false) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Air Collection</title>
</head>
<body style="margin:0;padding:0;background:${T.bg};font-family:${T.sans};-webkit-font-smoothing:antialiased;">
  ${preview ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:${T.bg};">${preview}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:${T.bg};padding:40px 16px 64px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:600px;">

        ${
          !hideLogo
            ? `<tr>
                <td align="center" style="padding:0 0 24px; text-align: center;">
                  ${logoHtml()}
                </td>
              </tr>`
            : ""
        }

        <tr>
          <td style="background:${T.surface};border:1px solid ${T.border};">
            ${content}
          </td>
        </tr>

        <tr>
          <td style="padding:24px 0 0;text-align:center;">
            <p style="font-size:11px;color:${T.muted};margin:0 0 4px;letter-spacing:0.08em;text-transform:uppercase;">
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

/* ═══════════════════════════════════════════════════════════════
 * SHARED LAYOUT HELPERS
 * ═══════════════════════════════════════════════════════════════ */
const sectionLine = (title) => `
  <tr>
    <td colspan="2" style="padding:28px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding-bottom:12px;border-bottom:1px solid ${T.border};">
        <tr>
          <td style="vertical-align: middle; width: 28px;">
            <span style="display:block;width:20px;height:1px;background:${T.accent};"></span>
          </td>
          <td style="vertical-align: middle;">
            <span style="font-family:${T.sans};font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${T.muted};">${title}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

const cell2 = (label, value) => `
  <td style="padding:10px 0;vertical-align:top;width:50%;">
    <div style="font-family:${T.sans};font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${T.muted};margin-bottom:4px;">${label}</div>
    <div style="font-family:${T.sans};font-size:14px;font-weight:500;color:${T.text};line-height:1.4;">
      ${value || "—"}
    </div>
  </td>`;

const cityPill = (label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;background:${T.accentBg};border:1px solid rgba(184,149,90,0.35);padding:4px 14px;">
    <tr>
      <td style="font-family:${T.sans};font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${T.text};">
        📍 ${label}
      </td>
    </tr>
  </table>`;

const itemsTable = (items = []) => {
  if (!items.length)
    return '<p style="font-size:13px;color:#999;padding:16px 0;">No items</p>';
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid ${T.border};font-family:${T.sans};">
        <strong style="display:block;font-size:13px;font-weight:600;color:${T.text};margin-bottom:2px;">
          ${escapeHtml(item.name || item.product_name || "")}
        </strong>
        <span style="font-size:11.5px;color:${T.muted};">
          ${item.size ? `Size: ${item.size}` : ""}
          ${item.size && item.color ? " · " : ""}
          ${item.color ? `Color: ${item.color}` : ""}
        </span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid ${T.border};text-align:center;
                 font-family:${T.sans};font-size:13px;color:${T.muted};white-space:nowrap;">
        &times; ${item.quantity}
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid ${T.border};text-align:right;
                 font-family:${T.sans};font-size:13px;font-weight:600;color:${T.text};white-space:nowrap;">
        $${(Number(item.price) * Number(item.quantity)).toFixed(2)}
      </td>
    </tr>`,
    )
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="border-collapse:collapse;border:1px solid ${T.border};margin-top:16px;">
      <thead>
        <tr style="background:${T.bg};">
          <th style="padding:9px 16px;text-align:left;font-family:${T.sans};font-size:10px;font-weight:700;
                     letter-spacing:0.12em;text-transform:uppercase;color:${T.muted};
                     border-bottom:1px solid ${T.border};">Product</th>
          <th style="padding:9px 16px;text-align:center;font-family:${T.sans};font-size:10px;font-weight:700;
                     letter-spacing:0.12em;text-transform:uppercase;color:${T.muted};
                     border-bottom:1px solid ${T.border};">Qty</th>
          <th style="padding:9px 16px;text-align:right;font-family:${T.sans};font-size:10px;font-weight:700;
                     letter-spacing:0.12em;text-transform:uppercase;color:${T.muted};
                     border-bottom:1px solid ${T.border};">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
};

const totalsBlock = (subtotal, deliveryFee, total) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:2px;">
    <tr>
      <td style="padding:8px 16px;text-align:right;font-family:${T.sans};font-size:12.5px;color:${T.muted};">Subtotal</td>
      <td style="padding:8px 16px;text-align:right;width:110px;font-family:${T.sans};font-size:12.5px;font-weight:500;color:${T.text};">$${Number(subtotal || 0).toFixed(2)}</td>
    </tr>
    ${
      Number(deliveryFee) > 0
        ? `
    <tr>
      <td style="padding:4px 16px;text-align:right;font-family:${T.sans};font-size:12.5px;color:${T.muted};">Delivery</td>
      <td style="padding:4px 16px;text-align:right;font-family:${T.sans};font-size:12.5px;font-weight:500;color:${T.text};">$${Number(deliveryFee).toFixed(2)}</td>
    </tr>`
        : ""
    }
    <tr><td colspan="2" style="padding:0 16px;"><hr style="border:none;border-top:1.5px solid ${T.text};margin:8px 0 0;"/></td></tr>
    <tr>
      <td style="padding:10px 16px;text-align:right;font-family:${T.serif};font-size:16px;font-weight:700;color:${T.text};">TOTAL</td>
      <td style="padding:10px 16px;text-align:right;font-family:${T.sans};font-size:20px;font-weight:700;color:${T.text};">$${Number(total || 0).toFixed(2)}</td>
    </tr>
  </table>`;

const mpProofBox = (proof, forAdmin = false) => {
  if (!proof) return "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="margin-top:20px;background:#FBF7F0;border:1px solid #E2D4BE;">
      <tr>
        <td style="padding:22px 24px;">
          <div style="font-family:${T.sans};font-size:10px;font-weight:700;letter-spacing:0.18em;
                      text-transform:uppercase;color:${T.accent};margin-bottom:14px;">
            ${forAdmin ? "⚠️   Verify This Transfer Before Shipping" : "Transfer Details You Submitted"}
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:0 16px 14px 0;width:50%;vertical-align:top;">
                <div style="font-family:${T.sans};font-size:10px;font-weight:600;letter-spacing:0.16em;
                            text-transform:uppercase;color:${T.muted};margin-bottom:4px;">Provider</div>
                <div style="font-family:${T.serif};font-size:20px;font-weight:600;color:${T.text};">${proof.providerLabel}</div>
              </td>
              <td style="padding:0 0 14px;width:50%;vertical-align:top;">
                <div style="font-family:${T.sans};font-size:10px;font-weight:600;letter-spacing:0.16em;
                            text-transform:uppercase;color:${T.muted};margin-bottom:4px;">Amount ${forAdmin ? "Claimed" : "Paid"}</div>
                <div style="font-family:${T.serif};font-size:20px;font-weight:600;color:${T.text};">$${Number(proof.amount).toFixed(2)}</div>
              </td>
            </tr>
            <tr style="border-top:1px solid ${T.border};">
              <td style="padding:14px 16px 0 0;width:50%;vertical-align:top;">
                <div style="font-family:${T.sans};font-size:10px;font-weight:600;letter-spacing:0.16em;
                            text-transform:uppercase;color:${T.muted};margin-bottom:4px;">Sent From Number</div>
                <div style="font-family:${T.serif};font-size:20px;font-weight:600;color:${T.text};word-break:break-all;">${proof.senderPhone || "—"}</div>
              </td>
              <td style="padding:14px 0 0;width:50%;vertical-align:top;">
                <div style="font-family:${T.sans};font-size:10px;font-weight:600;letter-spacing:0.16em;
                            text-transform:uppercase;color:${T.muted};margin-bottom:4px;">Name on Transfer</div>
                <div style="font-family:${T.serif};font-size:20px;font-weight:600;color:${T.text};">${proof.receiptName || "—"}</div>
              </td>
            </tr>
          </table>
          ${
            forAdmin
              ? `
          <p style="font-family:${T.sans};font-size:11.5px;color:${T.muted};margin:16px 0 0;line-height:1.6;">
            ⚠️ Check your ${proof.providerLabel} account to confirm this transfer before processing the order.
            Number: <strong>${proof.senderPhone}</strong> · Name: <strong>${proof.receiptName}</strong>
          </p>`
              : `
          <p style="font-family:${T.sans};font-size:11.5px;color:${T.muted};margin:16px 0 0;line-height:1.6;">
            We will verify your payment shortly and update your order status.
          </p>`
          }
        </td>
      </tr>
    </table>`;
};

/* ═══════════════════════════════════════════════════════════════
 * 1. CUSTOMER — Order Confirmation
 * ═══════════════════════════════════════════════════════════════ */
const sendOrderConfirmation = async (to, order) => {
  if (!to) return false;

  const customerName =
    order.customerName || order.customer_name || order.name || "";
  const customerEmail =
    order.customerEmail || order.customer_email || order.email || to;
  const customerPhone =
    order.customerPhone || order.customer_phone || order.phone || "";
  const orderNumber = order.orderNumber || order.order_number || "";
  const items = order.items || [];
  const subtotal = order.subtotal || 0;
  const deliveryFee = order.deliveryFee || order.delivery_fee || 0;
  const total = order.total || order.total_amount || 0;
  const paymentMethod =
    order.paymentMethod || order.payment_method || "cash_on_delivery";
  const mobilePayment = order.mobilePayment || order.mobile_payment || null;

  const isMobileMoney = paymentMethod === "zaad" || paymentMethod === "edahab";
  const proof = normaliseMP(mobilePayment);

  const { isOutside, cityLabel, addrLine } = resolveLocation({
    location: order.location || "",
    city: order.city || order.customer_city || "",
    shippingAddress: order.shippingAddress || order.shipping_address || "",
    streetAddress: order.streetAddress || order.street_address || "",
  });

  const orderDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:${T.greenBg};border-bottom:1px solid ${T.greenBdr};">
      <tr>
        <td style="padding:28px 32px;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;padding-right:16px;">
                <div style="width:44px;height:44px;background:${T.green};border-radius:50%;
                            text-align:center;line-height:44px;color:#fff;font-size:22px;font-weight:700;">✓</div>
              </td>
              <td style="vertical-align:middle;">
                <div style="font-family:${T.sans};font-size:10px;font-weight:700;letter-spacing:0.2em;
                            text-transform:uppercase;color:${T.green};margin-bottom:4px;">Order Confirmed</div>
                <div style="font-family:${T.serif};font-size:22px;font-weight:700;color:${T.text};line-height:1.2;">
                  Thank you, ${escapeHtml(customerName || "valued customer")}.
                </div>
                <div style="font-family:${T.sans};font-size:12px;color:${T.muted};margin-top:4px;">
                  Order #${orderNumber} &nbsp;·&nbsp; ${orderDate}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

      ${sectionLine("Shipping Details")}
      <tr>
        <td colspan="2" style="padding:16px 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${cell2("Full Name", escapeHtml(customerName))}
              ${cell2("Phone", escapeHtml(customerPhone))}
            </tr>
            <tr>
              ${cell2("Email", escapeHtml(customerEmail))}
              ${cell2("Street Address", escapeHtml(addrLine))}
            </tr>
          </table>
          <div style="margin-top:12px;">${cityPill(cityLabel)}</div>
        </td>
      </tr>

      ${sectionLine("Payment")}
      <tr>
        <td colspan="2" style="padding:16px 32px 8px;">
          ${
            isMobileMoney
              ? `
            <div style="font-family:${T.sans};font-size:13px;font-weight:600;color:${T.text};margin-bottom:6px;">
              📱 Mobile Money — ${proof ? proof.providerLabel : paymentMethod}
            </div>
            <div style="font-family:${T.sans};font-size:13px;font-weight:300;color:${T.muted};line-height:1.6;">
              Your payment is being verified. We will confirm within a few minutes.
            </div>
            ${mpProofBox(proof, false)}
          `
              : `
            <div style="font-family:${T.sans};font-size:13px;font-weight:600;color:${T.text};margin-bottom:6px;">
              💵 Cash on Delivery
            </div>
            <div style="font-family:${T.sans};font-size:13px;font-weight:300;color:${T.muted};line-height:1.6;">
              Please have $${Number(total).toFixed(2)} ready when your order arrives.
            </div>
          `
          }
        </td>
      </tr>

      ${sectionLine("Items Ordered")}
      <tr>
        <td colspan="2" style="padding:16px 32px 0;">
          ${itemsTable(items)}
          ${totalsBlock(subtotal, deliveryFee, total)}
        </td>
      </tr>

      ${sectionLine("Estimated Delivery")}
      <tr>
        <td colspan="2" style="padding:16px 32px 36px;">
          <div style="font-family:${T.sans};font-size:15px;font-weight:600;color:${T.text};margin-bottom:6px;">
            3 — 5 Business Days
          </div>
          <div style="font-family:${T.sans};font-size:13px;font-weight:300;color:${T.muted};line-height:1.6;">
            We will send you a notification once your order is on its way.
            ${isOutside ? `Delivery to ${escapeHtml(cityLabel)} may take slightly longer than our Hargeisa estimates.` : ""}
          </div>
        </td>
      </tr>

    </table>`;

  // Notice the 3rd parameter passed here is `true` to hide the logo section
  return sendEmail(
    to,
    `Order Confirmed — #${orderNumber} | Air Collection`,
    shell(
      content,
      `Your order #${orderNumber} is confirmed. Thank you for shopping with Air Collection.`,
      true,
    ),
  );
};

/* ═══════════════════════════════════════════════════════════════
 * 2. ADMIN — New Order Alert
 * ═══════════════════════════════════════════════════════════════ */
const sendNewOrderNotification = async (order) => {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    console.warn("⚠️  ADMIN_EMAIL not set — skipping admin notification");
    return false;
  }

  const name = order.customerName || order.customer_name || order.name || "";
  const email =
    order.customerEmail || order.customer_email || order.email || "";
  const phone =
    order.customerPhone || order.customer_phone || order.phone || "";
  const orderNumber = order.orderNumber || order.order_number || "";
  const orderId = order.orderId || order.id || "";
  const items = order.items || [];
  const subtotal = order.subtotal || 0;
  const deliveryFee = order.deliveryFee || order.delivery_fee || 0;
  const total = order.total || order.total_amount || 0;
  const paymentMethod =
    order.paymentMethod || order.payment_method || "cash_on_delivery";
  const mobilePayment = order.mobilePayment || order.mobile_payment || null;

  const isMobileMoney = paymentMethod === "zaad" || paymentMethod === "edahab";
  const proof = normaliseMP(mobilePayment);

  const { isOutside, cityLabel, addrLine } = resolveLocation({
    location: order.location || "",
    city: order.city || order.customer_city || order.shipping_city || "",
    shippingAddress: order.shippingAddress || order.shipping_address || "",
    streetAddress: order.streetAddress || order.street_address || "",
  });

  const orderDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const dashLink = `${(process.env.FRONTEND_URL || "").replace(/\/$/, "")}/admin/orders/${orderId}`;

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;">
      <tr>
        <td style="padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <div style="font-family:${T.sans};font-size:10px;font-weight:700;letter-spacing:0.18em;
                            text-transform:uppercase;color:${T.accent};margin-bottom:4px;">New Order Received</div>
                <div style="font-family:${T.serif};font-size:22px;font-weight:700;color:#fff;line-height:1.2;">
                  Order #${orderNumber} — ${orderDate}
                </div>
              </td>
              <td style="vertical-align:middle;text-align:right;padding-left:16px;">
                <span style="font-family:${T.sans};font-size:10px;font-weight:700;letter-spacing:0.14em;
                             text-transform:uppercase;color:${T.accent};border:1px solid ${T.accent};
                             padding:5px 12px;white-space:nowrap;">Admin Notification</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:#FBF7F0;border-bottom:1px solid ${T.border};">
      <tr>
        <td style="padding:16px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <span style="font-family:${T.sans};font-size:12px;color:${T.muted};">
                  <span style="display:inline-block;width:8px;height:8px;background:${T.accent};
                               border-radius:50%;margin-right:6px;vertical-align:middle;"></span>
                  <strong style="color:${T.text};">New order received</strong> — verify and process.
                </span>
              </td>
              <td style="text-align:right;vertical-align:middle;padding-left:16px;">
                <a href="${dashLink}"
                   style="display:inline-block;background:${T.text};color:#fff;font-family:${T.sans};
                          font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;
                          text-decoration:none;padding:10px 20px;white-space:nowrap;">
                  View Order in Dashboard →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

      ${sectionLine("Customer")}
      <tr>
        <td colspan="2" style="padding:16px 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${cell2("Name", escapeHtml(name))}
              ${cell2("Phone", escapeHtml(phone))}
            </tr>
            <tr>
              ${cell2("Email", escapeHtml(email))}
              ${cell2("Account", order.userId ? "Registered" : "Guest")}
            </tr>
          </table>
        </td>
      </tr>

      ${sectionLine("Shipping & Location")}
      <tr>
        <td colspan="2" style="padding:16px 32px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${cell2("Street Address", escapeHtml(addrLine))}
              ${cell2("City / Area", escapeHtml(cityLabel))}
            </tr>
          </table>
          <div style="margin-top:12px;">${cityPill(cityLabel)}</div>
        </td>
      </tr>

      ${sectionLine("Payment Method")}
      <tr>
        <td colspan="2" style="padding:16px 32px 8px;">
          ${
            isMobileMoney
              ? `
            <span style="display:inline-block;background:${T.text};color:#fff;font-family:${T.sans};
                         font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;
                         padding:6px 16px;margin-bottom:14px;">
              📱 ${proof ? proof.providerLabel : paymentMethod}
            </span>
            <div style="font-family:${T.sans};font-size:13px;font-weight:300;color:${T.muted};line-height:1.6;margin-bottom:0;">
              Customer paid via mobile money. Verify before dispatching.
            </div>
            ${mpProofBox(proof, true)}
          `
              : `
            <span style="display:inline-block;background:${T.greenBg};color:${T.green};
                         border:1px solid ${T.greenBdr};font-family:${T.sans};font-size:10px;font-weight:700;
                         letter-spacing:0.14em;text-transform:uppercase;padding:6px 16px;margin-bottom:10px;">
              🛍️ Cash on Delivery
            </span>
            <div style="font-family:${T.sans};font-size:13px;font-weight:300;color:${T.muted};line-height:1.6;">
              Collect $${Number(total).toFixed(2)} upon delivery.
            </div>
          `
          }
        </td>
      </tr>

      ${sectionLine(`Items — ${items.length} item${items.length !== 1 ? "s" : ""}`)}
      <tr>
        <td colspan="2" style="padding:16px 32px 32px;">
          ${itemsTable(items)}
          ${totalsBlock(subtotal, deliveryFee, total)}
        </td>
      </tr>

    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D0D;">
      <tr>
        <td style="padding:14px 32px;text-align:center;">
          <span style="font-family:${T.sans};font-size:11px;color:#8A7F76;">
            Air Collection Admin System &nbsp;·&nbsp;
            <a href="${dashLink}" style="color:${T.accent};text-decoration:none;">Open Dashboard</a>
          </span>
          <div style="font-family:${T.sans};font-size:10px;color:#555;margin-top:4px;">
            This is an automated notification. Do not reply to this email.
          </div>
        </td>
      </tr>
    </table>`;

  return sendEmail(
    adminEmail,
    `🛍️ New Order #${orderNumber} — $${Number(total).toFixed(2)} | Air Collection`,
    shell(
      content,
      `New order #${orderNumber} from ${name} — $${Number(total).toFixed(2)}`,
    ),
  );
};

/* ═══════════════════════════════════════════════════════════════
 * 3. Password Reset
 * ═══════════════════════════════════════════════════════════════ */
const sendPasswordResetEmail = async (to, resetToken) => {
  const siteUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${siteUrl}/auth/reset-password?token=${resetToken}`;
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:40px 32px;">
          <p style="font-family:${T.sans};font-size:10px;font-weight:700;letter-spacing:0.16em;
                    text-transform:uppercase;color:${T.accent};margin:0 0 10px;">Password Reset</p>
          <h1 style="font-family:${T.serif};font-size:24px;font-weight:700;color:${T.text};margin:0 0 16px;">
            Reset Your Password
          </h1>
          <p style="font-family:${T.sans};font-size:13.5px;color:${T.muted};margin:0 0 28px;line-height:1.7;">
            You requested a password reset. This link expires in
            <strong style="color:${T.text};">10 minutes</strong>.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:${T.text};">
                <a href="${resetUrl}" style="display:inline-block;padding:16px 36px;font-family:${T.sans};
                          font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;
                          color:#fff;text-decoration:none;">Reset Password</a>
              </td>
            </tr>
          </table>
          <p style="font-family:${T.sans};font-size:11.5px;color:${T.muted};margin:24px 0 0;line-height:1.6;">
            If you did not request this, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>`;
  return sendEmail(to, "Reset Your Password — Air Collection", shell(content));
};

/* ═══════════════════════════════════════════════════════════════
 * 4. Contact Form Notification
 * ═══════════════════════════════════════════════════════════════ */
const sendContactNotification = async (name, email, subject, message) => {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    console.warn("⚠️  ADMIN_EMAIL not set — skipping contact notification");
    return false;
  }
  const safeName = escapeHtml(String(name || "").trim());
  const safeEmail = escapeHtml(String(email || "").trim());
  const safeSubject =
    escapeHtml(String(subject || "").trim()) || "General Inquiry";
  const safeMsg = escapeHtml(String(message || "").trim()).replace(
    /\n/g,
    "<br/>",
  );
  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:32px;">
          <p style="font-family:${T.sans};font-size:10px;font-weight:700;letter-spacing:0.16em;
                    text-transform:uppercase;color:${T.accent};margin:0 0 10px;">Contact Form</p>
          <h1 style="font-family:${T.serif};font-size:22px;font-weight:700;color:${T.text};margin:0 0 24px;">
            New Message
          </h1>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="margin-bottom:24px;border-bottom:1px solid ${T.border};">
            <tr><td style="padding:8px 0;">
              <table width="100%"><tr>
                ${cell2("From", `${safeName} &lt;${safeEmail}&gt;`)}
                ${cell2("Subject", safeSubject)}
              </tr></table>
            </td></tr>
          </table>
          <p style="font-family:${T.sans};font-size:10px;font-weight:700;letter-spacing:0.12em;
                    text-transform:uppercase;color:${T.muted};margin:0 0 10px;">Message</p>
          <div style="background:${T.bg};border:1px solid ${T.border};padding:16px 20px;
                      font-family:${T.sans};font-size:13.5px;color:${T.text};line-height:1.7;">
            ${safeMsg}
          </div>
        </td>
      </tr>
    </table>`;
  return sendEmail(
    adminEmail,
    `Contact: ${safeSubject} — from ${safeName}`,
    shell(content, `New message from ${safeName}: ${safeSubject}`),
    { replyTo: email },
  );
};

/* ═══════════════════════════════════════════════════════════════
 * EXPORTS
 * ═══════════════════════════════════════════════════════════════ */
module.exports = {
  sendEmail,
  isEmailConfigured,
  getAdminEmail,
  sendPasswordResetEmail,
  sendOrderConfirmation,
  sendNewOrderNotification,
  sendContactNotification,
};
