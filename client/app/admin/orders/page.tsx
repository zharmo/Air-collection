'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaSearch, FaEye, FaTruck } from 'react-icons/fa';
import axiosInstance from '@/utils/axiosConfig';

interface OrderItem {
    product_name: string;
    quantity: number;
    price: number;
    image?: string;
}

interface Order {
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
    user_name?: string;
    items?: OrderItem[];
}

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [visibleCount, setVisibleCount] = useState(10);
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [searchTerm, statusFilter, orders]);

    const fetchOrders = async () => {
        try {
            const res = await axiosInstance.get('/orders');
            const ordersWithNumbers = res.data.data.map((order: any) => ({
                ...order,
                total_amount: typeof order.total_amount === 'number' ? order.total_amount : parseFloat(order.total_amount) || 0,
                items: order.items?.map((item: any) => ({
                    ...item,
                    price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
                })) || [],
            }));
            setOrders(ordersWithNumbers);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    const filterOrders = () => {
        let filtered = [...orders];
        if (searchTerm) {
            filtered = filtered.filter(order =>
                order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.user_name && order.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        if (statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter);
        }
        setFilteredOrders(filtered);
        setVisibleCount(10);
    };

    const updateOrderStatus = async (orderId: number, newStatus: string) => {
        setUpdatingOrderId(orderId);
        try {
            await axiosInstance.put(`/orders/${orderId}/status`, { status: newStatus });
            await fetchOrders();
        } catch (error) {
            console.error('Status update failed', error);
            alert('Failed to update status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-warning text-dark';
            case 'processing': return 'bg-info text-white';
            case 'shipped': return 'bg-primary text-white';
            case 'delivered': return 'bg-success text-white';
            case 'cancelled': return 'bg-danger text-white';
            default: return 'bg-secondary text-white';
        }
    };

    const getFullImageUrl = (imagePath: string) => {
        if (!imagePath) return '/images/placeholders/placeholder.jpg';
        if (imagePath.startsWith('/uploads')) return `${backendUrl}${imagePath}`;
        return imagePath;
    };

    const getProductImages = (order: Order) => {
        if (!order.items) return [];
        return order.items.slice(0, 3).map(item => item.image).filter(Boolean);
    };

    if (loading) {
        return <div className="text-center py-5"><div className="spinner-border text-dark" /></div>;
    }

    const displayedOrders = filteredOrders.slice(0, visibleCount);
    const totalOrders = filteredOrders.length;

    return (
        <div>
            <h1 className="mb-4" style={{ fontWeight: 'normal' }}>Order Management</h1>

            <div className="mb-4">
                <div className="input-group" style={{ maxWidth: '300px' }}>
                    <span className="input-group-text bg-white"><FaSearch /></span>
                    <input
                        type="text"
                        className="form-control rounded-0"
                        placeholder="Search order or customer..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4">
                <button className={`btn ${statusFilter === 'all' ? 'btn-dark' : 'btn-outline-dark'} rounded-0`} onClick={() => setStatusFilter('all')}>ALL ORDERS</button>
                <button className={`btn ${statusFilter === 'pending' ? 'btn-dark' : 'btn-outline-dark'} rounded-0`} onClick={() => setStatusFilter('pending')}>PENDING</button>
                <button className={`btn ${statusFilter === 'processing' ? 'btn-dark' : 'btn-outline-dark'} rounded-0`} onClick={() => setStatusFilter('processing')}>PROCESSING</button>
                <button className={`btn ${statusFilter === 'shipped' ? 'btn-dark' : 'btn-outline-dark'} rounded-0`} onClick={() => setStatusFilter('shipped')}>SHIPPED</button>
                <button className={`btn ${statusFilter === 'delivered' ? 'btn-dark' : 'btn-outline-dark'} rounded-0`} onClick={() => setStatusFilter('delivered')}>DELIVERED</button>
            </div>

            <div className="row g-4">
                {displayedOrders.map(order => {
                    const statusColor = getStatusColor(order.status);
                    const itemCount = order.items?.length || 0;
                    const productImages = getProductImages(order);
                    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    });

                    return (
                        <div key={order.id} className="col-md-6">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h5 className="mb-1" style={{ fontWeight: 'normal' }}>#{order.order_number}</h5>
                                            <span className={`badge ${statusColor} rounded-pill`}>{order.status.toUpperCase()}</span>
                                        </div>
                                        <div className="text-end">
                                            <div>${order.total_amount.toFixed(2)}</div>
                                            <div className="text-muted small">{itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}</div>
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <div className="fw-semibold">{order.user_name || 'Guest'}</div>
                                            <div className="text-muted small">{orderDate}</div>
                                        </div>
                                        <div className="d-flex gap-1">
                                            {productImages.map((img, idx) => (
                                                <div key={idx} className="bg-light rounded" style={{ width: '40px', height: '40px' }}>
                                                    <img src={getFullImageUrl(img)} alt="product" className="img-fluid w-100 h-100 object-fit-contain"
                                                         onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                </div>
                                            ))}
                                            {itemCount > 3 && (
                                                <div className="bg-light d-flex align-items-center justify-content-center rounded" style={{ width: '40px', height: '40px' }}>
                                                    <span className="small fw-bold">+{itemCount - 3}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2 mt-3">
                                        <Link href={`/admin/orders/${order.id}`} className="btn btn-outline-dark rounded-0 flex-grow-1">
                                            <FaEye className="me-2" /> VIEW DETAILS
                                        </Link>
                                        <div className="dropdown flex-grow-1">
                                            <button className="btn btn-dark rounded-0 w-100 dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                                    disabled={updatingOrderId === order.id}>
                                                {updatingOrderId === order.id ? 'Updating...' : 'UPDATE STATUS'}
                                            </button>
                                            <ul className="dropdown-menu w-100">
                                                <li><button className="dropdown-item" onClick={() => updateOrderStatus(order.id, 'pending')}>Pending</button></li>
                                                <li><button className="dropdown-item" onClick={() => updateOrderStatus(order.id, 'processing')}>Processing</button></li>
                                                <li><button className="dropdown-item" onClick={() => updateOrderStatus(order.id, 'shipped')}>Shipped</button></li>
                                                <li><button className="dropdown-item" onClick={() => updateOrderStatus(order.id, 'delivered')}>Delivered</button></li>
                                                <li><hr className="dropdown-divider" /></li>
                                                <li><button className="dropdown-item text-danger" onClick={() => updateOrderStatus(order.id, 'cancelled')}>Cancel Order</button></li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {displayedOrders.length > 0 && displayedOrders.length < totalOrders && (
                <div className="text-center mt-4">
                    <button className="btn btn-outline-dark rounded-0 px-4" onClick={() => setVisibleCount(prev => prev + 10)}>LOAD MORE ORDERS</button>
                </div>
            )}

            {displayedOrders.length === 0 && <div className="text-center py-5"><p className="text-muted">No orders found.</p></div>}
        </div>
    );
}