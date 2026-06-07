'use client';

import { ChangeEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaTruck, FaMoneyBillWave, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/utils/axiosConfig';

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
            <div className="container py-5 text-center">
                <div className="display-1 mb-3">🛒</div>
                <h2>Your cart is empty</h2>
                <p className="text-muted mb-4">Looks like you haven't added anything yet.</p>
                <Link href="/" className="btn btn-dark rounded-0 px-4">Continue Shopping</Link>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <h2 className="fw-bold mb-4">Checkout</h2>
                            <p className="text-muted small mb-4">Complete your order details below</p>

                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    {error}
                                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                                </div>
                            )}

                            <div className="mb-4">
                                <h5 className="fw-bold mb-3"><FaUser className="me-2 text-muted" /> Customer Information</h5>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Full Name *</label>
                                        <input type="text" name="fullName" className="form-control rounded-0" placeholder="John Doe" value={formData.fullName} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Email Address *</label>
                                        <input type="email" name="email" className="form-control rounded-0" placeholder="john@example.com" value={formData.email} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Phone Number *</label>
                                        <input type="tel" name="phone" className="form-control rounded-0" placeholder="+252 63 123456" value={formData.phone} onChange={handleChange} required />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h5 className="fw-bold mb-3"><FaMapMarkerAlt className="me-2 text-muted" /> Shipping Address</h5>
                                <div className="mb-3">
                                    <label className="form-label">Street Address *</label>
                                    <input type="text" name="streetAddress" className="form-control rounded-0" placeholder="Wadnaha Road, 26 June District" value={formData.streetAddress} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Location *</label>
                                    <select name="location" className="form-select rounded-0" value={formData.location} onChange={handleChange}>
                                        <option value="inside">Inside Hargeisa ($1.00 delivery)</option>
                                        <option value="outside">Outside Hargeisa ($1.50 delivery)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h5 className="fw-bold mb-3"><FaMoneyBillWave className="me-2 text-muted" /> Payment Method</h5>
                                <div className="border rounded-0 p-3 bg-light">
                                    <div className="d-flex align-items-center gap-3">
                                        <input type="radio" id="cod" name="paymentMethod" value="cod" checked readOnly className="form-check-input" />
                                        <label htmlFor="cod" className="form-check-label fw-medium">Cash on Delivery</label>
                                    </div>
                                    <p className="text-muted small mt-2 mb-0 ms-4">Pay when you receive your order</p>
                                </div>
                            </div>

                            <button className="btn btn-dark rounded-0 w-100 py-3 fw-bold" onClick={handlePlaceOrder} disabled={loading}>
                                {loading ? 'Placing Order...' : 'Confirm Order — Cash on Delivery'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-3">Order Summary</h5>
                            {cart.items.map((item) => (
                                <div key={item.id} className="d-flex gap-3 mb-3 pb-2 border-bottom">
                                    <div className="flex-shrink-0 bg-light d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '60px', height: '60px' }}>
                                                        <img src={getImageUrl(item.image)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="fw-bold">{item.name}</div>
                                        <div className="small text-muted">
                                            {item.size && `Size: ${item.size} | `}
                                            {item.color && `Color: ${item.color}`}
                                            <span className="ms-2">Qty: {item.quantity}</span>
                                        </div>
                                    </div>
                                    <div className="fw-bold">${(item.price * item.quantity).toFixed(2)}</div>
                                </div>
                            ))}
                            <div className="d-flex justify-content-between mt-3">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mt-1">
                                <span><FaTruck className="me-1" /> Delivery Fee</span>
                                <span>${deliveryFee.toFixed(2)}</span>
                            </div>
                            <hr className="my-3" />
                            <div className="d-flex justify-content-between fw-bold fs-5">
                                <span>TOTAL</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <p className="text-muted small mt-3 mb-0">* Cash on delivery only. No additional taxes.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
