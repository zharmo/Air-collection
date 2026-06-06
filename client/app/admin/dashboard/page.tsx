'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axiosConfig';

interface DashboardStats {
    totalRevenue: number;
    todayRevenue: number;
    revenueChange: number;
    totalCustomers: number;
    totalOrders: number;
    deliveredOrders: number;
    activeOrders: number;
    todayOrders: number;
    pendingOrders: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        todayRevenue: 0,
        revenueChange: 0,
        totalCustomers: 0,
        totalOrders: 0,
        deliveredOrders: 0,
        activeOrders: 0,
        todayOrders: 0,
        pendingOrders: 0,
        totalProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch orders (admin sees all)
                const ordersRes = await axiosInstance.get('/orders');
                const orders = ordersRes.data.data || [];

                // Fetch products
                const productsRes = await axiosInstance.get('/products');
                const products = productsRes.data.data || [];

                // Fetch users (customers) – if endpoint exists, else we can query via separate call
                let totalCustomers = 0;
                try {
                    const usersRes = await axiosInstance.get('/users');
                    const users = usersRes.data.data || [];
                    totalCustomers = users.filter((u: any) => u.role === 'customer').length;
                } catch (e) {
                    // Fallback: count distinct user_id from orders (excluding guests)
                    const userIds = new Set(orders.filter((o: any) => o.user_id).map((o: any) => o.user_id));
                    totalCustomers = userIds.size;
                }

                // Calculate today's date (YYYY-MM-DD) in local time
                const today = new Date().toISOString().split('T')[0];

                // Process orders
                let totalRevenue = 0;
                let todayRevenue = 0;
                let deliveredOrders = 0;
                let activeOrders = 0;
                let todayOrders = 0;
                let pendingOrders = 0;

                for (const order of orders) {
                    const amount = parseFloat(order.total_amount) || 0;
                    const status = order.status;
                    const orderDate = order.created_at ? order.created_at.split('T')[0] : '';

                    totalRevenue += amount;
                    if (orderDate === today) {
                        todayOrders++;
                        todayRevenue += amount;
                    }

                    if (status === 'delivered') deliveredOrders++;
                    if (status === 'processing' || status === 'shipped') activeOrders++;
                    if (status === 'pending') pendingOrders++;
                }

                const totalOrders = orders.length;

                // Process products
                const totalProducts = products.length;
                const lowStockProducts = products.filter((p: any) => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
                const outOfStockProducts = products.filter((p: any) => p.stock_quantity === 0).length;

                const fulfillmentRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

                setStats({
                    totalRevenue,
                    todayRevenue,
                    revenueChange: 12.4, // placeholder – you can implement last month comparison
                    totalCustomers,
                    totalOrders,
                    deliveredOrders,
                    activeOrders,
                    todayOrders,
                    pendingOrders,
                    totalProducts,
                    lowStockProducts,
                    outOfStockProducts,
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-dark" role="status"></div>
            </div>
        );
    }

    const fulfillmentRate = stats.totalOrders > 0 ? ((stats.deliveredOrders / stats.totalOrders) * 100).toFixed(0) : 0;

    return (
        <div>
            {/* Header */}
            <div className="mb-4">
                <h1 className="mb-1" style={{ fontWeight: 'normal' }}>Overview</h1>
                <p className="text-muted">Real-time store performance and catalog health.</p>
            </div>

            <div className="row g-4">
                {/* FINANCIAL Section */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-4">
                            <h5 className="mb-3" style={{ fontWeight: 'normal' }}>FINANCIAL</h5>
                            <div className="mb-4">
                                <div className="text-muted small">TOTAL REVENUE</div>
                                <div className="fs-2" style={{ fontWeight: 'normal' }}>${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                <div className="text-success mt-1">+{stats.revenueChange}% vs last month</div>
                                <div className="text-muted small">8% daily target reached</div>
                            </div>
                            <div>
                                <div className="text-muted small">TODAY'S REVENUE</div>
                                <div className="fs-4" style={{ fontWeight: 'normal' }}>${stats.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COMMUNITY Section */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-4">
                            <h5 className="mb-3" style={{ fontWeight: 'normal' }}>COMMUNITY</h5>
                            <div className="mb-2">
                                <div className="text-muted small">TOTAL CUSTOMERS</div>
                                <div className="fs-2" style={{ fontWeight: 'normal' }}>{stats.totalCustomers.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ORDERS FULFILLMENT Section */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-4">
                            <h5 className="mb-3" style={{ fontWeight: 'normal' }}>ORDERS FULFILLMENT</h5>
                            <div className="row mb-3">
                                <div className="col-6">
                                    <div className="text-muted small">TOTAL ORDERS</div>
                                    <div className="fs-4" style={{ fontWeight: 'normal' }}>{stats.totalOrders}</div>
                                </div>
                                <div className="col-6">
                                    <div className="text-muted small">DELIVERED</div>
                                    <div className="fs-4" style={{ fontWeight: 'normal' }}>{stats.deliveredOrders}</div>
                                </div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-6">
                                    <div className="text-muted small">ACTIVE</div>
                                    <div className="fs-4" style={{ fontWeight: 'normal' }}>{stats.activeOrders}</div>
                                </div>
                                <div className="col-6">
                                    <div className="text-muted small">TODAY</div>
                                    <div className="fs-4" style={{ fontWeight: 'normal' }}>{stats.todayOrders}</div>
                                </div>
                            </div>
                            <div className="row mb-3">
                                <div className="col-6">
                                    <div className="text-muted small">PENDING</div>
                                    <div className="fs-4" style={{ fontWeight: 'normal' }}>{stats.pendingOrders}</div>
                                </div>
                                <div className="col-6">
                                    <div className="text-muted small">FULFILLMENT RATE</div>
                                    <div className="fs-4" style={{ fontWeight: 'normal' }}>{fulfillmentRate}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* INVENTORY STATUS Section */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-4">
                            <h5 className="mb-3" style={{ fontWeight: 'normal' }}>INVENTORY STATUS</h5>
                            <div className="row mb-3">
                                <div className="col-6">
                                    <div className="text-muted small">TOTAL PRODUCTS</div>
                                    <div className="fs-4" style={{ fontWeight: 'normal' }}>{stats.totalProducts}</div>
                                </div>
                                <div className="col-6">
                                    <div className="text-muted small">LOW STOCK</div>
                                    <div className="fs-4" style={{ fontWeight: 'normal' }}>{stats.lowStockProducts}</div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-6">
                                    <div className="text-muted small">OUT OF STOCK</div>
                                    <div className="fs-4" style={{ fontWeight: 'normal' }}>{stats.outOfStockProducts}</div>
                                </div>
                                <div className="col-6">
                                    <div className="text-muted small">REQUIRES REVIEW</div>
                                    <div className="text-danger fs-6" style={{ fontWeight: 'normal' }}>CRITICAL ACTION</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}