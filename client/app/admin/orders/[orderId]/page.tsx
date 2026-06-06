'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaTruck, FaCreditCard, FaUser, FaMapMarkerAlt, FaTrash } from 'react-icons/fa';
import axiosInstance from '@/utils/axiosConfig';

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

interface Order {
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    payment_status: string;
    shipping_address: string;
    created_at: string;
    user_name?: string;
    user_email?: string;
    items: OrderItem[];
    delivery_fee?: number;
}

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState('');

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    const getFullImageUrl = (imagePath: string) => {
        if (!imagePath) return '/images/placeholders/placeholder.jpg';
        if (imagePath.startsWith('/uploads')) return `${backendUrl}${imagePath}`;
        return imagePath;
    };

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await axiosInstance.get(`/orders/${orderId}`);
                const data = res.data.data;
                // Convert numeric strings to numbers
                const deliveryFee = parseFloat(data.delivery_fee) || 0;
                const totalAmount = parseFloat(data.total_amount) || 0;
                setOrder({
                    ...data,
                    delivery_fee: deliveryFee,
                    total_amount: totalAmount,
                    items: data.items?.map((item: any) => ({
                        ...item,
                        price: parseFloat(item.price) || 0,
                        total: parseFloat(item.total) || 0,
                    })) || [],
                });
                setNewStatus(data.status);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Order not found');
            } finally {
                setLoading(false);
            }
        };
        if (orderId) fetchOrder();
    }, [orderId]);

    const handleStatusUpdate = async () => {
        if (newStatus === order?.status) return;
        setUpdating(true);
        try {
            await axiosInstance.put(`/orders/${orderId}/status`, { status: newStatus });
            setOrder(prev => prev ? { ...prev, status: newStatus } : null);
            alert('Order status updated');
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteOrder = async () => {
        if (!confirm('Are you sure? This will permanently delete the order and its items.')) return;
        try {
            await axiosInstance.delete(`/orders/${orderId}`);
            alert('Order deleted');
            router.push('/admin/orders');
        } catch (err) {
            console.error(err);
            alert('Failed to delete order');
        }
    };

    if (loading) {
        return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-dark" /></div>;
    }

    if (error || !order) {
        return (
            <div className="container py-5 text-center">
                <h2 style={{ fontWeight: 'normal' }}>Order not found</h2>
                <p className="text-muted">{error}</p>
                <Link href="/admin/orders" className="btn btn-dark rounded-0">Back to Orders</Link>
            </div>
        );
    }

    const subtotal = order.total_amount - (order.delivery_fee || 0);
    const addressParts = order.shipping_address?.split(',') || [];

    return (
        <div className="container py-4">
            <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                <Link href="/admin/orders" className="btn btn-outline-dark rounded-0">
                    <FaArrowLeft className="me-2" /> Back to Orders
                </Link>
                <h1 className="mb-0" style={{ fontWeight: 'normal' }}>Order #{order.order_number}</h1>
                <button onClick={handleDeleteOrder} className="btn btn-outline-danger rounded-0 ms-auto">
                    <FaTrash className="me-2" /> Delete Order
                </button>
            </div>

            <div className="row g-4">
                {/* Left column: Order items */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white" style={{ fontWeight: 'normal' }}>Order Items</div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Product</th>
                                            <th>Size/Color</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <img
                                                            src={getFullImageUrl(item.image)}
                                                            alt={item.product_name}
                                                            style={{ width: '50px', height: '50px', objectFit: 'contain' }}
                                                            className="bg-light p-1"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                        <span>{item.product_name}</span>
                                                    </div>
                                                </td>
                                                <td>{item.size || 'N/A'} / {item.color || 'N/A'}</td>
                                                <td>{item.quantity}</td>
                                                <td>${item.price.toFixed(2)}</td>
                                                <td>${item.total.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="table-light">
                                        <tr>
                                            <td colSpan={4} className="text-end" style={{ fontWeight: 'normal' }}>Subtotal:</td>
                                            <td style={{ fontWeight: 'normal' }}>${subtotal.toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={4} className="text-end" style={{ fontWeight: 'normal' }}>Delivery Fee:</td>
                                            <td style={{ fontWeight: 'normal' }}>${(order.delivery_fee || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={4} className="text-end fs-5" style={{ fontWeight: 'normal' }}>Total:</td>
                                            <td className="fs-5" style={{ fontWeight: 'normal' }}>${order.total_amount.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column: Customer & Order Info */}
                <div className="col-lg-4">
                    {/* Customer Information */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white" style={{ fontWeight: 'normal' }}>
                            <FaUser className="me-2" /> Customer Information
                        </div>
                        <div className="card-body">
                            <p className="mb-1"><strong>{order.user_name || 'Guest'}</strong></p>
                            <p className="mb-1 text-muted">{order.user_email || 'No email'}</p>
                            <p className="mb-0 text-muted">Order placed: {new Date(order.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white" style={{ fontWeight: 'normal' }}>
                            <FaMapMarkerAlt className="me-2" /> Shipping Address
                        </div>
                        <div className="card-body">
                            {addressParts.map((part, i) => (
                                <p key={i} className="mb-1">{part}</p>
                            ))}
                        </div>
                    </div>

                    {/* Order Status */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white" style={{ fontWeight: 'normal' }}>
                            <FaTruck className="me-2" /> Order Status
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label" style={{ fontWeight: 'normal' }}>Current Status</label>
                                <select
                                    className="form-select rounded-0"
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <button
                                className="btn btn-dark rounded-0 w-100"
                                onClick={handleStatusUpdate}
                                disabled={updating || newStatus === order.status}
                            >
                                {updating ? 'Updating...' : 'Update Status'}
                            </button>
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white" style={{ fontWeight: 'normal' }}>
                            <FaCreditCard className="me-2" /> Payment
                        </div>
                        <div className="card-body">
                            <p className="mb-1"><strong>Method:</strong> Cash on Delivery</p>
                            <p className="mb-0">
                                <strong>Status:</strong>{' '}
                                <span className={`badge ${order.payment_status === 'paid' ? 'bg-success' : 'bg-warning'}`}>
                                    {order.payment_status || 'pending'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}