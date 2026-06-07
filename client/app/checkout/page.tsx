'use client';

import { ChangeEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaTruck, FaMoneyBillWave, FaMapMarkerAlt, FaUser, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/utils/axiosConfig';

const checkoutStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap');

  :root {
    --ink: #0a0a0a;
    --ink-soft: #6b6b6b;
    --ink-faint: #ababab;
    --surface: #ffffff;
    --surface-warm: #fafaf7;
    --surface-muted: #f4f2ef;
    --accent: #c8a96e;
    --accent-light: #f0e8d8;
    --border: rgba(0,0,0,0.08);
    --border-strong: rgba(0,0,0,0.15);
  }

  * { box-sizing: border-box; }

  /* ── Page Wrapper ── */
  .checkout-page {
    min-height: 100vh;
    background: var(--surface-warm);
    padding: 60px max(24px, calc((100vw - 1300px) / 2 + 40px));
  }

  /* ── Page Header ── */
  .checkout-page-header {
    margin-bottom: 48px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--border-strong);
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  .checkout-eyebrow {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .checkout-eyebrow::before {
    content: '';
    display: inline-block;
    width: 28px;
    height: 1px;
    background: var(--accent);
  }

  .checkout-page-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 500;
    color: var(--ink);
    line-height: 1;
    letter-spacing: -0.02em;
    margin: 0;
  }

  .checkout-back-link {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-soft);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 2px;
    border-bottom: 1px solid var(--border-strong);
    transition: color 0.2s, border-color 0.2s;
  }

  .checkout-back-link:hover {
    color: var(--ink);
    border-color: var(--ink);
  }

  /* ── Grid ── */
  .checkout-grid {
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 32px;
    align-items: start;
  }

  /* ── Panel ── */
  .checkout-panel {
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .checkout-panel-body {
    padding: 40px;
  }

  /* ── Section Heading ── */
  .co-section-heading {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 28px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }

  .co-section-icon {
    width: 36px;
    height: 36px;
    border: 1px solid var(--border-strong);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent);
    font-size: 14px;
    flex-shrink: 0;
  }

  .co-section-title {
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink);
    margin: 0;
  }

  .co-section-block {
    margin-bottom: 40px;
  }

  .co-section-block:last-of-type {
    margin-bottom: 0;
  }

  /* ── Form Elements ── */
  .co-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .co-form-grid.single {
    grid-template-columns: 1fr;
  }

  .co-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .co-field.full {
    grid-column: 1 / -1;
  }

  .co-label {
    font-family: 'Jost', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .co-input {
    font-family: 'Jost', sans-serif;
    font-size: 14px;
    font-weight: 300;
    color: var(--ink);
    background: var(--surface-warm);
    border: 1px solid var(--border-strong);
    padding: 14px 16px;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
    width: 100%;
    border-radius: 0;
    -webkit-appearance: none;
  }

  .co-input:focus {
    border-color: var(--ink);
    background: var(--surface);
  }

  .co-input::placeholder {
    color: var(--ink-faint);
    font-weight: 300;
  }

  .co-select {
    font-family: 'Jost', sans-serif;
    font-size: 14px;
    font-weight: 300;
    color: var(--ink);
    background: var(--surface-warm);
    border: 1px solid var(--border-strong);
    padding: 14px 16px;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
    border-radius: 0;
    cursor: pointer;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b6b6b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;
  }

  .co-select:focus {
    border-color: var(--ink);
  }

  /* ── Payment Box ── */
  .co-payment-box {
    border: 1px solid var(--border-strong);
    background: var(--surface-warm);
    padding: 20px 24px;
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .co-radio-custom {
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--ink);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .co-radio-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--ink);
  }

  .co-payment-label {
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.05em;
    color: var(--ink);
    margin-bottom: 4px;
  }

  .co-payment-desc {
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 300;
    color: var(--ink-soft);
  }

  /* ── Error ── */
  .co-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    padding: 14px 20px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .co-error-text {
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: #dc2626;
  }

  .co-error-close {
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
  }

  /* ── Submit Button ── */
  .co-submit-btn {
    width: 100%;
    background: var(--ink);
    color: #fff;
    border: 1.5px solid var(--ink);
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    padding: 20px 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 36px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .co-submit-btn:hover:not(:disabled) {
    background: transparent;
    color: var(--ink);
  }

  .co-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* ── Order Summary Panel ── */
  .summary-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    position: sticky;
    top: 24px;
  }

  .summary-header {
    padding: 24px 32px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .summary-title {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink);
    margin: 0;
  }

  .summary-count {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 400;
    color: var(--ink-soft);
  }

  .summary-items {
    padding: 24px 32px;
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: 340px;
    overflow-y: auto;
  }

  .summary-item {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .summary-item-img {
    width: 64px;
    height: 64px;
    background: var(--surface-muted);
    overflow: hidden;
    flex-shrink: 0;
  }

  .summary-item-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .summary-item-name {
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: var(--ink);
    margin-bottom: 4px;
    line-height: 1.4;
  }

  .summary-item-meta {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 300;
    color: var(--ink-soft);
    letter-spacing: 0.03em;
  }

  .summary-item-price {
    font-family: 'Cormorant Garamond', serif;
    font-size: 18px;
    font-weight: 500;
    color: var(--ink);
    margin-left: auto;
    flex-shrink: 0;
  }

  /* ── Totals ── */
  .summary-totals {
    padding: 24px 32px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-bottom: 1px solid var(--border);
  }

  .summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .summary-row-label {
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 400;
    color: var(--ink-soft);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .summary-row-value {
    font-family: 'Jost', sans-serif;
    font-size: 13px;
    font-weight: 400;
    color: var(--ink);
  }

  .summary-total-row {
    padding: 24px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .summary-total-label {
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--ink);
  }

  .summary-total-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px;
    font-weight: 500;
    color: var(--ink);
    letter-spacing: -0.01em;
  }

  .summary-note {
    padding: 0 32px 24px;
    font-family: 'Jost', sans-serif;
    font-size: 11px;
    font-weight: 300;
    color: var(--ink-faint);
    letter-spacing: 0.03em;
  }

  /* ── Empty Cart ── */
  .empty-cart-page {
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    text-align: center;
    padding: 60px 24px;
    background: var(--surface-warm);
  }

  .empty-cart-emoji {
    font-size: 72px;
    line-height: 1;
    margin-bottom: 8px;
  }

  .empty-cart-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 40px;
    font-weight: 500;
    color: var(--ink);
    margin: 0;
  }

  .empty-cart-desc {
    font-family: 'Jost', sans-serif;
    font-size: 14px;
    font-weight: 300;
    color: var(--ink-soft);
    letter-spacing: 0.04em;
  }

  .btn-primary-ink {
    font-family: 'Jost', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    background: var(--ink);
    color: #fff;
    border: 1.5px solid var(--ink);
    padding: 16px 40px;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    margin-top: 8px;
  }

  .btn-primary-ink:hover {
    background: transparent;
    color: var(--ink);
  }

  /* ── Responsive ── */
  @media (max-width: 1024px) {
    .checkout-grid { grid-template-columns: 1fr; }
    .summary-panel { position: static; }
    .checkout-page { padding: 40px 24px; }
    .checkout-page-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  }

  @media (max-width: 640px) {
    .checkout-panel-body { padding: 24px; }
    .co-form-grid { grid-template-columns: 1fr; }
    .summary-header, .summary-items, .summary-totals,
    .summary-total-row, .summary-note { padding-left: 20px; padding-right: 20px; }
    .checkout-page { padding: 32px 16px; }
  }
`;

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, clearCart } = useCart();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        streetAddress: '',
        location: 'inside',
    });
    const [deliveryFee, setDeliveryFee] = useState(1);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const getImageUrl = (imagePath?: string) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('/uploads')) return `${backendUrl}${imagePath}`;
        return imagePath;
    };

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || '',
                fullName: user.name || '',
            }));
        }
    }, [user]);

    useEffect(() => {
        setDeliveryFee(formData.location === 'inside' ? 1 : 1.5);
    }, [formData.location]);

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal + deliveryFee;

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const validateForm = () => {
        if (!formData.fullName.trim()) return 'Please enter your full name';
        if (!formData.email.trim()) return 'Please enter your email';
        if (!formData.phone.trim()) return 'Please enter your phone number';
        if (!formData.streetAddress.trim()) return 'Please enter your street address';
        if (cart.items.length === 0) return 'Your cart is empty';
        return null;
    };

    const handlePlaceOrder = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const orderData = {
                customer: {
                    name: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.streetAddress,
                    location: formData.location,
                },
                items: cart.items.map(item => ({
                    productId: item.product_id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    size: item.size,
                    color: item.color,
                    image: item.image,
                })),
                subtotal,
                deliveryFee,
                total,
                paymentMethod: 'cash_on_delivery',
            };

            const endpoint = user ? '/orders' : '/guest-orders';
            const response = await axiosInstance.post(endpoint, orderData);
            const orderId = response.data.data.orderId;
            clearCart();
            router.push(`/order-success?orderId=${orderId}`);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (cart.items.length === 0) {
        return (
            <>
                <style dangerouslySetInnerHTML={{ __html: checkoutStyles }} />
                <div className="empty-cart-page">
                    <div className="empty-cart-emoji">🛒</div>
                    <h2 className="empty-cart-title">Your cart is empty</h2>
                    <p className="empty-cart-desc">Looks like you haven't added anything yet.</p>
                    <Link href="/" className="btn-primary-ink">
                        Continue Shopping <FaArrowRight size={11} />
                    </Link>
                </div>
            </>
        );
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: checkoutStyles }} />

            <div className="checkout-page">

                {/* ── Page Header ── */}
                <div className="checkout-page-header">
                    <div>
                        <div className="checkout-eyebrow">Secure Checkout</div>
                        <h1 className="checkout-page-title">Complete Your Order</h1>
                    </div>
                    <Link href="/cart" className="checkout-back-link">
                        ← Back to Cart
                    </Link>
                </div>

                <div className="checkout-grid">

                    {/* ── LEFT: Form ── */}
                    <div className="checkout-panel">
                        <div className="checkout-panel-body">

                            {error && (
                                <div className="co-error">
                                    <span className="co-error-text">{error}</span>
                                    <button className="co-error-close" onClick={() => setError('')}>✕</button>
                                </div>
                            )}

                            {/* Customer Info */}
                            <div className="co-section-block">
                                <div className="co-section-heading">
                                    <div className="co-section-icon"><FaUser /></div>
                                    <p className="co-section-title">Customer Information</p>
                                </div>
                                <div className="co-form-grid">
                                    <div className="co-field">
                                        <label className="co-label">Full Name *</label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            className="co-input"
                                            placeholder="John Doe"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="co-field">
                                        <label className="co-label">Email Address *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="co-input"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="co-field">
                                        <label className="co-label">Phone Number *</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className="co-input"
                                            placeholder="+252 63 123456"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Shipping */}
                            <div className="co-section-block">
                                <div className="co-section-heading">
                                    <div className="co-section-icon"><FaMapMarkerAlt /></div>
                                    <p className="co-section-title">Shipping Address</p>
                                </div>
                                <div className="co-form-grid single">
                                    <div className="co-field">
                                        <label className="co-label">Street Address *</label>
                                        <input
                                            type="text"
                                            name="streetAddress"
                                            className="co-input"
                                            placeholder="Wadnaha Road, 26 June District"
                                            value={formData.streetAddress}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="co-field">
                                        <label className="co-label">Location *</label>
                                        <select
                                            name="location"
                                            className="co-select"
                                            value={formData.location}
                                            onChange={handleChange}
                                        >
                                            <option value="inside">Inside Hargeisa ($1.00 delivery)</option>
                                            <option value="outside">Outside Hargeisa ($1.50 delivery)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Payment */}
                            <div className="co-section-block">
                                <div className="co-section-heading">
                                    <div className="co-section-icon"><FaMoneyBillWave /></div>
                                    <p className="co-section-title">Payment Method</p>
                                </div>
                                <div className="co-payment-box">
                                    <div className="co-radio-custom">
                                        <div className="co-radio-dot" />
                                    </div>
                                    <div>
                                        <div className="co-payment-label">Cash on Delivery</div>
                                        <div className="co-payment-desc">Pay when you receive your order</div>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="co-submit-btn"
                                onClick={handlePlaceOrder}
                                disabled={loading}
                            >
                                {loading ? (
                                    'Placing Order...'
                                ) : (
                                    <>
                                        Confirm Order — Cash on Delivery <FaArrowRight size={11} />
                                    </>
                                )}
                            </button>

                        </div>
                    </div>

                    {/* ── RIGHT: Summary ── */}
                    <div className="summary-panel">
                        <div className="summary-header">
                            <p className="summary-title">Order Summary</p>
                            <span className="summary-count">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</span>
                        </div>

                        <div className="summary-items">
                            {cart.items.map((item) => (
                                <div key={item.id} className="summary-item">
                                    <div className="summary-item-img">
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name}
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="summary-item-name">{item.name}</div>
                                        <div className="summary-item-meta">
                                            {item.size && `Size: ${item.size}`}
                                            {item.size && item.color && ' · '}
                                            {item.color && `Color: ${item.color}`}
                                            {(item.size || item.color) && ' · '}
                                            Qty: {item.quantity}
                                        </div>
                                    </div>
                                    <div className="summary-item-price">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="summary-totals">
                            <div className="summary-row">
                                <span className="summary-row-label">Subtotal</span>
                                <span className="summary-row-value">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span className="summary-row-label">
                                    <FaTruck size={11} /> Delivery Fee
                                </span>
                                <span className="summary-row-value">${deliveryFee.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="summary-total-row">
                            <span className="summary-total-label">Total</span>
                            <span className="summary-total-value">${total.toFixed(2)}</span>
                        </div>

                        <p className="summary-note">* Cash on delivery only. No additional taxes.</p>
                    </div>

                </div>
            </div>
        </>
    );
}