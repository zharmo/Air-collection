'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaTrashAlt, FaTag } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
    const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);

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
        } else {
            alert('Invalid promo code');
        }
    };

    // No login check – always show cart (empty or full)
    if (cart.items.length === 0) {
        return (
            <div className="container py-5 text-center">
                <div className="display-1 mb-3">🛒</div>
                <h2>Your bag is empty</h2>
                <p className="text-muted mb-4">Looks like you haven't added anything yet.</p>
                <Link href="/" className="btn btn-dark rounded-0 px-4">Continue Shopping</Link>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <h1 className="fw-bold mb-4">Shopping Bag</h1>
            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            {cart.items.map((item) => (
                                <div key={item.id} className="d-flex flex-wrap gap-3 mb-4 pb-3 border-bottom">
                                    <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: '100px', height: '120px' }}>
                                        <img
                                            src={getImageUrl(item.image)}
                                            alt={item.name}
                                            className="img-fluid"
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                        />
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex flex-wrap justify-content-between align-items-start">
                                            <div>
                                                <h5 className="fw-bold mb-1">{item.name}</h5>
                                                <p className="text-muted small mb-2">
                                                    {item.size && `SIZE: ${item.size} | `}
                                                    {item.color && `COLOR: ${item.color}`}
                                                </p>
                                            </div>
                                            <div className="fw-bold">${(item.price * item.quantity).toFixed(2)}</div>
                                        </div>
                                        <div className="d-flex align-items-center gap-3 mt-2">
                                            <div className="d-flex align-items-center border rounded-0">
                                                <button
                                                    className="btn btn-sm border-0"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="px-3">{item.quantity}</span>
                                                <button
                                                    className="btn btn-sm border-0"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                className="btn btn-link text-danger p-0"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <FaTrashAlt />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="mt-3 pt-2">
                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                    <FaTag className="text-muted" />
                                    <span className="text-muted">PROMO CODE</span>
                                    <input
                                        type="text"
                                        className="form-control form-control-sm rounded-0"
                                        style={{ width: '180px' }}
                                        placeholder="Enter code"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-dark btn-sm rounded-0"
                                        onClick={handleApplyPromo}
                                    >
                                        APPLY
                                    </button>
                                </div>
                                {discount > 0 && (
                                    <div className="text-success small mt-2">10% discount applied!</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-3">Order Summary</h5>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="d-flex justify-content-between mb-2 text-success">
                                    <span>Discount</span>
                                    <span>-${discount.toFixed(2)}</span>
                                </div>
                            )}
                            <hr />
                            <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <Link href="/checkout" className="btn btn-dark rounded-0 w-100 py-2">
                                Checkout
                            </Link>
                            <button className="btn btn-link text-muted w-100 mt-2" onClick={clearCart}>
                                Clear Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}