"use client";

import { JSX, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft, FaTruck, FaCreditCard, FaUser, FaMapMarkerAlt,
  FaTrash, FaCheckCircle, FaClock, FaBoxOpen, FaShippingFast,
  FaBan, FaSpinner, FaPhone, FaEnvelope, FaReceipt, FaMobileAlt,
  FaTag, FaPrint,
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
  shipping_address: string; created_at: string;
  location?: string; city?: string;
  user_name?: string;    user_email?: string;    user_phone?: string;
  customer_name?: string; customer_email?: string; customer_phone?: string;
  name?: string; email?: string; phone?: string;
  customer?: { name?: string; email?: string; phone?: string };
  mobile_payment?: MobilePayment;
  mobile_provider?: string;
  mobile_transfer_phone?: string;
  mobile_transfer_name?:  string;
  mobile_amount_paid?:    number | string;
  items: OrderItem[];
  delivery_fee?: number;
  // ── DISCOUNT FIELDS ──
  discount?: number;          // discount amount in dollars
  promo_code?: string;        // code used
  discount_type?: string;     // 'percentage' or 'fixed'
  discount_value?: number;    // e.g., 10 for 10% or 20 for $20
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

/* Known outside-city names — scanned across ALL address text */
const OUTSIDE_CITIES_LC = ["burco","boorama","berbera","borama","others"];
const OUTSIDE_CITIES_LABELS: Record<string,string> = {
  burco:"Burco", boorama:"Boorama", borama:"Boorama", berbera:"Berbera", others:"Others",
};

/*
 * resolveCity — scans every word of every address-related field.
 * Works even when the user types "burco october wadada siiney" with no commas.
 */
const resolveCity = (order: Order) => {
  const combined = [
    order.location || "",
    order.city     || "",
    order.shipping_address || "",
  ].join(" ").toLowerCase().replace(/[,.\-]/g, " ");

  const words = combined.split(/\s+/).filter(Boolean);
  const foundWord = words.find(w => OUTSIDE_CITIES_LC.includes(w)) || null;

  const isOutside =
    order.location === "outside" ||
    combined.includes("outside") ||
    (!!order.city && OUTSIDE_CITIES_LC.includes(order.city.toLowerCase())) ||
    foundWord !== null;

  const cityKey =
    (order.city && OUTSIDE_CITIES_LC.includes(order.city.toLowerCase())
      ? order.city.toLowerCase()
      : foundWord) || null;

  const rawCity = cityKey
    ? (OUTSIDE_CITIES_LABELS[cityKey] || order.city || "")
    : "";

  const cityLabel = isOutside
    ? (rawCity ? `Outside Hargeisa / ${rawCity}` : "Outside Hargeisa")
    : "Inside Hargeisa";

  return { isOutside, rawCity, cityLabel };
};

/*
 * resolveProof — reads mobile payment data from every possible backend shape:
 *   1. Nested object:  order.mobile_payment (camelCase or snake_case keys)
 *   2. Flat DB cols:   order.mobile_provider / mobile_transfer_phone / etc.
 */
const resolveProof = (order: Order) => {
  const mp = order.mobile_payment;
  if (mp && mp.provider) {
    const p = mp.provider.toLowerCase();
    return {
      provider:      p,
      providerLabel: p === "edahab" ? "E-Dahab" : p === "zaad" ? "Zaad" : mp.provider,
      senderPhone:   pick(mp.transfer_phone, mp.transferPhone),
      receiptName:   pick(mp.transfer_name,  mp.transferName),
      amount:        Number(mp.amount_paid ?? mp.amountPaid ?? 0),
    };
  }
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
  return null;
};

/* ─────────────────────────── SMALL COMPONENTS ──────────────── */
const StatusPill = ({ status }: { status: string }) => {
  const c = STATUS_CFG[status] || { label:status, color:"#475569", bg:"#f1f5f9", icon:null as any };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:c.bg, color:c.color,
      fontSize:"0.71rem", fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase",
      padding:"4px 10px", borderRadius:100 }}>
      {c.icon} {c.label}
    </span>
  );
};

const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background:"#fff", border:"1px solid #e8ecf0", borderRadius:12, overflow:"hidden",
    boxShadow:"0 1px 4px rgba(0,0,0,.04),0 4px 16px rgba(0,0,0,.03)", marginBottom:16, ...style }}>
    {children}
  </div>
);

const CardHead = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div style={{ display:"flex", alignItems:"center", gap:9, padding:"14px 20px",
    borderBottom:"1px solid #f0f3f6", background:"#fafbfc" }}>
    <span style={{ color:"#94a3b8", fontSize:13 }}>{icon}</span>
    <span style={{ fontSize:"0.8rem", fontWeight:650, color:"#374151", letterSpacing:"0.02em" }}>{title}</span>
  </div>
);

/* Single info row used in right panel cards */
const InfoRow = ({
  label, value, icon, last = false, valueStyle,
}: {
  label: string; value: React.ReactNode; icon?: React.ReactNode;
  last?: boolean; valueStyle?: React.CSSProperties;
}) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"8px 0", borderBottom: last ? "none" : "1px solid #f8fafc" }}>
    <span style={{ fontSize:"0.75rem", color:"#94a3b8", fontWeight:500,
      display:"flex", alignItems:"center", gap:4 }}>
      {icon}{label}
    </span>
    <span style={{ fontSize:"0.83rem", color:"#374151", fontWeight:500,
      textAlign:"right", maxWidth:"60%", wordBreak:"break-all", ...valueStyle }}>
      {value || <span style={{ color:"#cbd5e1" }}>—</span>}
    </span>
  </div>
);

/* ─────────────────────────── MAIN PAGE ─────────────────────── */
export default function AdminOrderDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const orderId  = params.orderId;

  const [order,     setOrder    ] = useState<Order | null>(null);
  const [loading,   setLoading  ] = useState(true);
  const [error,     setError    ] = useState("");
  const [updating,  setUpdating ] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [deleting,  setDeleting ] = useState(false);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api","") || "http://localhost:5000";
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
        setOrder({
          ...data,
          delivery_fee: parseFloat(data.delivery_fee) || 0,
          total_amount: parseFloat(data.total_amount) || 0,
          discount: parseFloat(data.discount) || 0,
          discount_value: parseFloat(data.discount_value) || 0,
          items: (data.items || []).map((item: OrderItem) => ({
            ...item,
            price: parseFloat(String(item.price)) || 0,
            total: parseFloat(String(item.total)) || 0,
          })),
        });
        setNewStatus(data.status);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <><style>{CSS}</style>
      <div className="od-loading">
        <div className="od-spin-lg"/>
        <p style={{ marginTop:16, color:"#94a3b8", fontSize:"0.85rem" }}>Loading order…</p>
      </div>
    </>
  );
  if (error || !order) return (
    <><style>{CSS}</style>
      <div className="od-loading" style={{ flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:"2.5rem" }}>📦</div>
        <h2 style={{ fontSize:"1.2rem", fontWeight:600, color:"#1e293b" }}>Order not found</h2>
        <p style={{ color:"#94a3b8", fontSize:"0.85rem" }}>{error}</p>
        <Link href="/admin/orders" className="od-btn-primary">Back to Orders</Link>
      </div>
    </>
  );

  /* ── Resolve all display data ── */
  const customerName  = pick(order.user_name,  order.customer_name,  order.customer?.name,  order.name);
  const customerEmail = pick(order.user_email, order.customer_email, order.customer?.email, order.email);
  const customerPhone = pick(order.user_phone, order.customer_phone, order.customer?.phone, order.phone);

  const proof         = resolveProof(order);
  const { cityLabel } = resolveCity(order);

  /*
   * isMobileMoney: check payment_method, flat DB column, or proof existing.
   * proof !== null means mobile payment data was saved, so it WAS mobile money.
   */
  const isMobileMoney =
    order.payment_method === "zaad"  || order.payment_method === "edahab" ||
    order.mobile_provider === "zaad" || order.mobile_provider === "edahab" ||
    proof !== null;

  /*
   * streetAddress: the actual address the user typed.
   * The shipping_address string is "Street, City, Country" OR just "Street" with no commas.
   * We always show the FULL shipping_address as-is — it's what the user typed.
   */
  const streetAddress = order.shipping_address || "";

  // ── Compute all totals ──
  const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = order.discount || 0;
  const deliveryFee = order.delivery_fee || 0;
  const finalTotal = subtotal - discountAmount + deliveryFee;

  // ── Format discount percentage display ──
  let discountDisplay = "";
  if (order.promo_code && order.discount_type) {
    if (order.discount_type === "percentage" && order.discount_value) {
      discountDisplay = `${order.discount_value}% off`;
    } else if (order.discount_type === "fixed" && order.discount_value) {
      discountDisplay = `$${order.discount_value.toFixed(2)} off`;
    }
  }

  const orderDate = new Date(order.created_at).toLocaleDateString("en-US",{ month:"long", day:"numeric", year:"numeric" });
  const orderTime = new Date(order.created_at).toLocaleTimeString("en-US",{ hour:"2-digit", minute:"2-digit" });
  const initials  = customerName
    ? customerName.trim().split(/\s+/).map((w:string) => w[0]).join("").slice(0,2).toUpperCase()
    : "?";

  const statusLabel = STATUS_CFG[order.status]?.label || order.status;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&data=${encodeURIComponent("https://aircollection.shop")}`;

  return (
    <><style>{CSS}</style>
      <div className="od-page">

        {/* ── Top bar ── */}
        <div className="od-topbar">
          <div className="od-topbar-left">
            <Link href="/admin/orders" className="od-back"><FaArrowLeft size={11}/> Orders</Link>
            <div>
              <h1 className="od-title">
                Order <span className="od-order-num">#{order.order_number}</span>
              </h1>
              <div className="od-meta-row">
                <StatusPill status={order.status}/>
                <span className="od-dot">·</span>
                <span className="od-meta">{orderDate} at {orderTime}</span>
                <span className="od-dot">·</span>
                <span className="od-meta">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
                <span className="od-dot">·</span>
                <span className="od-city-badge"><FaMapMarkerAlt size={8}/> {cityLabel}</span>
                {isMobileMoney && proof && (
                  <><span className="od-dot">·</span>
                    <span className="od-mm-badge"><FaMobileAlt size={8}/> {proof.providerLabel}</span>
                  </>
                )}
                {order.promo_code && (
                  <><span className="od-dot">·</span>
                    <span className="od-promo-badge"><FaTag size={8}/> {order.promo_code}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="od-topbar-actions">
            <button className="od-btn-print" onClick={handlePrint}>
              <FaPrint size={12}/> Print Receipt
            </button>
            <button className="od-btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting
                ? <><span className="od-spin od-spin-sm"/> Deleting…</>
                : <><FaTrash size={12}/> Delete Order</>}
            </button>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="od-grid">

          {/* LEFT — items table + invoice */}
          <div>
            <Card>
              <CardHead icon={<FaBoxOpen/>} title="Order Items"/>
              <div style={{ overflowX:"auto" }}>
                <table className="od-table">
                  <thead>
                    <tr>
                      <th>Product</th><th>Variant</th>
                      <th style={{ textAlign:"center" }}>Qty</th>
                      <th style={{ textAlign:"right" }}>Unit Price</th>
                      <th style={{ textAlign:"right" }}>Subtotal</th>
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
                                }}/>
                            </div>
                            <span className="od-prod-name">{item.product_name}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                            {item.size  && <span className="od-tag">{item.size}</span>}
                            {item.color && <span className="od-tag">{item.color}</span>}
                            {!item.size && !item.color && <span style={{ color:"#cbd5e1" }}>—</span>}
                          </div>
                        </td>
                        <td style={{ textAlign:"center" }}>
                          <span className="od-qty">×{item.quantity}</span>
                        </td>
                        <td style={{ textAlign:"right", color:"#64748b", fontSize:"0.85rem" }}>
                          ${item.price.toFixed(2)}
                        </td>
                        <td style={{ textAlign:"right" }}>
                          <strong style={{ color:"#1e293b", fontSize:"0.9rem" }}>
                            ${item.total.toFixed(2)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* ── INVOICE TOTALS ── */}
              <div className="od-invoice">
                <div className="od-inv-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {/* ── DISCOUNT SECTION ── */}
                {discountAmount > 0 && order.promo_code && (
                  <>
                    <div className="od-inv-row" style={{ color:"#15803d" }}>
                      <span>
                        <FaTag size={11} style={{ marginRight:6 }}/>
                        {order.promo_code}
                        {discountDisplay && ` (${discountDisplay})`}
                      </span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="od-inv-row" style={{ color:"#15803d", fontSize:"0.7rem", paddingTop:0 }}>
                      <span style={{ color:"#94a3b8" }}>
                        {order.discount_type === "percentage" 
                          ? `${order.discount_value}% discount applied` 
                          : `$${order.discount_value?.toFixed(2)} discount applied`}
                      </span>
                      <span></span>
                    </div>
                  </>
                )}
                {discountAmount > 0 && !order.promo_code && (
                  <div className="od-inv-row" style={{ color:"#15803d" }}>
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {(deliveryFee > 0) && (
                  <div className="od-inv-row">
                    <span>Delivery fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}

                <div className="od-inv-row od-inv-total">
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT — info cards */}
          <div className="od-right">

            {/* ── Customer ── */}
            <Card>
              <CardHead icon={<FaUser/>} title="Customer"/>
              <div style={{ padding:"16px 20px" }}>
                <div className="od-cust-row">
                  <div className="od-avatar">{initials}</div>
                  <div>
                    <div className="od-cust-name">
                      {customerName || <span style={{ color:"#cbd5e1", fontStyle:"italic" }}>No name</span>}
                    </div>
                    <div className="od-cust-email">
                      {customerEmail || <span style={{ color:"#cbd5e1" }}>No email</span>}
                    </div>
                  </div>
                </div>
                <InfoRow icon={<FaUser size={9}/>}     label="Full Name"    value={customerName}  valueStyle={{ color:"#0f172a", fontWeight:600 }}/>
                <InfoRow icon={<FaEnvelope size={9}/>} label="Email"        value={customerEmail} valueStyle={{ color:"#0f172a", fontWeight:600 }}/>
                <InfoRow icon={<FaPhone size={9}/>}    label="Phone"        value={customerPhone} valueStyle={{ color:"#0f172a", fontWeight:600 }}/>
                <InfoRow                               label="Order placed"  value={orderDate}/>
                <InfoRow                               label="Time"          value={orderTime} last/>
              </div>
            </Card>

            {/* ── Shipping Address ── */}
            <Card>
              <CardHead icon={<FaMapMarkerAlt/>} title="Shipping Address"/>
              <div style={{ padding:"16px 20px" }}>
                {streetAddress
                  ? <div style={{ fontSize:"0.85rem", color:"#1e293b", lineHeight:1.8, fontWeight:500 }}>
                      {streetAddress}
                    </div>
                  : <span style={{ fontSize:"0.83rem", color:"#cbd5e1" }}>No address provided</span>
                }
                <div className="od-city-tag">
                  <FaMapMarkerAlt size={9}/> {cityLabel}
                </div>
              </div>
            </Card>

            {/* ── Order Status ── */}
            <Card>
              <CardHead icon={<FaTruck/>} title="Order Status"/>
              <div style={{ padding:"16px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <span style={{ fontSize:"0.75rem", color:"#94a3b8", fontWeight:500 }}>Current</span>
                  <StatusPill status={order.status}/>
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
                <button className="od-btn-primary" style={{ width:"100%", marginTop:10 }}
                  onClick={handleStatusUpdate} disabled={updating || newStatus === order.status}>
                  {updating
                    ? <><span className="od-spin od-spin-sm od-spin-white"/> Updating…</>
                    : "Update Status"}
                </button>
              </div>
            </Card>

            {/* ══════════════════════════════════════════
                PAYMENT CARD — FULL DISCOUNT INFO DISPLAY
              ══════════════════════════════════════════ */}
            <Card style={{ marginBottom: 0 }}>
              <CardHead icon={<FaCreditCard/>} title="Payment &amp; Discount"/>
              <div style={{ padding:"16px 20px" }}>

                {/* ── PROMO CODE & DISCOUNT INFO ── */}
                {order.promo_code ? (
                  <>
                    <div style={{
                      display:"flex", alignItems:"center", gap:10,
                      background:"#f0fdf4", border:"1px solid #bbf7d0",
                      borderRadius:8, padding:"12px 16px", marginBottom:16,
                    }}>
                      <FaTag size={16} style={{ color:"#15803d" }}/>
                      <div>
                        <div style={{ fontSize:"0.9rem", fontWeight:700, color:"#0f172a" }}>
                          {order.promo_code}
                        </div>
                        <div style={{ fontSize:"0.75rem", color:"#15803d" }}>
                          {order.discount_type === "percentage" 
                            ? `${order.discount_value}% off` 
                            : `$${order.discount_value?.toFixed(2)} off`}
                        </div>
                      </div>
                    </div>

                    <InfoRow
                      icon={<FaReceipt size={9}/>}
                      label="Promo Code"
                      value={order.promo_code}
                      valueStyle={{ color:"#0f172a", fontWeight:700, fontFamily:"monospace", fontSize:"0.9rem" }}
                    />
                    <InfoRow
                      icon={null}
                      label="Discount Type"
                      value={order.discount_type === "percentage" 
                        ? `Percentage (${order.discount_value}%)` 
                        : `Fixed Amount ($${order.discount_value?.toFixed(2)})`}
                      valueStyle={{ color:"#0f172a", fontWeight:500 }}
                    />
                    <InfoRow
                      icon={null}
                      label="Discount Amount"
                      value={`-$${discountAmount.toFixed(2)}`}
                      valueStyle={{ color:"#15803d", fontWeight:700, fontSize:"1rem" }}
                    />
                    <div style={{ height:8, borderBottom:"1px solid #f8fafc", margin:"4px 0 12px" }} />
                  </>
                ) : (
                  <div style={{
                    textAlign:"center", padding:"12px 0", color:"#94a3b8", fontSize:"0.8rem",
                    marginBottom:12,
                  }}>
                    No promo code used
                  </div>
                )}

                {/* ── PAYMENT METHOD ── */}
                {isMobileMoney ? (
                  <>
                    {/* Provider badge */}
                    <div style={{
                      display:"inline-flex", alignItems:"center", gap:8,
                      background:"#0f172a", color:"#fff", padding:"6px 16px",
                      fontSize:"0.75rem", fontWeight:700, letterSpacing:"0.1em",
                      textTransform:"uppercase", marginBottom:16, borderRadius:6,
                    }}>
                      <FaMobileAlt size={11}/>
                      {proof?.providerLabel || order.payment_method || "Mobile Money"}
                    </div>

                    {/* Location / zone */}
                    <InfoRow
                      icon={<FaMapMarkerAlt size={9}/>}
                      label="Location"
                      value={cityLabel}
                    />

                    {/* Warning banner */}
                    {proof && (
                      <div className="od-warn-banner">
                        <span className="od-warn-dot"/>
                        <span>
                          Verify <strong>{proof.providerLabel}</strong> payment of{" "}
                          <strong>${toMoney(proof.amount)}</strong> before processing.
                        </span>
                      </div>
                    )}

                    {/* Receipt Name */}
                    <InfoRow
                      icon={<FaReceipt size={9}/>}
                      label="Receipt Name"
                      value={proof?.receiptName || null}
                      valueStyle={{ color:"#0f172a", fontWeight:700, fontSize:"0.88rem" }}
                    />

                    {/* Receipt Number */}
                    <InfoRow
                      icon={<FaPhone size={9}/>}
                      label="Receipt Number"
                      value={proof?.senderPhone || null}
                      valueStyle={{ color:"#0f172a", fontWeight:700, fontSize:"0.88rem" }}
                    />

                    {/* Total Paid */}
                    <InfoRow
                      label="Total Paid"
                      value={proof ? `$${toMoney(proof.amount)}` : null}
                      last
                      valueStyle={{ color:"#15803d", fontWeight:800, fontSize:"1rem" }}
                    />
                  </>
                ) : (
                  <>
                    {/* Method badge */}
                    <div style={{
                      display:"inline-flex", alignItems:"center", gap:8,
                      background:"#f0fdf4", color:"#166534",
                      border:"1px solid #bbf7d0",
                      padding:"6px 16px", fontSize:"0.75rem", fontWeight:700,
                      letterSpacing:"0.1em", textTransform:"uppercase",
                      marginBottom:16, borderRadius:6,
                    }}>
                      💵 Cash on Delivery
                    </div>

                    {/* Location / zone */}
                    <InfoRow
                      icon={<FaMapMarkerAlt size={9}/>}
                      label="Location"
                      value={cityLabel}
                      last
                    />
                  </>
                )}

              </div>
            </Card>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            PRINT-ONLY RECEIPT — hidden on screen, only rendered
            when the browser's print dialog is triggered. Tuned for
            an 80mm thermal roll. If your printer uses 58mm paper,
            change the two "80mm" values inside "@media print" in
            the CSS block below to "58mm".
          ══════════════════════════════════════════════════════ */}
        <div className="od-print-receipt">
          <div className="pr-center">
            <div className="pr-brand">AIR COLLECTION</div>
            <div className="pr-sub">aircollection.shop</div>
          </div>
          <div className="pr-divider"/>

          <div className="pr-row"><span>Order</span><span>#{order.order_number}</span></div>
          <div className="pr-row"><span>Date</span><span>{orderDate}</span></div>
          <div className="pr-row"><span>Time</span><span>{orderTime}</span></div>
          <div className="pr-row"><span>Status</span><span>{statusLabel}</span></div>
          <div className="pr-divider"/>

          <div className="pr-section-title">Customer</div>
          <div className="pr-line">{customerName || "—"}</div>
          {customerPhone && <div className="pr-line">{customerPhone}</div>}
          {customerEmail && <div className="pr-line">{customerEmail}</div>}
          <div className="pr-divider"/>

          <div className="pr-section-title">Ship To</div>
          <div className="pr-line">{streetAddress || "—"}</div>
          <div className="pr-line">{cityLabel}</div>
          <div className="pr-divider"/>

          <div className="pr-section-title">Items</div>
          {order.items.map(item => (
            <div key={item.id} className="pr-item">
              <div className="pr-item-name">{item.product_name}</div>
              {(item.size || item.color) && (
                <div className="pr-item-variant">
                  {[item.size, item.color].filter(Boolean).join(" / ")}
                </div>
              )}
              <div className="pr-row">
                <span>{item.quantity} x ${item.price.toFixed(2)}</span>
                <span>${item.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div className="pr-divider"/>

          <div className="pr-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          {discountAmount > 0 && (
            <div className="pr-row">
              <span>{order.promo_code ? `Promo ${order.promo_code}` : "Discount"}</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          {deliveryFee > 0 && (
            <div className="pr-row"><span>Delivery</span><span>${deliveryFee.toFixed(2)}</span></div>
          )}
          <div className="pr-divider"/>
          <div className="pr-row pr-total"><span>TOTAL</span><span>${finalTotal.toFixed(2)}</span></div>
          <div className="pr-divider"/>

          <div className="pr-row">
            <span>Payment</span>
            <span>{isMobileMoney ? (proof?.providerLabel || "Mobile Money") : "Cash on Delivery"}</span>
          </div>
          {isMobileMoney && proof && (
            <>
              <div className="pr-row"><span>Paid</span><span>${toMoney(proof.amount)}</span></div>
              {proof.senderPhone && (
                <div className="pr-row"><span>Sender</span><span>{proof.senderPhone}</span></div>
              )}
            </>
          )}
          <div className="pr-divider"/>

          <div className="pr-center pr-qr-wrap">
            <img
              src={qrUrl}
              alt="aircollection.shop QR code"
              className="pr-qr"
            />
            <div className="pr-qr-label">Scan to shop again</div>
            <div className="pr-thanks">Thank you for shopping with us!</div>
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
  .od-topbar-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
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
  .od-promo-badge {
    display:inline-flex; align-items:center; gap:5px; font-size:.71rem; font-weight:600;
    letter-spacing:.06em; text-transform:uppercase; background:#dcfce7; color:#15803d;
    padding:3px 9px; border-radius:100px; font-family:monospace;
  }

  /* city tag inside address card */
  .od-city-tag {
    display:inline-flex; align-items:center; gap:6px; background:#f0e8d8;
    border:1px solid rgba(200,169,110,.4); padding:5px 12px; font-size:.71rem;
    font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:#92400e; margin-top:10px;
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
  .od-btn-print {
    display:inline-flex; align-items:center; gap:7px; background:#0f172a; color:#fff;
    border:1px solid #0f172a; border-radius:9px; padding:9px 16px; font-size:.82rem;
    font-weight:600; cursor:pointer; font-family:inherit; white-space:nowrap;
    transition:background .15s,transform .1s,box-shadow .15s;
    box-shadow:0 2px 8px rgba(15,23,42,.16);
  }
  .od-btn-print:hover { background:#1e293b; transform:translateY(-1px); box-shadow:0 4px 14px rgba(15,23,42,.2); }

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
    font-size:.78rem; color:#92400e; line-height:1.5; margin:12px 0;
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

  /* ── PRINT-ONLY RECEIPT (hidden on screen) ── */
  .od-print-receipt { display:none; }

  @media print {
    /* Tuned for an 80mm thermal roll. For 58mm paper, change the
       two "80mm" values just below to "58mm". */
    @page { size: 80mm auto; margin: 0; }

    body * { visibility: hidden; }
    .od-print-receipt, .od-print-receipt * { visibility: visible; }

    .od-print-receipt {
      display: block !important;
      position: absolute;
      top: 0;
      left: 0;
      width: 80mm;
      padding: 8px 10px 14px;
      font-family: 'Courier New', Courier, monospace;
      color: #000;
      font-size: 11px;
      line-height: 1.35;
    }

    .pr-center { text-align: center; }
    .pr-brand { font-size: 15px; font-weight: 700; letter-spacing: 1.5px; }
    .pr-sub { font-size: 10px; margin-bottom: 2px; }
    .pr-divider { border-top: 1px dashed #000; margin: 6px 0; }
    .pr-section-title { font-weight: 700; text-transform: uppercase; font-size: 10px; margin-bottom: 3px; letter-spacing: .04em; }
    .pr-row { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; padding: 1px 0; }
    .pr-row span:first-child { max-width: 60%; }
    .pr-line { font-size: 11px; }
    .pr-item { margin-bottom: 5px; }
    .pr-item-name { font-weight: 700; font-size: 11px; }
    .pr-item-variant { font-size: 10px; margin-bottom: 1px; }
    .pr-total span { font-weight: 700 !important; font-size: 13px !important; }
    .pr-qr-wrap { margin-top: 8px; }
    .pr-qr { width: 100px; height: 100px; display: block; margin: 0 auto; }
    .pr-qr-label { font-size: 9px; margin-top: 4px; letter-spacing: .03em; }
    .pr-thanks { font-size: 10px; margin-top: 8px; font-style: italic; }
  }
`;
