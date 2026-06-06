'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaShoppingBag, FaEye } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/utils/axiosConfig';

interface Order {
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
    payment_status: string;
}

export default function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetchOrders = async () => {
            try {
                const res = await axiosInstance.get('/orders');
                setOrders(res.data.data);
            } catch (error) {
                console.error('Failed to fetch orders', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user]);

    if (!user) return null;

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-dark" role="status"></div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4 p-md-5">
                            <div className="text-center mb-4">
                                <FaShoppingBag size={40} className="text-muted mb-2" />
                                <h1 className="fw-bold">My Orders</h1>
                                <p className="text-muted">Track and manage your purchases</p>
                            </div>

                            {orders.length === 0 ? (
                                <div className="text-center py-5">
                                    <div className="display-1 mb-3">📦</div>
                                    <h3>No orders yet</h3>
                                    <p className="text-muted">When you place an order, it will appear here.</p>
                                    <Link href="/" className="btn btn-dark rounded-0 mt-3">Start Shopping</Link>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Order #</th>
                                                <th>Date</th>
                                                <th>Total</th>
                                                <th>Status</th>
                                                <th>Payment</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td className="fw-medium">{order.order_number}</td>
                                                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                                    <td>${order.total_amount.toFixed(2)}</td>
                                                    <td>
                                                        <span className={`badge ${
                                                            order.status === 'delivered' ? 'bg-success' :
                                                            order.status === 'processing' ? 'bg-info' :
                                                            order.status === 'cancelled' ? 'bg-danger' : 'bg-warning'
                                                        }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${order.payment_status === 'paid' ? 'bg-success' : 'bg-secondary'}`}>
                                                            {order.payment_status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <Link href={`/orders/${order.id}`} className="btn btn-sm btn-outline-dark rounded-0">
                                                            <FaEye className="me-1" /> View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}