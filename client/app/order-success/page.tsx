'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaCheckCircle, FaHome, FaShoppingBag, FaHeadset } from 'react-icons/fa';
import axiosInstance from '@/utils/axiosConfig';
import { useAuth } from '@/context/AuthContext';

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
    size: string;
    color: string;
    image: string;
}

interface Order {
    order_number: string;
    status: string;
    shipping_address: string;
    total_amount: number;
    delivery_fee: number;
    items: OrderItem[];
    user_name?: string;
    user_email?: string;
}

export default function OrderSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');
    const { user } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const getFullImageUrl = (imagePath: string) => {
        if (!imagePath) return '/images/placeholders/placeholder.jpg';
        if (imagePath.startsWith('/uploads')) return `${backendUrl}${imagePath}`;
        return imagePath;
    };

    useEffect(() => {
        if (!orderId) {
            router.push('/');
            return;
        }
        const fetchOrder = async () => {
            try {
                let endpoint = '';
                if (user) {
                    endpoint = `/orders/${orderId}`;
                } else {
                    endpoint = `/guest-orders/${orderId}`;
                }
                const res = await axiosInstance.get(endpoint);
                const data = res.data.data;
                setOrder({
                    ...data,
                    total_amount: parseFloat(data.total_amount) || 0,
                    delivery_fee: parseFloat(data.delivery_fee) || 0,
                });
            } catch (err) {
                console.error(err);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId, router, user]);

    if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-dark" /></div>;
    if (!order) return null;

    const subtotal = order.total_amount - (order.delivery_fee || 0);
    const addressParts = order.shipping_address?.split(',') || ['Wadnaha Road', 'Hargeisa, Somaliland'];

    return (
        <div className="container py-5">
            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="mb-4">
                        <h1 className="display-6 fw-bold mb-2">Thank you for your order!</h1>
                        <p className="text-muted">Order #{order.order_number}</p>
                    </div>
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <div className="bg-warning rounded-circle p-2" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="text-dark fw-bold">✓</span>
                                </div>
                                <h5 className="fw-bold mb-0">{order.status?.toUpperCase() || 'PREPARING FOR DISPATCH'}</h5>
                            </div>
                            <p className="text-muted mb-0">Your order is confirmed and will be processed soon.</p>
                        </div>
                    </div>
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-3">SHIPPING ADDRESS</h5>
                            <p className="mb-1"><strong>{order.user_name || 'Customer'}</strong></p>
                            <p className="mb-1">{addressParts[0]}</p>
                            <p className="mb-1">{addressParts[1]}</p>
                            <p className="mb-0">{order.user_phone || '+252 63 XXXXXXXX'}</p>
                        </div>
                    </div>
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-3">ESTIMATED DELIVERY</h5>
                            <p className="mb-0">Your order is expected to arrive within 3-5 business days.</p>
                            <p className="mb-0 text-muted small mt-1">We will notify you once it has been handed over to our courier partners in Hargeisa.</p>
                        </div>
                    </div>
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center gap-3">
                                <FaHeadset size={30} className="text-primary" />
                                <div>
                                    <h5 className="fw-bold mb-1">Need help?</h5>
                                    <p className="mb-0">If you have any questions about your purchase, our team is here 24/7.</p>
                                    <Link href="/contact" className="btn btn-link text-dark text-decoration-none p-0 mt-2">CONTACT US →</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-3">ORDER SUMMARY</h5>
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="d-flex gap-3 mb-3 pb-2 border-bottom">
                                    {/* Product Image */}
                                    <div className="flex-shrink-0 bg-light d-flex align-items-center justify-content-center overflow-hidden" style={{ width: '60px', height: '60px' }}>
                                        <img
                                            src={getFullImageUrl(item.image)}
                                            alt={item.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    </div>
                                    {/* Product Details */}
                                    <div className="flex-grow-1">
                                        <div className="fw-bold">{item.name}</div>
                                        <div className="small text-muted">
                                            Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}
                                            {item.quantity > 1 && ` | Qty: ${item.quantity}`}
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
                                <span>Shipping (Hargeisa Express)</span>
                                <span>${order.delivery_fee.toFixed(2)}</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between fw-bold fs-5">
                                <span>TOTAL</span>
                                <span>${order.total_amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="d-flex gap-3 mt-4">
                        <Link href="/" className="btn btn-outline-dark rounded-0 flex-grow-1"><FaHome className="me-2" /> Home</Link>
                        <Link href="/orders" className="btn btn-dark rounded-0 flex-grow-1"><FaShoppingBag className="me-2" /> My Orders</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
