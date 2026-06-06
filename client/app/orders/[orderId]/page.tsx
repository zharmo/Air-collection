'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaTruck, FaCreditCard } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/utils/axiosConfig';

interface OrderItem {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
    size?: string;
    color?: string;
}

interface Order {
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    payment_status: string;
    shipping_address: string;
    created_at: string;
    items: OrderItem[];
}

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const orderId = params.orderId;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        const fetchOrder = async () => {
            try {
                const res = await axiosInstance.get(`/orders/${orderId}`);
                setOrder(res.data.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Order not found');
            } finally {
                setLoading(false);
            }
        };
        if (orderId) fetchOrder();
    }, [orderId, user]);

    if (!user) return null;
    if (loading) return <div className="container py-5 text-center"><div className="spinner-border text-dark" /></div>;
    if (error || !order) return <div className="container py-5 text-center"><h2>{error || 'Order not found'}</h2><Link href="/orders" className="btn btn-dark rounded-0">Back to Orders</Link></div>;

    const addressParts = order.shipping_address?.split(',') || [];

    return (
        <div className="container py-5">
            <div className="mb-4">
                <Link href="/orders" className="btn btn-link text-dark p-0">
                    <FaArrowLeft className="me-2" /> Back to Orders
                </Link>
            </div>

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <h2 className="fw-bold mb-2">Order #{order.order_number}</h2>
                            <p className="text-muted">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                            <hr />
                            <h5 className="fw-bold mb-3">Order Items</h5>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead className="table-light">
                                        <tr><th>Product</th><th>Size/Color</th><th>Quantity</th><th>Price</th><th>Total</th></tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>{item.product_name}</td>
                                                <td>{item.size || 'N/A'} / {item.color || 'N/A'}</td>
                                                <td>{item.quantity}</td>
                                                <td>${item.price}</td>
                                                <td>${item.total}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-3">Order Summary</h5>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Total Amount</span>
                                <span className="fw-bold">${order.total_amount.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Status</span>
                                <span className={`badge ${order.status === 'delivered' ? 'bg-success' : 'bg-warning'}`}>{order.status}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-3">
                                <span>Payment</span>
                                <span className={`badge ${order.payment_status === 'paid' ? 'bg-success' : 'bg-secondary'}`}>{order.payment_status}</span>
                            </div>
                            <hr />
                            <h6 className="fw-bold">Shipping Address</h6>
                            <p className="text-muted small">
                                {addressParts.map((part, i) => <span key={i}>{part}<br /></span>)}
                            </p>
                            <hr />
                            <div className="d-flex justify-content-between">
                                <FaTruck /> <span className="text-muted small">Estimated delivery: 3-5 business days</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}