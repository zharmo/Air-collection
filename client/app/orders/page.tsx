'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaShoppingBag, FaEye } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/utils/axiosConfig';

interface Order {
    id: number;
    order_number: string;
    total_amount: number | string;
    status: string;
    created_at: string;
    payment_status: string;
}

const toMoney = (value: number | string | null | undefined) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
};

const ordersTypographyStyles = `
    .orders-page {
        font-family: 'Jost', sans-serif;
        font-weight: 300;
        color: #0a0a0a;
    }

    .orders-page h1,
    .orders-page h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: clamp(38px, 5vw, 58px);
        font-weight: 500 !important;
        letter-spacing: -0.01em;
        line-height: 1;
    }

    .orders-page h3 {
        font-family: 'Cormorant Garamond', serif;
        font-size: 30px;
        font-weight: 500;
    }

    .orders-page table,
    .orders-page p,
    .orders-page span,
    .orders-page .small {
        font-family: 'Jost', sans-serif;
    }

    .orders-page thead th {
        font-family: 'Jost', sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .orders-page tbody td {
        font-size: 14px;
        font-weight: 300;
    }

    .orders-page .btn {
        font-family: 'Jost', sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.16em;
        text-transform: uppercase;
    }

    .orders-page .badge {
        font-family: 'Jost', sans-serif;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .orders-page .fw-bold,
    .orders-page .fw-medium {
        font-weight: 500 !important;
    }
`;

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
            <div className="container py-5 text-center orders-page">
                <style>{ordersTypographyStyles}</style>
                <div className="spinner-border text-dark" role="status"></div>
            </div>
        );
    }

    return (
        <div className="container py-5 orders-page">
            <style>{ordersTypographyStyles}</style>
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
                                                    <td>${toMoney(order.total_amount)}</td>
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
