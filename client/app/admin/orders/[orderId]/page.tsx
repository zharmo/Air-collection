"use client";

import { JSX, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft, FaTruck, FaCreditCard, FaUser, FaMapMarkerAlt,
  FaTrash, FaCheckCircle, FaClock, FaBoxOpen, FaShippingFast,
  FaBan, FaSpinner, FaPhone, FaEnvelope, FaReceipt, FaMobileAlt,
} from "react-icons/fa";
import axiosInstance from "@/utils/axiosConfig";

/* ─────────────────────────── TYPES ─────────────────────────── */
interface OrderItem {
  id: number; product_name: string; quantity: number;
  price: number; total: number; size?: string; color?: string; image?: string;
}
interface MobilePayment {
  provider:        string;
  transfer_phone?: string; transferPhone?: string;
  transfer_name?:  string; transferName?:  string;
  amount_paid?:    number | string; amountPaid?: number | string;
}
interface Order {
  id: number; order_number: string; total_amount: number;
  status: string; payment_status: string; payment_method?: string;
  /* address fields — backend may send any of these */
  shipping_address?: string;
  street_address?:   string;
  location?:         string;   /* "inside" | "outside" */
  city?:             string;   /* e.g. "burco" */
  customer_city?:    string;
  shipping_city?:    string;
  created_at: string;
  /* customer identity fields */
  user_name?:      string; user_email?:      string; user_phone?:      string;
  customer_name?:  string; customer_email?:  string; customer_phone?:  string;
  name?:           string; email?:           string; phone?:           string;
  customer?: { name?: string; email?: string; phone?: string };
  userId?: string | number;
  /* mobile payment — any of these shapes from the backend */
  advance_payment?:      MobilePayment;  /* JSONB column — primary source */
  mobile_payment?:       MobilePayment;
  mobile_provider?:      string;
  mobile_transfer_phone?: string;
  mobile_transfer_name?:  string;
  mobile_amount_paid?:    number | string;
  items: OrderItem[];
  delivery_fee?: number;
}

/* ─────────────────────────── STATUS CONFIG ─────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: JSX.Element }> = {
  pending:    { label:"Pending",    color:"#92400e", bg:"#fef3c7", icon:<FaClock size={11}/> },
  processing: { label:"Processing", color:"#1e40af", bg:"#dbeafe", icon:<FaSpinner size={11}/> },
  packed:     { label:"Packed",     color:"#5b21b6", bg:"#ede9fe", icon:<FaBoxOpen size={11}/> },
  shipped:    { label:"Shipped",    color:"#075985", bg:"#e0f2fe", icon:<FaShippingFast size={11}/> },
  delivered:  { label:"Delivered",  color:"#14532d", bg:"#dcfce7", icon:<FaCheckCircle size={11}/> },
  cancelled:  { label:"Cancelled",  color:"#991b1b", bg:"#fee2e2", icon:<FaBan size={11}/> },
};

/* ─────────────────────────── HELPERS ───────────────────────── */
const pick = (...c: (string | undefined | null)[]) =>
  c.find(v => v && String(v).trim() !== '') ?? '';

const toMoney = (v: number | string | null | undefined) => {
  const n = Number(v); return Number.isFinite(n) ? n.toFixed(2) : '0.00';
};

/* ─────────────────────────── LOCATION RESOLVER ─────────────── */
/*
 * Scans EVERY word from EVERY address-related field.
 * Works even when city is embedded in shipping_address with no commas,
 * e.g. "burco october wadada siiney".
 *
 * Returns:
 *   isOutside  — true if delivery is outside Hargeisa
 *   rawCity    — e.g. "Burco", "Berbera"  (empty string for inside)
 *   cityLabel  — full display label:
 *                  "Inside Hargeisa"  or
 *                  "Outside Hargeisa / Burco"
 */
const OUTSIDE_CITIES_LC = ["burco", "boorama", "berbera", "borama", "others"];
const OUTSIDE_CITIES_LABELS: Record<string, string> = {
  burco: "Burco", boorama: "Boorama", borama: "Boorama",
  berbera: "Berbera", others: "Others",
};

const resolveLocation = (order: Order) => {
  const city    = pick(order.city, order.customer_city, order.shipping_city);
  const location = order.location || "";
  const shipping = pick(order.shipping_address, order.street_address);

  /* Combine all text and scan every word */
  const combined = [location, city, shipping]
    .join(" ")
    .toLowerCase()
    .replace(/[,.\-]/g, " ");

  const words     = combined.split(/\s+/).filter(Boolean);
  const foundWord = words.find(w => OUTSIDE_CITIES_LC.includes(w)) || null;

  const isOutside =
    location === "outside" ||
    combined.includes("outside") ||
    (!!city && OUTSIDE_CITIES_LC.includes(city.toLowerCase())) ||
    foundWord !== null;

  /* Best city key */
  const cityKey =
    (city && OUTSIDE_CITIES_LC.includes(city.toLowerCase())
      ? city.toLowerCase()
      : null) ||
    foundWord ||
    null;

  const rawCity = cityKey
    ? (OUTSIDE_CITIES_LABELS[cityKey] || city || "")
    : "";

  const cityLabel = isOutside
    ? (rawCity ? `Outside Hargeisa / ${rawCity}` : "Outside Hargeisa")
    : "Inside Hargeisa";

  return { isOutside, rawCity, cityLabel };
};

/* ─────────────────────────── MOBILE PAYMENT RESOLVER ───────── */
/*
 * Reads mobile payment from every possible backend shape:
 *   1. Nested:  order.mobile_payment  (snake_case or camelCase keys)
 *   2. Flat:    order.mobile_provider / mobile_transfer_phone / etc.
 */
const resolveProof = (order: Order) => {
  /*
   * advance_payment is a JSONB column — PostgreSQL / the backend ORM may return
   * it as a raw JSON *string* instead of a parsed object.  Parse it if needed.
   * Priority: advance_payment → mobile_payment → flat DB cols
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let raw: any = order.advance_payment || order.mobile_payment;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { raw = null; }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mp: any = raw;

  if (mp && mp.provider) {
    const p = String(mp.provider).toLowerCase();
    return {
      provider:      p,
      providerLabel: p === "edahab" ? "E-Dahab" : p === "zaad" ? "Zaad" : mp.provider,

      /*
       * Exact keys the checkout page saves (camelCase inside mobilePayment):
       *   transferPhone, transferName, amountPaid
       * Plus snake_case variants in case backend remaps them.
       */
      senderPhone: pick(
        mp.transferPhone,    mp.transfer_phone,
        mp.senderPhone,      mp.sender_phone,
        mp.phoneNumber,      mp.phone_number,
        mp.phone,            mp.mobile,
        mp.mobileNumber,     mp.mobile_number,
      ),

      receiptName: pick(
        mp.transferName,     mp.transfer_name,
        mp.senderName,       mp.sender_name,
        mp.receiptName,      mp.receipt_name,
        mp.accountName,      mp.account_name,
        mp.fullName,         mp.full_name,
        mp.name,
      ),

      amount: Number(
        mp.amountPaid    ?? mp.amount_paid  ??
        mp.amount        ?? mp.paidAmount   ?? mp.paid_amount ??
        mp.total         ?? mp.totalAmount  ?? mp.total_amount ??
        0
      ),
    };
  }

  /* Flat DB columns fallback */
  if (order.mobile_provider) {
    const p = order.mobile_provider.toLowerCase();
    return {
      provider:      p,
      providerLabel: p === "edahab" ? "E-Dahab" : p === "zaad" ? "Zaad" : order.mobile_provider,
      senderPhone:   order.mobile_transfer_phone || "",
      receiptName:   order.mobile_transfer_name  || "",
      amount:        Number(order.mobile_amount_paid ?? 0),
    };
  }

  /* payment_method tells us it's mobile money but no proof data was saved */
  if (order.payment_method === "zaad" || order.payment_method === "edahab") {
    const p = order.payment_method;
    return {
      provider:      p,
      providerLabel: p === "edahab" ? "E-Dahab" : "Zaad",
      senderPhone:   "",
      receiptName:   "",
      amount:        0,
    };
  }

  return null;
};

/* ─────────────────────────── SMALL COMPONENTS ──────────────── */
const StatusPill = ({ status }: { status: string }) => {
  const c = STATUS_CFG[status] || { label: status, color: "#475569", bg: "#f1f5f9", icon: null as any };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: c.bg, color: c.color, fontSize: "0.71rem", fontWeight: 700,
      letterSpacing: "0.05em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 100,
    }}>
      {c.icon} {c.label}
    </span>
  );
};

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: "#fff", border: "1px solid #e8ecf0", borderRadius: 12, overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.03)", marginBottom: 16, ...style,
  }}>
    {children}
  </div>
);

const CardHead = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 9, padding: "14px 20px",
    borderBottom: "1px solid #f0f3f6", background: "#fafbfc",
  }}>
    <span style={{ color: "#94a3b8", fontSize: 13 }}>{icon}</span>
    <span style={{ fontSize: "0.8rem", fontWeight: 650, color: "#374151", letterSpacing: "0.02em" }}>{title}</span>
  </div>
);

const InfoRow = ({
  label, value, icon, last = false, valueStyle,
}: {
  label: string; value: React.ReactNode; icon?: React.ReactNode;
  last?: boolean; valueStyle?: React.CSSProperties;
}) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 0", borderBottom: last ? "none" : "1px solid #f8fafc",
  }}>
    <span style={{
      fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500,
      display: "flex", alignItems: "center", gap: 4,
    }}>
      {icon}{label}
    </span>
    <span style={{
      fontSize: "0.83rem", color: "#374151", fontWeight: 500,
      textAlign: "right", maxWidth: "60%", wordBreak: "break-all", ...valueStyle,
    }}>
      {value || <span style={{ color: "#cbd5e1" }}>—</span>}
    </span>
  </div>
);

/* ─────────────────────────── MAIN PAGE ─────────────────────── */
export default function AdminOrderDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const orderId = params.orderId;

  const [order,    setOrder   ] = useState<Order | null>(null);
  const [loading,  setLoading ] = useState(true);
  const [error,    setError   ] = useState("");
  const [updating, setUpdating] = useState(false);
  const [newStatus,setNewStatus] = useState("");
  const [deleting, setDeleting] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";
  const imgUrl = (p?: string) => {
    if (!p) return "/images/placeholders/placeholder.jpg";
    if (p.startsWith("/uploads")) return `${backendUrl}${p}`;
    return p;
  };

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const res  = await axiosInstance.get(`/orders/${orderId}`);
        const data = res.data.data;
        /* Parse advance_payment / mobile_payment if backend returns them as strings */
        const parseJsonField = (v: unknown) => {
          if (!v || typeof v === 'object') return v;
          try { return JSON.parse(v as string); } catch { return null; }
        };

        setOrder({
          ...data,
          advance_payment: parseJsonField(data.advance_payment),
          mobile_payment:  parseJsonField(data.mobile_payment),
          delivery_fee: parseFloat(data.delivery_fee) || 0,
          total_amount: parseFloat(data.total_amount) || 0,
          items: (data.items || []).map((item: OrderItem) => ({
            ...item,
            price: parseFloat(String(item.price)) || 0,
            total: parseFloat(String(item.total)) || 0,
          })),
        });
        setNewStatus(data.status);
        /* DEBUG — remove after confirming field names */
        console.log('[OrderDetail] advance_payment:', data.advance_payment);
        console.log('[OrderDetail] mobile_payment:',  data.mobile_payment);
        console.log('[OrderDetail] full order keys:', Object.keys(data));
      } catch (e: unknown) {
        setError((e as any)?.response?.data?.message || "Order not found");
      } finally { setLoading(false); }
    })();
  }, [orderId]);

  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) return;
    setUpdating(true);
    try {
      await axiosInstance.put(`/orders/${orderId}/status`, { status: newStatus });
      setOrder(p => p ? { ...p, status: newStatus } : null);
    } catch { alert("Failed to update status."); }
    finally  { setUpdating(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this order?")) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/orders/${orderId}`);
      router.push("/admin/orders");
    } catch { alert("Failed to delete order."); setDeleting(false); }
  };

  /* ── Loading / Error states ── */
  if (loading) return (
    <><style>{CSS}</style>
      <div className="od-loading">
        <div className="od-spin-lg" />
        <p style={{ marginTop: 16, color: "#94a3b8", fontSize: "0.85rem" }}>Loading order…</p>
      </div>
    </>
  );
  if (error || !order) return (
    <><style>{CSS}</style>
      <div className="od-loading" style={{ flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: "2.5rem" }}>📦</div>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#1e293b" }}>Order not found</h2>
        <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{error}</p>
        <Link href="/admin/orders" className="od-btn-primary">Back to Orders</Link>
      </div>
    </>
  );

  /* ── Resolve all display data ── */
  const customerName  = pick(order.user_name,  order.customer_name,  order.customer?.name,  order.name);
  const customerEmail = pick(order.user_email, order.customer_email, order.customer?.email, order.email);
  const customerPhone = pick(order.user_phone, order.customer_phone, order.customer?.phone, order.phone);

  const proof = resolveProof(order);
  const { isOutside, cityLabel } = resolveLocation(order);

  /*
   * isMobileMoney: true if payment_method is zaad/edahab,
   * or flat column says so, or proof object was successfully built.
   */
  const isMobileMoney =
    order.payment_method === "zaad"  || order.payment_method === "edahab" ||
    order.mobile_provider === "zaad" || order.mobile_provider === "edahab" ||
    proof !== null;

  /*
   * streetAddress: the raw text the customer typed into the address field.
   * We show this verbatim — do NOT strip commas or split.
   */
  const streetAddress = pick(order.shipping_address, order.street_address);

  const subtotal  = order.total_amount - (order.delivery_fee || 0);
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const orderTime = new Date(order.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const initials  = customerName
    ? customerName.trim().split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <><style>{CSS}</style>
      <div className="od-page">

        {/* ── Top bar ── */}
        <div className="od-topbar">
          <div className="od-topbar-left">
            <Link href="/admin/orders" className="od-back"><FaArrowLeft size={11} /> Orders</Link>
            <div>
              <h1 className="od-title">
                Order <span className="od-order-num">#{order.order_number}</span>
              </h1>
              <div className="od-meta-row">
                <StatusPill status={order.status} />
                <span className="od-dot">·</span>
                <span className="od-meta">{orderDate} at {orderTime}</span>
                <span className="od-dot">·</span>
                <span className="od-meta">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                <span className="od-dot">·</span>
                <span className="od-city-badge"><FaMapMarkerAlt size={8} /> {cityLabel}</span>
                {isMobileMoney && proof && (
                  <><span className="od-dot">·</span>
                    <span className="od-mm-badge"><FaMobileAlt size={8} /> {proof.providerLabel}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button className="od-btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting
              ? <><span className="od-spin od-spin-sm" /> Deleting…</>
              : <><FaTrash size={12} /> Delete Order</>}
          </button>
        </div>

        {/* ── Main grid ── */}
        <div className="od-grid">

          {/* LEFT — items table + invoice */}
          <div>
            <Card>
              <CardHead icon={<FaBoxOpen />} title="Order Items" />
              <div style={{ overflowX: "auto" }}>
                <table className="od-table">
                  <thead>
                    <tr>
                      <th>Product</th><th>Variant</th>
                      <th style={{ textAlign: "center" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Unit Price</th>
                      <th style={{ textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div className="od-prod-cell">
                            <div className="od-prod-img">
                              <img src={imgUrl(item.image)} alt={item.product_name}
                                className="od-prod-pic"
                                onError={e => {
                                  (e.target as HTMLImageElement).src = "/images/placeholders/placeholder.jpg";
                                }} />
                            </div>
                            <span className="od-prod-name">{item.product_name}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {item.size  && <span className="od-tag">{item.size}</span>}
                            {item.color && <span className="od-tag">{item.color}</span>}
                            {!item.size && !item.color && <span style={{ color: "#cbd5e1" }}>—</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="od-qty">×{item.quantity}</span>
                        </td>
                        <td style={{ textAlign: "right", color: "#64748b", fontSize: "0.85rem" }}>
                          ${item.price.toFixed(2)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <strong style={{ color: "#1e293b", fontSize: "0.9rem" }}>
                            ${item.total.toFixed(2)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Invoice totals */}
              <div className="od-invoice">
                <div className="od-inv-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                {(order.delivery_fee || 0) > 0 && (
                  <div className="od-inv-row">
                    <span>Delivery fee</span>
                    <span>${(order.delivery_fee || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="od-inv-row od-inv-total">
                  <span>Total</span><span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT — info cards */}
          <div className="od-right">

            {/* ── Customer ── */}
            <Card>
              <CardHead icon={<FaUser />} title="Customer" />
              <div style={{ padding: "16px 20px" }}>
                <div className="od-cust-row">
                  <div className="od-avatar">{initials}</div>
                  <div>
                    <div className="od-cust-name">
                      {customerName || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>No name</span>}
                    </div>
                    <div className="od-cust-email">
                      {customerEmail || <span style={{ color: "#cbd5e1" }}>No email</span>}
                    </div>
                  </div>
                </div>
                <InfoRow icon={<FaUser size={9} />}     label="Full Name" value={customerName}  valueStyle={{ color: "#0f172a", fontWeight: 600 }} />
                <InfoRow icon={<FaEnvelope size={9} />} label="Email"     value={customerEmail} valueStyle={{ color: "#0f172a", fontWeight: 600 }} />
                <InfoRow icon={<FaPhone size={9} />}    label="Phone"     value={customerPhone} valueStyle={{ color: "#0f172a", fontWeight: 600 }} />
                <InfoRow                                label="Order date" value={orderDate} />
                <InfoRow                                label="Time"      value={orderTime} last />
              </div>
            </Card>

            {/* ── Shipping Address ──
                TWO separate pieces of information:
                1. The raw text the customer typed (their street / neighbourhood)
                2. The delivery zone they selected (Inside / Outside Hargeisa + city)
            ── */}
            <Card>
              <CardHead icon={<FaMapMarkerAlt />} title="Shipping Address" />
              <div style={{ padding: "16px 20px" }}>

                {/* 1 — Raw address text the customer typed */}
                <div className="od-addr-label">Street address</div>
                {streetAddress
                  ? <div style={{ fontSize: "0.85rem", color: "#1e293b", lineHeight: 1.8, fontWeight: 500 }}>
                      {streetAddress}
                    </div>
                  : <span style={{ fontSize: "0.83rem", color: "#cbd5e1" }}>No address provided</span>
                }

                {/* 2 — Delivery zone (inside / outside + city) */}
                <div className="od-addr-label" style={{ marginTop: 14 }}>Delivery zone</div>
                <div className="od-city-tag">
                  <FaMapMarkerAlt size={9} /> {cityLabel}
                </div>

              </div>
            </Card>

            {/* ── Order Status ── */}
            <Card>
              <CardHead icon={<FaTruck />} title="Order Status" />
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>Current</span>
                  <StatusPill status={order.status} />
                </div>
                <label className="od-select-label" htmlFor="od-sel">Change status</label>
                <select id="od-sel" className="od-select" value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="od-btn-primary" style={{ width: "100%", marginTop: 10 }}
                  onClick={handleStatusUpdate} disabled={updating || newStatus === order.status}>
                  {updating
                    ? <><span className="od-spin od-spin-sm od-spin-white" /> Updating…</>
                    : "Update Status"}
                </button>
              </div>
            </Card>

            {/* ══════════════════════════════════════════
                PAYMENT CARD

                MOBILE MONEY (zaad / e-dahab):
                  - Provider badge (dark pill)
                  - Warning banner to verify before shipping
                  - Receipt Name   (name on the transfer)
                  - Receipt Number (phone used to send)
                  - Total Paid     (amount customer claimed)

                CASH ON DELIVERY:
                  - Green "Cash on Delivery" badge only
                  (no extra rows — nothing to verify)
            ══════════════════════════════════════════ */}
            <Card style={{ marginBottom: 0 }}>
              <CardHead icon={<FaCreditCard />} title="Payment" />
              <div style={{ padding: "16px 20px" }}>

                {isMobileMoney ? (
                  /* ── MOBILE MONEY ─────────────────────────────── */
                  <>
                    {/* Provider badge */}
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: "#0f172a", color: "#fff", padding: "7px 18px",
                      fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", marginBottom: 16, borderRadius: 6,
                    }}>
                      <FaMobileAlt size={11} />
                      {proof?.providerLabel || order.payment_method || "Mobile Money"}
                    </div>

                    {/* Warning banner — verify before dispatching */}
                    <div className="od-warn-banner">
                      <span className="od-warn-dot" />
                      <span>
                        Verify this <strong>{proof?.providerLabel ?? "mobile money"}</strong> transfer
                        before processing the order.
                      </span>
                    </div>

                    {/* Receipt Name — name customer put on the transfer */}
                    <InfoRow
                      icon={<FaReceipt size={9} />}
                      label="Receipt Name"
                      value={proof?.receiptName || null}
                      valueStyle={{ color: "#0f172a", fontWeight: 700, fontSize: "0.88rem" }}
                    />

                    {/* Receipt Number — phone number used to send money */}
                    <InfoRow
                      icon={<FaPhone size={9} />}
                      label="Receipt Number"
                      value={proof?.senderPhone || null}
                      valueStyle={{ color: "#0f172a", fontWeight: 700, fontSize: "0.88rem" }}
                    />

                    {/* Total Paid — amount customer claims to have transferred */}
                    <InfoRow
                      label="Total Paid"
                      value={proof ? `$${toMoney(proof.amount)}` : null}
                      last
                      valueStyle={{ color: "#15803d", fontWeight: 800, fontSize: "1rem" }}
                    />
                  </>
                ) : (
                  /* ── CASH ON DELIVERY ─────────────────────────── */
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: "#f0fdf4", color: "#166534",
                    border: "1px solid #bbf7d0",
                    padding: "7px 18px", fontSize: "0.75rem", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    borderRadius: 6,
                  }}>
                    💵 Cash on Delivery
                  </div>
                )}

              </div>
            </Card>

          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────── CSS ───────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;450;500;600;700&display=swap');

  .od-page {
    font-family:'Geist','SF Pro Text',-apple-system,sans-serif;
    background:#f7f8fa; min-height:100vh;
    padding:28px 24px 56px; -webkit-font-smoothing:antialiased;
  }
  .od-loading {
    min-height:70vh; display:flex; align-items:center; justify-content:center;
    flex-direction:column; text-align:center;
  }
  .od-spin-lg {
    width:40px; height:40px; border:3px solid #e2e8f0; border-top-color:#1e293b;
    border-radius:50%; animation:od-spin .75s linear infinite;
  }
  @keyframes od-spin { to { transform:rotate(360deg); } }

  /* top bar */
  .od-topbar { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
  .od-topbar-left { display:flex; align-items:flex-start; gap:14px; flex-wrap:wrap; }
  .od-back {
    display:inline-flex; align-items:center; gap:6px; font-size:.78rem; font-weight:500;
    color:#64748b; text-decoration:none; background:#fff; border:1px solid #e2e8f0;
    border-radius:8px; padding:7px 13px; white-space:nowrap; margin-top:4px;
    transition:border-color .15s,color .15s;
  }
  .od-back:hover { border-color:#94a3b8; color:#1e293b; }
  .od-title { font-size:clamp(1.2rem,2.5vw,1.55rem); font-weight:600; color:#0f172a; letter-spacing:-.03em; margin:0 0 6px; }
  .od-order-num { color:#3b82f6; }
  .od-meta-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .od-dot { color:#cbd5e1; font-size:.75rem; }
  .od-meta { font-size:.78rem; color:#64748b; }
  .od-city-badge {
    display:inline-flex; align-items:center; gap:5px; font-size:.71rem; font-weight:600;
    letter-spacing:.06em; text-transform:uppercase; background:#f0e8d8; color:#92400e;
    padding:3px 9px; border-radius:100px;
  }
  .od-mm-badge {
    display:inline-flex; align-items:center; gap:5px; font-size:.71rem; font-weight:600;
    letter-spacing:.06em; text-transform:uppercase; background:#dbeafe; color:#1e40af;
    padding:3px 9px; border-radius:100px;
  }

  /* address card labels */
  .od-addr-label {
    font-size:.7rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
    color:#94a3b8; margin-bottom:6px;
  }

  /* city tag inside address card */
  .od-city-tag {
    display:inline-flex; align-items:center; gap:6px; background:#f0e8d8;
    border:1px solid rgba(200,169,110,.4); padding:5px 12px; font-size:.71rem;
    font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:#92400e;
  }

  /* buttons */
  .od-btn-primary {
    display:inline-flex; align-items:center; justify-content:center; gap:7px;
    background:#0f172a; color:#fff; border:none; border-radius:9px; padding:9px 18px;
    font-size:.82rem; font-weight:600; cursor:pointer; font-family:inherit; text-decoration:none;
    transition:background .15s,transform .1s,box-shadow .15s;
    box-shadow:0 2px 8px rgba(15,23,42,.18);
  }
  .od-btn-primary:hover:not(:disabled) { background:#1e293b; transform:translateY(-1px); box-shadow:0 4px 14px rgba(15,23,42,.22); }
  .od-btn-primary:disabled { opacity:.5; cursor:not-allowed; }
  .od-btn-danger {
    display:inline-flex; align-items:center; gap:7px; background:#fff; color:#dc2626;
    border:1px solid #fecaca; border-radius:9px; padding:9px 16px; font-size:.82rem;
    font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap;
    transition:background .15s,border-color .15s;
  }
  .od-btn-danger:hover:not(:disabled) { background:#fff5f5; border-color:#f87171; }
  .od-btn-danger:disabled { opacity:.5; cursor:not-allowed; }

  /* spinner */
  .od-spin { display:inline-block; border-radius:50%; animation:od-spin .7s linear infinite; flex-shrink:0; }
  .od-spin-sm { width:13px; height:13px; border:2px solid rgba(0,0,0,.12); border-top-color:#1e293b; }
  .od-spin-white { border-color:rgba(255,255,255,.25)!important; border-top-color:#fff!important; }

  /* layout grid */
  .od-grid { display:grid; grid-template-columns:1fr 300px; gap:20px; align-items:start; }
  .od-right { position:sticky; top:24px; }

  /* items table */
  .od-table { width:100%; border-collapse:collapse; font-size:.85rem; }
  .od-table thead tr { border-bottom:1px solid #f1f5f9; }
  .od-table thead th {
    padding:11px 16px; font-size:.71rem; font-weight:600; letter-spacing:.06em;
    text-transform:uppercase; color:#94a3b8; background:#fafbfc; white-space:nowrap;
  }
  .od-table tbody tr { border-bottom:1px solid #f8fafc; transition:background .1s; }
  .od-table tbody tr:last-child { border-bottom:none; }
  .od-table tbody tr:hover { background:#f8fafc; }
  .od-table td { padding:14px 16px; vertical-align:middle; color:#374151; }
  .od-prod-cell { display:flex; align-items:center; gap:12px; }
  .od-prod-img {
    width:48px; height:48px; border-radius:8px; background:#f8fafc;
    border:1px solid #f1f5f9; overflow:hidden; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
  }
  .od-prod-pic { width:100%; height:100%; object-fit:cover; }
  .od-prod-name { font-size:.85rem; font-weight:500; color:#1e293b; line-height:1.3; }
  .od-tag { font-size:.69rem; font-weight:600; color:#64748b; background:#f1f5f9; border-radius:5px; padding:2px 7px; }
  .od-qty { display:inline-block; font-size:.78rem; font-weight:700; color:#475569; background:#f1f5f9; border-radius:6px; padding:2px 8px; }

  /* invoice */
  .od-invoice { padding:14px 16px 16px; margin:0 16px; border-top:1px solid #f1f5f9; }
  .od-inv-row { display:flex; justify-content:space-between; align-items:center; padding:5px 0; font-size:.83rem; color:#64748b; }
  .od-inv-row span:last-child { font-weight:500; color:#374151; }
  .od-inv-total { border-top:1.5px solid #e2e8f0; margin-top:8px; padding-top:10px!important; }
  .od-inv-total span { color:#0f172a!important; font-weight:700!important; font-size:1.05rem!important; }

  /* customer card */
  .od-cust-row { display:flex; align-items:center; gap:12px; margin-bottom:14px; }
  .od-avatar {
    width:38px; height:38px; border-radius:50%;
    background:linear-gradient(135deg,#6366f1,#8b5cf6);
    color:#fff; font-size:.8rem; font-weight:700;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .od-cust-name { font-size:.9rem; font-weight:600; color:#1e293b; margin-bottom:2px; }
  .od-cust-email { font-size:.78rem; color:#94a3b8; }

  /* status select */
  .od-select-label { display:block; font-size:.72rem; font-weight:600; letter-spacing:.07em; text-transform:uppercase; color:#94a3b8; margin-bottom:6px; }
  .od-select {
    width:100%; height:38px; padding:0 10px; border:1px solid #e2e8f0; border-radius:8px;
    background:#fff; color:#1e293b; font-size:.85rem; font-family:inherit; outline:none;
    appearance:auto; transition:border-color .15s,box-shadow .15s;
  }
  .od-select:focus { border-color:#94a3b8; box-shadow:0 0 0 3px rgba(148,163,184,.15); }

  /* warning banner in payment card */
  .od-warn-banner {
    display:flex; align-items:flex-start; gap:8px; background:#fffbeb;
    border:1px solid #fde68a; border-radius:8px; padding:10px 12px;
    font-size:.78rem; color:#92400e; line-height:1.5; margin-bottom:12px;
  }
  .od-warn-dot { width:8px; height:8px; min-width:8px; background:#f59e0b; border-radius:50%; margin-top:3px; flex-shrink:0; }

  /* responsive */
  @media(max-width:1000px) { .od-grid { grid-template-columns:1fr; } .od-right { position:static; } }
  @media(max-width:600px) {
    .od-page { padding:16px 12px 40px; }
    .od-topbar { flex-direction:column; }
    .od-topbar-left { flex-direction:column; gap:10px; }
    .od-table thead th, .od-table tbody td { padding:10px 12px; }
  }
`;
