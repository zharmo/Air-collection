"use client";

import { JSX, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft,
  FaTruck,
  FaCreditCard,
  FaUser,
  FaMapMarkerAlt,
  FaTrash,
  FaCheckCircle,
  FaClock,
  FaBoxOpen,
  FaShippingFast,
  FaBan,
  FaSpinner,
  FaPhone,
  FaEnvelope,
  FaReceipt,
  FaMobileAlt,
} from "react-icons/fa";
import axiosInstance from "@/utils/axiosConfig";

/* ─────────────────────────── TYPES ─────────────────────────── */
interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  size?: string;
  color?: string;
  image?: string;
}

interface AdvancePayment {
  provider: string;
  amount: number;
  receiptName: string;
  senderPhone: string;
}

interface Order {
  id: number;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  created_at: string;

  /*
   * The backend may return customer info under several possible field names
   * depending on whether the order was placed by a logged-in user or a guest.
   * We read ALL variants and pick the first truthy one at render time.
   */
  user_name?: string; // logged-in user
  user_email?: string;
  user_phone?: string;

  customer_name?: string; // guest / checkout form
  customer_email?: string;
  customer_phone?: string;

  name?: string; // some backends flatten to top-level
  email?: string;
  phone?: string;

  /* nested customer object — some backends return this shape */
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };

  advance_payment?: AdvancePayment;
  items: OrderItem[];
  delivery_fee?: number;
}

/* ─────────────────────────── STATUS CONFIG ─────────────────── */
const STATUS_CFG: Record<
  string,
  { label: string; color: string; bg: string; icon: JSX.Element }
> = {
  pending: {
    label: "Pending",
    color: "#92400e",
    bg: "#fef3c7",
    icon: <FaClock size={11} />,
  },
  processing: {
    label: "Processing",
    color: "#1e40af",
    bg: "#dbeafe",
    icon: <FaSpinner size={11} />,
  },
  packed: {
    label: "Packed",
    color: "#5b21b6",
    bg: "#ede9fe",
    icon: <FaBoxOpen size={11} />,
  },
  shipped: {
    label: "Shipped",
    color: "#075985",
    bg: "#e0f2fe",
    icon: <FaShippingFast size={11} />,
  },
  delivered: {
    label: "Delivered",
    color: "#14532d",
    bg: "#dcfce7",
    icon: <FaCheckCircle size={11} />,
  },
  cancelled: {
    label: "Cancelled",
    color: "#991b1b",
    bg: "#fee2e2",
    icon: <FaBan size={11} />,
  },
};

const PAY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  paid: { label: "Paid", color: "#14532d", bg: "#dcfce7" },
  unpaid: { label: "Unpaid", color: "#991b1b", bg: "#fee2e2" },
  pending: { label: "Pending", color: "#92400e", bg: "#fef3c7" },
};

/* ─────────────────────────── HELPERS ───────────────────────── */
/**
 * Pick the first non-empty string from a list of candidates.
 * Used to resolve customer fields that may live under different keys
 * depending on the backend / auth state.
 */
const pick = (...candidates: (string | undefined | null)[]): string =>
  candidates.find((v) => v && v.trim() !== "") || "";

/* ─────────────────────────── SMALL COMPONENTS ──────────────── */
const StatusPill = ({ status }: { status: string }) => {
  const cfg = STATUS_CFG[status] || {
    label: status,
    color: "#475569",
    bg: "#f1f5f9",
    icon: null,
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: cfg.bg,
        color: cfg.color,
        fontSize: "0.71rem",
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "4px 10px",
        borderRadius: 100,
      }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
};

const PayPill = ({ status }: { status: string }) => {
  const cfg = PAY_CFG[status] || {
    label: status,
    color: "#475569",
    bg: "#f1f5f9",
  };
  return (
    <span
      style={{
        display: "inline-block",
        background: cfg.bg,
        color: cfg.color,
        fontSize: "0.71rem",
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "4px 10px",
        borderRadius: 100,
      }}
    >
      {cfg.label}
    </span>
  );
};

const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #e8ecf0",
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
      marginBottom: 16,
      ...style,
    }}
  >
    {children}
  </div>
);

const CardHeader = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 9,
      padding: "14px 20px",
      borderBottom: "1px solid #f0f3f6",
      background: "#fafbfc",
    }}
  >
    <span style={{ color: "#94a3b8", fontSize: 13 }}>{icon}</span>
    <span
      style={{
        fontSize: "0.8rem",
        fontWeight: 650,
        color: "#374151",
        letterSpacing: "0.02em",
      }}
    >
      {title}
    </span>
  </div>
);

/* ─────────────────────────── MAIN PAGE ─────────────────────── */
export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [deleting, setDeleting] = useState(false);

  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
    "http://localhost:5000";

  const getFullImageUrl = (imagePath?: string) => {
    if (!imagePath) return "/images/placeholders/placeholder.jpg";
    if (imagePath.startsWith("/uploads")) return `${backendUrl}${imagePath}`;
    return imagePath;
  };

  /* ── Fetch ── */
  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const res = await axiosInstance.get(`/orders/${orderId}`);
        const data = res.data.data;
        setOrder({
          ...data,
          delivery_fee: parseFloat(data.delivery_fee) || 0,
          total_amount: parseFloat(data.total_amount) || 0,
          items: (data.items || []).map((item: OrderItem) => ({
            ...item,
            price: parseFloat(String(item.price)) || 0,
            total: parseFloat(String(item.total)) || 0,
          })),
        });
        setNewStatus(data.status);
      } catch (err: unknown) {
        setError(
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Order not found",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  /* ── Status update ── */
  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) return;
    setUpdating(true);
    try {
      await axiosInstance.put(`/orders/${orderId}/status`, {
        status: newStatus,
      });
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    } catch {
      alert("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  /* ── Delete ── */
  const handleDeleteOrder = async () => {
    if (!confirm("Permanently delete this order and all its items?")) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/orders/${orderId}`);
      router.push("/admin/orders");
    } catch {
      alert("Failed to delete order.");
      setDeleting(false);
    }
  };

  /* ── Loading ── */
  if (loading)
    return (
      <>
        <style>{CSS}</style>
        <div className="od-loading">
          <div className="od-spinner-lg" />
          <p style={{ marginTop: 16, color: "#94a3b8", fontSize: "0.85rem" }}>
            Loading order…
          </p>
        </div>
      </>
    );

  /* ── Error ── */
  if (error || !order)
    return (
      <>
        <style>{CSS}</style>
        <div
          className="od-loading"
          style={{ flexDirection: "column", gap: 16 }}
        >
          <div style={{ fontSize: "2.5rem" }}>📦</div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#1e293b" }}>
            Order not found
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{error}</p>
          <Link href="/admin/orders" className="od-btn-primary">
            Back to Orders
          </Link>
        </div>
      </>
    );

  /* ─────────────────────────────────────────────────────────
   * Resolve customer fields from all possible backend shapes:
   *   • logged-in user   → user_name / user_email / user_phone
   *   • guest order      → customer_name / customer_email / customer_phone
   *   • flat top-level   → name / email / phone
   *   • nested object    → customer.name / customer.email / customer.phone
   * ───────────────────────────────────────────────────────── */
  const customerName = pick(
    order.user_name,
    order.customer_name,
    order.customer?.name,
    order.name,
  );
  const customerEmail = pick(
    order.user_email,
    order.customer_email,
    order.customer?.email,
    order.email,
  );
  const customerPhone = pick(
    order.user_phone,
    order.customer_phone,
    order.customer?.phone,
    order.phone,
  );

  /* ── Other derived values ── */
  const subtotal = order.total_amount - (order.delivery_fee || 0);
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const orderTime = new Date(order.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const addrParts = (order.shipping_address || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const ap = order.advance_payment;
  const providerLabel = ap?.provider === "edahab" ? "E-Dahab" : "Zaad";

  /* Avatar initials — use resolved customer name, never "G" for Guest */
  const initials = customerName
    ? customerName
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  /* ── Render ── */
  return (
    <>
      <style>{CSS}</style>

      <div className="od-page">
        {/* ════ TOP BAR ════ */}
        <div className="od-topbar">
          <div className="od-topbar-left">
            <Link href="/admin/orders" className="od-back">
              <FaArrowLeft size={11} /> Orders
            </Link>
            <div className="od-topbar-title-group">
              <h1 className="od-title">
                Order{" "}
                <span className="od-order-num">#{order.order_number}</span>
              </h1>
              <div className="od-topbar-meta">
                <StatusPill status={order.status} />
                <span className="od-meta-sep">·</span>
                <span className="od-meta-text">
                  {orderDate} at {orderTime}
                </span>
                <span className="od-meta-sep">·</span>
                <span className="od-meta-text">
                  {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
          <button
            className="od-btn-danger"
            onClick={handleDeleteOrder}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <span className="od-spinner od-spinner-sm" /> Deleting…
              </>
            ) : (
              <>
                <FaTrash size={12} /> Delete Order
              </>
            )}
          </button>
        </div>

        {/* ════ MAIN GRID ════ */}
        <div className="od-grid">
          {/* ══ LEFT: Items + Invoice ══ */}
          <div className="od-left">
            <Card>
              <CardHeader icon={<FaBoxOpen />} title="Order Items" />
              <div style={{ overflowX: "auto" }}>
                <table className="od-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Variant</th>
                      <th style={{ textAlign: "center" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Unit Price</th>
                      <th style={{ textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="od-product-cell">
                            <div className="od-product-img-wrap">
                              <img
                                src={getFullImageUrl(item.image)}
                                alt={item.product_name}
                                className="od-product-img"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/images/placeholders/placeholder.jpg";
                                }}
                              />
                            </div>
                            <span className="od-product-name">
                              {item.product_name}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="od-variant-cell">
                            {item.size && (
                              <span className="od-variant-tag">
                                {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="od-variant-tag">
                                {item.color}
                              </span>
                            )}
                            {!item.size && !item.color && (
                              <span style={{ color: "#cbd5e1" }}>—</span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="od-qty-badge">×{item.quantity}</span>
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            color: "#64748b",
                            fontSize: "0.85rem",
                          }}
                        >
                          ${item.price.toFixed(2)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontWeight: 650,
                              color: "#1e293b",
                              fontSize: "0.9rem",
                            }}
                          >
                            ${item.total.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice */}
              <div className="od-invoice">
                <div className="od-invoice-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="od-invoice-row">
                  <span>
                    Delivery fee
                    {ap && (
                      <span className="od-invoice-note">
                        paid in advance via {providerLabel}
                      </span>
                    )}
                  </span>
                  <span>${(order.delivery_fee || 0).toFixed(2)}</span>
                </div>
                <div className="od-invoice-row od-invoice-total">
                  <span>Total</span>
                  <span>${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* ══ RIGHT: Info cards ══ */}
          <div className="od-right">
            {/* ── Customer ── */}
            <Card>
              <CardHeader icon={<FaUser />} title="Customer" />
              <div style={{ padding: "16px 20px" }}>
                {/* Avatar + primary name/email display */}
                <div className="od-customer-row">
                  <div className="od-avatar">{initials}</div>
                  <div>
                    {/* Always show the name from the checkout form */}
                    <div className="od-customer-name">
                      {customerName || (
                        <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>
                          No name
                        </span>
                      )}
                    </div>
                    <div className="od-customer-email">
                      {customerEmail || (
                        <span style={{ color: "#cbd5e1" }}>No email</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full Name row */}
                <div className="od-info-row">
                  <span className="od-info-label">
                    <FaUser size={9} style={{ marginRight: 4 }} />
                    Full Name
                  </span>
                  <span className="od-info-val od-val-strong">
                    {customerName || <span className="od-empty-val">—</span>}
                  </span>
                </div>

                {/* Email row */}
                <div className="od-info-row">
                  <span className="od-info-label">
                    <FaEnvelope size={9} style={{ marginRight: 4 }} />
                    Email
                  </span>
                  <span className="od-info-val od-val-strong">
                    {customerEmail || <span className="od-empty-val">—</span>}
                  </span>
                </div>

                {/* Phone row */}
                <div className="od-info-row">
                  <span className="od-info-label">
                    <FaPhone size={9} style={{ marginRight: 4 }} />
                    Phone
                  </span>
                  <span className="od-info-val od-val-strong">
                    {customerPhone || <span className="od-empty-val">—</span>}
                  </span>
                </div>

                {/* Order date */}
                <div className="od-info-row">
                  <span className="od-info-label">Order placed</span>
                  <span className="od-info-val">{orderDate}</span>
                </div>

                {/* Time */}
                <div className="od-info-row" style={{ borderBottom: "none" }}>
                  <span className="od-info-label">Time</span>
                  <span className="od-info-val">{orderTime}</span>
                </div>
              </div>
            </Card>

            {/* ── Shipping Address ── */}
            <Card>
              <CardHeader icon={<FaMapMarkerAlt />} title="Shipping Address" />
              <div style={{ padding: "16px 20px" }}>
                {addrParts.length > 0 ? (
                  addrParts.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "0.85rem",
                        color: "#374151",
                        lineHeight: 1.7,
                        fontWeight: i === 0 ? 600 : 400,
                      }}
                    >
                      {p}
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: "0.83rem", color: "#cbd5e1" }}>
                    No address provided
                  </span>
                )}
              </div>
            </Card>

            {/* ── Order Status ── */}
            <Card>
              <CardHeader icon={<FaTruck />} title="Order Status" />
              <div style={{ padding: "16px 20px" }}>
                <div className="od-status-current">
                  <span className="od-info-label">Current</span>
                  <StatusPill status={order.status} />
                </div>
                <label className="od-select-label" htmlFor="od-status-select">
                  Change status
                </label>
                <select
                  id="od-status-select"
                  className="od-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  className="od-btn-primary"
                  style={{ width: "100%", marginTop: 10 }}
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === order.status}
                >
                  {updating ? (
                    <>
                      <span className="od-spinner od-spinner-sm od-spinner-white" />{" "}
                      Updating…
                    </>
                  ) : (
                    "Update Status"
                  )}
                </button>
              </div>
            </Card>

            {/* ── Payment ── */}
            <Card style={{ marginBottom: ap ? 16 : 0 }}>
              <CardHeader icon={<FaCreditCard />} title="Payment" />
              <div style={{ padding: "16px 20px" }}>
                <div className="od-info-row">
                  <span className="od-info-label">Method</span>
                  <span className="od-info-val">Cash on Delivery</span>
                </div>
                <div className="od-info-row">
                  <span className="od-info-label">Status</span>
                  <PayPill status={order.payment_status || "pending"} />
                </div>
                <div className="od-info-row" style={{ borderBottom: "none" }}>
                  <span className="od-info-label">Zone</span>
                  <span className="od-info-val">
                    {ap ? "Outside Hargeisa" : "Inside Hargeisa"}
                  </span>
                </div>
              </div>
            </Card>

            {/* ── Advance Payment (Outside Hargeisa only) ── */}
            {ap && (
              <Card style={{ marginBottom: 0 }}>
                <CardHeader
                  icon={<FaReceipt />}
                  title="Advance Delivery Payment"
                />
                <div style={{ padding: "16px 20px" }}>
                  <div className="od-advance-banner">
                    <span className="od-advance-dot" />
                    <span>
                      Customer paid{" "}
                      <strong>${Number(ap.amount).toFixed(2)}</strong> delivery
                      fee in advance via <strong>{providerLabel}</strong> —
                      verify before dispatching.
                    </span>
                  </div>

                  <div className="od-info-row">
                    <span className="od-info-label">
                      <FaMobileAlt size={9} style={{ marginRight: 4 }} />
                      Provider
                    </span>
                    <span className="od-info-val od-advance-provider">
                      {providerLabel}
                    </span>
                  </div>

                  <div className="od-info-row">
                    <span className="od-info-label">Amount Paid</span>
                    <span
                      className="od-info-val"
                      style={{ color: "#15803d", fontWeight: 700 }}
                    >
                      ${Number(ap.amount).toFixed(2)}
                    </span>
                  </div>

                  <div className="od-info-row">
                    <span className="od-info-label">
                      <FaReceipt size={9} style={{ marginRight: 4 }} />
                      Receipt Name
                    </span>
                    <span className="od-info-val od-advance-highlight">
                      {ap.receiptName || "—"}
                    </span>
                  </div>

                  <div className="od-info-row" style={{ borderBottom: "none" }}>
                    <span className="od-info-label">
                      <FaPhone size={9} style={{ marginRight: 4 }} />
                      Sent From
                    </span>
                    <span className="od-info-val od-advance-highlight">
                      {ap.senderPhone || "—"}
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════ CSS ════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;450;500;600;700&display=swap');

  .od-page {
    font-family: 'Geist', 'SF Pro Text', -apple-system, sans-serif;
    background: #f7f8fa;
    min-height: 100vh;
    padding: 28px 24px 56px;
    -webkit-font-smoothing: antialiased;
  }

  .od-loading {
    min-height: 70vh;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; text-align: center;
  }
  .od-spinner-lg {
    width: 40px; height: 40px;
    border: 3px solid #e2e8f0; border-top-color: #1e293b;
    border-radius: 50%; animation: od-spin 0.75s linear infinite;
  }
  @keyframes od-spin { to { transform: rotate(360deg); } }

  /* ── Top bar ── */
  .od-topbar {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; margin-bottom: 24px; flex-wrap: wrap;
  }
  .od-topbar-left { display: flex; align-items: flex-start; gap: 14px; flex-wrap: wrap; }
  .od-back {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.78rem; font-weight: 500; color: #64748b;
    text-decoration: none; background: #fff; border: 1px solid #e2e8f0;
    border-radius: 8px; padding: 7px 13px; white-space: nowrap;
    margin-top: 4px; transition: border-color 0.15s, color 0.15s;
  }
  .od-back:hover { border-color: #94a3b8; color: #1e293b; }

  .od-title {
    font-size: clamp(1.2rem, 2.5vw, 1.55rem); font-weight: 600;
    color: #0f172a; letter-spacing: -0.03em; margin: 0 0 6px;
  }
  .od-order-num { color: #3b82f6; }
  .od-topbar-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .od-meta-sep  { color: #cbd5e1; font-size: 0.75rem; }
  .od-meta-text { font-size: 0.78rem; color: #64748b; }

  /* ── Buttons ── */
  .od-btn-primary {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 7px; background: #0f172a; color: #fff; border: none;
    border-radius: 9px; padding: 9px 18px; font-size: 0.82rem;
    font-weight: 600; letter-spacing: 0.01em; cursor: pointer;
    font-family: inherit; text-decoration: none;
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
    box-shadow: 0 2px 8px rgba(15,23,42,0.18);
  }
  .od-btn-primary:hover:not(:disabled) {
    background: #1e293b; transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(15,23,42,0.22);
  }
  .od-btn-primary:active:not(:disabled) { transform: translateY(0); }
  .od-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .od-btn-danger {
    display: inline-flex; align-items: center; gap: 7px;
    background: #fff; color: #dc2626; border: 1px solid #fecaca;
    border-radius: 9px; padding: 9px 16px; font-size: 0.82rem;
    font-weight: 600; cursor: pointer; font-family: inherit;
    transition: background 0.15s, border-color 0.15s; white-space: nowrap;
  }
  .od-btn-danger:hover:not(:disabled) { background: #fff5f5; border-color: #f87171; }
  .od-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Spinner ── */
  .od-spinner {
    display: inline-block; border-radius: 50%;
    animation: od-spin 0.7s linear infinite; flex-shrink: 0;
  }
  .od-spinner-sm    { width: 13px; height: 13px; border: 2px solid rgba(0,0,0,0.12); border-top-color: #1e293b; }
  .od-spinner-white { border-color: rgba(255,255,255,0.25) !important; border-top-color: #fff !important; }

  /* ── Grid ── */
  .od-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }
  .od-left  { min-width: 0; }
  .od-right { position: sticky; top: 24px; }

  /* ── Table ── */
  .od-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .od-table thead tr { border-bottom: 1px solid #f1f5f9; }
  .od-table thead th {
    padding: 11px 16px; font-size: 0.71rem; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8;
    background: #fafbfc; white-space: nowrap;
  }
  .od-table tbody tr { border-bottom: 1px solid #f8fafc; transition: background 0.1s; }
  .od-table tbody tr:last-child { border-bottom: none; }
  .od-table tbody tr:hover { background: #f8fafc; }
  .od-table td { padding: 14px 16px; vertical-align: middle; color: #374151; }

  .od-product-cell { display: flex; align-items: center; gap: 12px; }
  .od-product-img-wrap {
    width: 48px; height: 48px; border-radius: 8px;
    background: #f8fafc; border: 1px solid #f1f5f9;
    overflow: hidden; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .od-product-img { width: 100%; height: 100%; object-fit: cover; }
  .od-product-name { font-size: 0.85rem; font-weight: 500; color: #1e293b; line-height: 1.3; }

  .od-variant-cell { display: flex; gap: 5px; flex-wrap: wrap; }
  .od-variant-tag {
    font-size: 0.69rem; font-weight: 600; color: #64748b;
    background: #f1f5f9; border-radius: 5px; padding: 2px 7px; letter-spacing: 0.03em;
  }
  .od-qty-badge {
    display: inline-block; font-size: 0.78rem; font-weight: 700;
    color: #475569; background: #f1f5f9; border-radius: 6px; padding: 2px 8px;
  }

  /* ── Invoice ── */
  .od-invoice { padding: 14px 16px 16px; margin: 0 16px; border-top: 1px solid #f1f5f9; }
  .od-invoice-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 5px 0; font-size: 0.83rem; color: #64748b;
  }
  .od-invoice-row span:last-child { font-weight: 500; color: #374151; }
  .od-invoice-note { display: block; font-size: 0.69rem; color: #b45309; font-weight: 500; margin-top: 1px; }
  .od-invoice-total { border-top: 1.5px solid #e2e8f0; margin-top: 8px; padding-top: 10px !important; }
  .od-invoice-total span { color: #0f172a !important; font-weight: 700 !important; font-size: 1.05rem !important; }

  /* ── Right panel rows ── */
  .od-customer-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .od-avatar {
    width: 38px; height: 38px; border-radius: 50%;
    background: linear-gradient(135deg,#6366f1,#8b5cf6);
    color: #fff; font-size: 0.8rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; letter-spacing: 0.02em;
  }
  .od-customer-name  { font-size: 0.9rem; font-weight: 600; color: #1e293b; margin-bottom: 2px; }
  .od-customer-email { font-size: 0.78rem; color: #94a3b8; }

  .od-info-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 7px 0; border-bottom: 1px solid #f8fafc;
  }
  .od-info-label { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
  .od-info-val   {
    font-size: 0.82rem; color: #374151; font-weight: 500;
    text-align: right; max-width: 60%; word-break: break-all;
  }

  /* Strong value — used for name/email/phone so they stand out */
  .od-val-strong { color: #0f172a !important; font-weight: 600 !important; font-size: 0.84rem !important; }
  .od-empty-val  { color: #cbd5e1; font-weight: 400; }

  .od-status-current { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .od-select-label {
    display: block; font-size: 0.72rem; font-weight: 600;
    letter-spacing: 0.07em; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px;
  }
  .od-select {
    width: 100%; height: 38px; padding: 0 10px;
    border: 1px solid #e2e8f0; border-radius: 8px;
    background: #fff; color: #1e293b; font-size: 0.85rem;
    font-family: inherit; outline: none; appearance: auto;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .od-select:focus { border-color: #94a3b8; box-shadow: 0 0 0 3px rgba(148,163,184,0.15); }

  /* ── Advance payment ── */
  .od-advance-banner {
    display: flex; align-items: flex-start; gap: 8px;
    background: #fffbeb; border: 1px solid #fde68a;
    border-radius: 8px; padding: 10px 12px;
    font-size: 0.78rem; color: #92400e; line-height: 1.5; margin-bottom: 14px;
  }
  .od-advance-dot {
    width: 8px; height: 8px; min-width: 8px;
    background: #f59e0b; border-radius: 50%; margin-top: 3px;
  }
  .od-advance-provider {
    font-weight: 700; color: #0f172a; background: #f1f5f9;
    padding: 2px 8px; border-radius: 5px; font-size: 0.78rem;
  }
  .od-advance-highlight { color: #0f172a !important; font-weight: 600 !important; font-size: 0.84rem !important; }

  /* ── Responsive ── */
  @media (max-width: 1000px) {
    .od-grid { grid-template-columns: 1fr; }
    .od-right { position: static; }
  }
  @media (max-width: 600px) {
    .od-page { padding: 16px 12px 40px; }
    .od-topbar { flex-direction: column; }
    .od-topbar-left { flex-direction: column; gap: 10px; }
    .od-table thead th, .od-table tbody td { padding: 10px 12px; }
  }
`;
