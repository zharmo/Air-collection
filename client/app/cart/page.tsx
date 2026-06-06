'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaTrashAlt, FaTag, FaArrowLeft, FaShoppingBag } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
    const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [promoStatus, setPromoStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const getImageUrl = (imagePath: string) => {
        if (!imagePath) return '/images/placeholders/placeholder.jpg';
        if (imagePath.startsWith('/uploads')) return `${backendUrl}${imagePath}`;
        return imagePath;
    };

    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal - discount;

    const handleApplyPromo = () => {
        if (promoCode.toUpperCase() === 'AIR10') {
            setDiscount(subtotal * 0.1);
            setPromoStatus('success');
        } else {
            setDiscount(0);
            setPromoStatus('error');
        }
    };

    const handlePromoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPromoCode(e.target.value);
        if (promoStatus !== 'idle') setPromoStatus('idle');
    };

    /* ─── EMPTY STATE ─── */
    if (cart.items.length === 0) {
        return (
            <>
                <style>{emptyStyles}</style>
                <div className="cart-empty-wrapper">
                    <div className="cart-empty-card">
                        <div className="cart-empty-icon">
                            <FaShoppingBag />
                        </div>
                        <h2 className="cart-empty-title">Your bag is empty</h2>
                        <p className="cart-empty-sub">You haven't added anything yet. Explore our latest collection.</p>
                        <Link href="/" className="cart-empty-btn">
                            <FaArrowLeft size={13} />
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    /* ─── FULL CART ─── */
    return (
        <>
            <style>{cartStyles}</style>

            <div className="cart-page">
                <div className="container-xl py-5">

                    {/* Header */}
                    <div className="cart-header mb-5">
                        <Link href="/" className="cart-back-link">
                            <FaArrowLeft size={12} /> Continue Shopping
                        </Link>
                        <h1 className="cart-title">Shopping Bag
                            <span className="cart-count-badge">{cart.items.reduce((s, i) => s + i.quantity, 0)}</span>
                        </h1>
                    </div>

                    <div className="row g-5 align-items-start">

                        {/* ── LEFT: Items ── */}
                        <div className="col-lg-7 col-xl-8">
                            <div className="cart-items-card">
                                {cart.items.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        className={`cart-item ${idx < cart.items.length - 1 ? 'cart-item--bordered' : ''}`}
                                    >
                                        {/* Image */}
                                        <div className="cart-item-img-wrap">
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.name}
                                                className="cart-item-img"
                                            />
                                        </div>

                                        {/* Details */}
                                        <div className="cart-item-details">
                                            <div className="cart-item-top">
                                                <div className="cart-item-info">
                                                    <h5 className="cart-item-name">{item.name}</h5>
                                                    <div className="cart-item-meta">
                                                        {item.size && <span className="cart-meta-tag">Size: {item.size}</span>}
                                                        {item.color && <span className="cart-meta-tag">Color: {item.color}</span>}
                                                    </div>
                                                </div>
                                                <div className="cart-item-price-col">
                                                    <div className="cart-item-unit-price">${item.price.toFixed(2)} each</div>
                                                    <div className="cart-item-total-price">${(item.price * item.quantity).toFixed(2)}</div>
                                                </div>
                                            </div>

                                            <div className="cart-item-actions">
                                                {/* Qty stepper */}
                                                <div className="qty-stepper">
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <svg width="10" height="2" viewBox="0 0 10 2"><rect width="10" height="2" rx="1" fill="currentColor" /></svg>
                                                    </button>
                                                    <span className="qty-value">{item.quantity}</span>
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        aria-label="Increase quantity"
                                                    >
                                                        <svg width="10" height="10" viewBox="0 0 10 10"><rect x="4" width="2" height="10" rx="1" fill="currentColor" /><rect y="4" width="10" height="2" rx="1" fill="currentColor" /></svg>
                                                    </button>
                                                </div>

                                                {/* Remove */}
                                                <button
                                                    className="cart-remove-btn"
                                                    onClick={() => removeFromCart(item.id)}
                                                    aria-label={`Remove ${item.name}`}
                                                >
                                                    <FaTrashAlt size={13} />
                                                    <span>Remove</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Promo */}
                                <div className="promo-section">
                                    <div className="promo-label">
                                        <FaTag size={12} />
                                        Promo Code
                                    </div>
                                    <div className="promo-input-row">
                                        <input
                                            type="text"
                                            className={`promo-input ${promoStatus === 'error' ? 'promo-input--error' : ''} ${promoStatus === 'success' ? 'promo-input--success' : ''}`}
                                            placeholder="Enter code"
                                            value={promoCode}
                                            onChange={handlePromoInput}
                                            onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                                        />
                                        <button className="promo-apply-btn" onClick={handleApplyPromo}>
                                            Apply
                                        </button>
                                    </div>
                                    {promoStatus === 'success' && (
                                        <p className="promo-msg promo-msg--success">✓ AIR10 applied — 10% off your order!</p>
                                    )}
                                    {promoStatus === 'error' && (
                                        <p className="promo-msg promo-msg--error">✕ Invalid promo code. Please try again.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Summary ── */}
                        <div className="col-lg-5 col-xl-4">
                            <div className="order-summary-card">
                                <h5 className="summary-title">Order Summary</h5>

                                <div className="summary-line">
                                    <span>Subtotal ({cart.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="summary-line">
                                    <span>Shipping</span>
                                    <span className="summary-free">Free</span>
                                </div>
                                {discount > 0 && (
                                    <div className="summary-line summary-line--discount">
                                        <span>Promo (AIR10)</span>
                                        <span>−${discount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="summary-divider" />

                                <div className="summary-total">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>

                                <Link href="/checkout" className="checkout-btn">
                                    Proceed to Checkout
                                </Link>

                                <button className="clear-cart-btn" onClick={clearCart}>
                                    Clear bag
                                </button>

                                <div className="summary-trust">
                                    <span>🔒 Secure checkout</span>
                                    <span>·</span>
                                    <span>Free returns</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */

const emptyStyles = `
  .cart-empty-wrapper {
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: #fafafa;
  }
  .cart-empty-card {
    text-align: center;
    max-width: 420px;
    padding: 3.5rem 2.5rem;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 4px 40px rgba(0,0,0,0.07);
  }
  .cart-empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #f3f3f3;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: #bbb;
    margin: 0 auto 1.5rem;
  }
  .cart-empty-title {
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #111;
    margin-bottom: 0.6rem;
  }
  .cart-empty-sub {
    font-size: 0.95rem;
    color: #888;
    margin-bottom: 2rem;
  }
  .cart-empty-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #111;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 0.8rem 2rem;
    border-radius: 100px;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s;
  }
  .cart-empty-btn:hover {
    background: #333;
    color: #fff;
    transform: translateY(-1px);
  }
`;

const cartStyles = `
  /* ── Page shell ── */
  .cart-page {
    background: #f7f7f7;
    min-height: 100vh;
  }

  /* ── Header ── */
  .cart-header {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .cart-back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #888;
    text-decoration: none;
    transition: color 0.15s;
  }
  .cart-back-link:hover { color: #111; }
  .cart-title {
    font-size: clamp(1.8rem, 4vw, 2.6rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    color: #111;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .cart-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #111;
    color: #fff;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0;
  }

  /* ── Items card ── */
  .cart-items-card {
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 2px 20px rgba(0,0,0,0.055);
  }

  /* ── Single item ── */
  .cart-item {
    display: flex;
    gap: 1.25rem;
    padding: 1.5rem;
    transition: background 0.15s;
  }
  .cart-item:hover { background: #fafafa; }
  .cart-item--bordered {
    border-bottom: 1px solid #f0f0f0;
  }

  /* Image */
  .cart-item-img-wrap {
    flex-shrink: 0;
    width: 110px;
    height: 130px;
    border-radius: 12px;
    background: #f4f4f4;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cart-item-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 8px;
    transition: transform 0.3s ease;
  }
  .cart-item:hover .cart-item-img { transform: scale(1.04); }

  /* Details layout */
  .cart-item-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
  }
  .cart-item-top {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: flex-start;
  }
  .cart-item-info { flex: 1; min-width: 0; }
  .cart-item-name {
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #111;
    margin: 0 0 0.35rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cart-item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .cart-meta-tag {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #777;
    background: #f3f3f3;
    padding: 3px 9px;
    border-radius: 100px;
  }

  /* Price column */
  .cart-item-price-col {
    text-align: right;
    flex-shrink: 0;
  }
  .cart-item-unit-price {
    font-size: 0.75rem;
    color: #aaa;
    margin-bottom: 2px;
  }
  .cart-item-total-price {
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #111;
  }

  /* Actions row */
  .cart-item-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 0.75rem;
  }

  /* Qty stepper */
  .qty-stepper {
    display: inline-flex;
    align-items: center;
    background: #f3f3f3;
    border-radius: 100px;
    padding: 4px;
    gap: 0;
  }
  .qty-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #333;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .qty-btn:hover:not(:disabled) {
    background: #fff;
    box-shadow: 0 1px 6px rgba(0,0,0,0.12);
    color: #000;
  }
  .qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .qty-value {
    min-width: 32px;
    text-align: center;
    font-size: 0.9rem;
    font-weight: 700;
    color: #111;
  }

  /* Remove button */
  .cart-remove-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: none;
    background: none;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: #bbb;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 8px;
    transition: background 0.15s, color 0.15s;
  }
  .cart-remove-btn:hover {
    background: #fff0f0;
    color: #e53e3e;
  }

  /* ── Promo section ── */
  .promo-section {
    padding: 1.25rem 1.5rem 1.5rem;
    border-top: 1px solid #f0f0f0;
    background: #fafafa;
  }
  .promo-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 0.6rem;
  }
  .promo-input-row {
    display: flex;
    gap: 8px;
  }
  .promo-input {
    flex: 1;
    height: 44px;
    border: 1.5px solid #e5e5e5;
    border-radius: 10px;
    padding: 0 14px;
    font-size: 0.88rem;
    font-weight: 500;
    color: #111;
    background: #fff;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .promo-input:focus {
    border-color: #111;
    box-shadow: 0 0 0 3px rgba(0,0,0,0.07);
  }
  .promo-input--success { border-color: #22c55e !important; }
  .promo-input--error   { border-color: #ef4444 !important; }
  .promo-apply-btn {
    height: 44px;
    padding: 0 20px;
    background: #111;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;
    white-space: nowrap;
  }
  .promo-apply-btn:hover { background: #333; transform: translateY(-1px); }
  .promo-apply-btn:active { transform: translateY(0); }
  .promo-msg {
    font-size: 0.8rem;
    font-weight: 600;
    margin: 0.5rem 0 0;
  }
  .promo-msg--success { color: #22c55e; }
  .promo-msg--error   { color: #ef4444; }

  /* ── Order summary card ── */
  .order-summary-card {
    background: #fff;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 2px 20px rgba(0,0,0,0.055);
    position: sticky;
    top: 24px;
  }
  .summary-title {
    font-size: 1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #111;
    margin-bottom: 1.4rem;
  }
  .summary-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.88rem;
    color: #555;
    margin-bottom: 0.75rem;
  }
  .summary-line span:last-child { font-weight: 600; color: #111; }
  .summary-free { color: #22c55e !important; font-weight: 700 !important; }
  .summary-line--discount { color: #22c55e; }
  .summary-line--discount span { color: #22c55e !important; }
  .summary-divider {
    height: 1px;
    background: #f0f0f0;
    margin: 1.1rem 0;
  }
  .summary-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1.5rem;
  }
  .summary-total span:first-child {
    font-size: 0.95rem;
    font-weight: 700;
    color: #111;
  }
  .summary-total span:last-child {
    font-size: 1.55rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: #111;
  }
  .checkout-btn {
    display: block;
    width: 100%;
    padding: 1rem;
    background: #111;
    color: #fff;
    text-align: center;
    border-radius: 14px;
    font-size: 0.88rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(0,0,0,0.18);
  }
  .checkout-btn:hover {
    background: #222;
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.22);
  }
  .checkout-btn:active { transform: translateY(0); }
  .clear-cart-btn {
    display: block;
    width: 100%;
    margin-top: 0.6rem;
    padding: 0.6rem;
    background: none;
    border: none;
    font-size: 0.8rem;
    color: #bbb;
    cursor: pointer;
    transition: color 0.15s;
    letter-spacing: 0.02em;
  }
  .clear-cart-btn:hover { color: #e53e3e; }
  .summary-trust {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 1rem;
    font-size: 0.72rem;
    color: #bbb;
    font-weight: 500;
  }

  /* ── Mobile ── */
  @media (max-width: 991px) {
    .order-summary-card { position: static; }
  }
  @media (max-width: 575px) {
    .cart-item {
      flex-direction: row;
      gap: 1rem;
      padding: 1.1rem;
    }
    .cart-item-img-wrap {
      width: 90px;
      height: 110px;
      border-radius: 10px;
    }
    .cart-item-top { flex-direction: column; gap: 0.25rem; }
    .cart-item-price-col { text-align: left; }
    .cart-item-name { white-space: normal; font-size: 0.92rem; }
    .cart-item-total-price { font-size: 1rem; }
    .order-summary-card { padding: 1.4rem; }
    .promo-section { padding: 1rem 1.1rem 1.25rem; }
    .cart-title { font-size: 1.6rem; }
  }
`;
