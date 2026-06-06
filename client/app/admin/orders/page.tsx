'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    FaSearch, FaEye, FaFilter, FaDownload, FaTimes, FaSort,
    FaSortUp, FaSortDown, FaCheckSquare, FaSquare, FaMinusSquare,
    FaBell, FaChartLine, FaRobot, FaFileExport, FaBoxOpen,
    FaShippingFast, FaCheckCircle, FaBan, FaSpinner, FaClock,
    FaDollarSign, FaUsers, FaExclamationTriangle, FaArrowUp,
    FaArrowDown, FaMinus, FaChevronLeft, FaChevronRight,
    FaFileCsv, FaFilePdf, FaFileExcel, FaSlidersH, FaRegBell,
} from 'react-icons/fa';
import axiosInstance from '@/utils/axiosConfig';

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
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
    status: 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
    payment_status?: 'paid' | 'unpaid' | 'refunded' | 'partial';
    payment_method?: string;
    customer_email?: string;
    customer_phone?: string;
    shipping_region?: string;
    customer_type?: 'new' | 'returning' | 'vip';
    created_at: string;
    user_name?: string;
    items?: OrderItem[];
}

type SortField = 'order_number' | 'user_name' | 'total_amount' | 'status' | 'created_at' | 'items';
type SortDir   = 'asc' | 'desc' | null;

interface Notification {
    id: number;
    type: 'new_order' | 'status_updated' | 'cancelled' | 'failed_payment';
    message: string;
    time: string;
    read: boolean;
}

interface Filters {
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    customerType: string;
    region: string;
    dateFrom: string;
    dateTo: string;
    revenueMin: string;
    revenueMax: string;
}

/* ══════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════ */
const ALL_STATUSES = ['pending','processing','packed','shipped','delivered','cancelled'] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: JSX.Element }> = {
    pending:    { label: 'Pending',    color: '#b45309', bg: '#fef3c7', icon: <FaClock size={11}/> },
    processing: { label: 'Processing', color: '#1d4ed8', bg: '#dbeafe', icon: <FaSpinner size={11}/> },
    packed:     { label: 'Packed',     color: '#7c3aed', bg: '#ede9fe', icon: <FaBoxOpen size={11}/> },
    shipped:    { label: 'Shipped',    color: '#0369a1', bg: '#e0f2fe', icon: <FaShippingFast size={11}/> },
    delivered:  { label: 'Delivered',  color: '#15803d', bg: '#dcfce7', icon: <FaCheckCircle size={11}/> },
    cancelled:  { label: 'Cancelled',  color: '#b91c1c', bg: '#fee2e2', icon: <FaBan size={11}/> },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    paid:     { label: 'Paid',     color: '#15803d', bg: '#dcfce7' },
    unpaid:   { label: 'Unpaid',   color: '#b91c1c', bg: '#fee2e2' },
    refunded: { label: 'Refunded', color: '#6d28d9', bg: '#ede9fe' },
    partial:  { label: 'Partial',  color: '#b45309', bg: '#fef3c7' },
};

const PAGE_SIZE = 15;

/* ══════════════════════════════════════════
   MOCK DATA GENERATOR (replace with real API)
══════════════════════════════════════════ */
const generateMockOrders = (): Order[] => {
    const names = ['Alice Johnson','Bob Smith','Carol White','David Lee','Emma Brown','Frank Chen','Grace Kim','Henry Park'];
    const statuses: Order['status'][] = ['pending','processing','packed','shipped','delivered','cancelled'];
    const pmethods = ['Credit Card','PayPal','Bank Transfer','Apple Pay'];
    const pstatuses: Order['payment_status'][] = ['paid','unpaid','refunded','partial'];
    const regions = ['New York','California','Texas','Florida','Illinois'];
    const ctypes: Order['customer_type'][] = ['new','returning','vip'];
    return Array.from({ length: 87 }, (_, i) => {
        const status = statuses[i % statuses.length];
        const itemCount = Math.floor(Math.random() * 5) + 1;
        return {
            id: i + 1,
            order_number: `ORD-${String(10001 + i).padStart(5,'0')}`,
            total_amount: parseFloat((Math.random() * 800 + 20).toFixed(2)),
            status,
            payment_status: pstatuses[Math.floor(Math.random() * pstatuses.length)],
            payment_method: pmethods[Math.floor(Math.random() * pmethods.length)],
            customer_email: `user${i + 1}@example.com`,
            customer_phone: `+1-555-${String(1000 + i).padStart(4,'0')}`,
            shipping_region: regions[Math.floor(Math.random() * regions.length)],
            customer_type: ctypes[Math.floor(Math.random() * ctypes.length)],
            created_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
            user_name: names[i % names.length],
            items: Array.from({ length: itemCount }, (_, j) => ({
                product_name: `Product ${j + 1}`,
                quantity: Math.floor(Math.random() * 3) + 1,
                price: parseFloat((Math.random() * 200 + 10).toFixed(2)),
                image: '',
            })),
        };
    });
};

/* ══════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════ */

/* ── Status Badge ── */
const StatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748b', bg: '#f1f5f9', icon: null };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: cfg.bg, color: cfg.color,
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
            padding: '3px 9px', borderRadius: 100,
        }}>
            {cfg.icon} {cfg.label.toUpperCase()}
        </span>
    );
};

/* ── Payment Badge ── */
const PaymentBadge = ({ status }: { status?: string }) => {
    if (!status) return <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>—</span>;
    const cfg = PAYMENT_CONFIG[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };
    return (
        <span style={{
            display: 'inline-block', background: cfg.bg, color: cfg.color,
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
            padding: '3px 9px', borderRadius: 100,
        }}>{cfg.label.toUpperCase()}</span>
    );
};

/* ── Analytics Card ── */
interface AnalyticsCardProps {
    label: string; value: string | number; growth: number;
    icon: JSX.Element; accentColor: string; delay?: number;
}
const AnalyticsCard = ({ label, value, growth, icon, accentColor, delay = 0 }: AnalyticsCardProps) => (
    <div className="col-xl-3 col-lg-4 col-sm-6" style={{ animationDelay: `${delay}ms` }}>
        <div className="acard" style={{ '--accent': accentColor } as React.CSSProperties}>
            <div className="acard-icon" style={{ background: `${accentColor}18`, color: accentColor }}>
                {icon}
            </div>
            <div className="acard-body">
                <div className="acard-label">{label}</div>
                <div className="acard-value">{value}</div>
                <div className={`acard-growth ${growth >= 0 ? 'up' : 'down'}`}>
                    {growth >= 0 ? <FaArrowUp size={9}/> : <FaArrowDown size={9}/>}
                    {Math.abs(growth)}% vs last month
                </div>
            </div>
        </div>
    </div>
);

/* ── Sort Header ── */
const SortTh = ({ label, field, sort, onSort }: {
    label: string; field: SortField;
    sort: { field: SortField | null; dir: SortDir };
    onSort: (f: SortField) => void;
}) => (
    <th onClick={() => onSort(field)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {label}
            {sort.field === field
                ? sort.dir === 'asc' ? <FaSortUp size={12} style={{ color: '#4f46e5' }}/>
                                     : <FaSortDown size={12} style={{ color: '#4f46e5' }}/>
                : <FaSort size={12} style={{ opacity: 0.3 }}/>}
        </span>
    </th>
);

/* ── AI Insight Card ── */
const AICard = ({ title, value, sub, icon, color }: {
    title: string; value: string; sub: string; icon: JSX.Element; color: string;
}) => (
    <div className="ai-card">
        <div className="ai-card-icon" style={{ background: `${color}15`, color }}>{icon}</div>
        <div>
            <div className="ai-card-title">{title}</div>
            <div className="ai-card-value">{value}</div>
            <div className="ai-card-sub">{sub}</div>
        </div>
    </div>
);

/* ── Notification Item ── */
const NotifItem = ({ notif }: { notif: Notification }) => {
    const colors: Record<string, string> = {
        new_order: '#4f46e5', status_updated: '#0369a1',
        cancelled: '#b91c1c', failed_payment: '#b45309',
    };
    return (
        <div className={`notif-item ${!notif.read ? 'notif-unread' : ''}`}>
            <div className="notif-dot" style={{ background: colors[notif.type] || '#94a3b8' }} />
            <div>
                <div className="notif-msg">{notif.message}</div>
                <div className="notif-time">{notif.time}</div>
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function AdminOrdersPage() {
    /* State */
    const [orders,          setOrders         ] = useState<Order[]>([]);
    const [loading,         setLoading        ] = useState(true);
    const [searchTerm,      setSearchTerm     ] = useState('');
    const [filters,         setFilters        ] = useState<Filters>({
        status: 'all', paymentStatus: 'all', paymentMethod: 'all',
        customerType: 'all', region: 'all', dateFrom: '', dateTo: '',
        revenueMin: '', revenueMax: '',
    });
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [showNotifPanel,  setShowNotifPanel ] = useState(false);
    const [showAIPanel,     setShowAIPanel    ] = useState(false);
    const [selected,        setSelected       ] = useState<Set<number>>(new Set());
    const [sort,            setSort           ] = useState<{ field: SortField | null; dir: SortDir }>({ field: null, dir: null });
    const [page,            setPage           ] = useState(1);
    const [updatingId,      setUpdatingId     ] = useState<number | null>(null);
    const [bulkStatus,      setBulkStatus     ] = useState('');
    const [darkMode,        setDarkMode       ] = useState(false);
    const [notifications,   setNotifications  ] = useState<Notification[]>([
        { id: 1, type: 'new_order',      message: 'New order #ORD-10088 received',          time: '2 min ago',  read: false },
        { id: 2, type: 'status_updated', message: 'Order #ORD-10072 marked as shipped',     time: '15 min ago', read: false },
        { id: 3, type: 'cancelled',      message: 'Order #ORD-10065 was cancelled',         time: '1 hr ago',   read: true  },
        { id: 4, type: 'failed_payment', message: 'Payment failed for order #ORD-10059',    time: '3 hr ago',   read: true  },
        { id: 5, type: 'new_order',      message: 'New order #ORD-10087 received',          time: '5 hr ago',   read: true  },
    ]);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    /* Fetch */
    useEffect(() => {
        (async () => {
            try {
                const res = await axiosInstance.get('/orders');
                const data = res.data?.data;
                if (Array.isArray(data) && data.length > 0) {
                    setOrders(data.map((o: Order) => ({
                        ...o,
                        total_amount: typeof o.total_amount === 'number' ? o.total_amount : parseFloat(String(o.total_amount)) || 0,
                        items: o.items?.map((it: OrderItem) => ({
                            ...it,
                            price: typeof it.price === 'number' ? it.price : parseFloat(String(it.price)) || 0,
                        })) || [],
                    })));
                } else {
                    setOrders(generateMockOrders());
                }
            } catch {
                setOrders(generateMockOrders());
            } finally { setLoading(false); }
        })();
    }, []);

    /* Analytics */
    const analytics = useMemo(() => {
        const count = (s: string) => orders.filter(o => o.status === s).length;
        const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total_amount, 0);
        return {
            total:      orders.length,
            pending:    count('pending'),
            processing: count('processing'),
            packed:     count('packed'),
            shipped:    count('shipped'),
            delivered:  count('delivered'),
            cancelled:  count('cancelled'),
            revenue,
        };
    }, [orders]);

    /* Filter + Search + Sort */
    const processed = useMemo(() => {
        let out = [...orders];

        // Search
        const q = searchTerm.toLowerCase().trim();
        if (q) out = out.filter(o =>
            o.order_number.toLowerCase().includes(q) ||
            (o.user_name || '').toLowerCase().includes(q) ||
            (o.customer_email || '').toLowerCase().includes(q) ||
            (o.customer_phone || '').toLowerCase().includes(q) ||
            (o.items || []).some(i => i.product_name.toLowerCase().includes(q))
        );

        // Filters
        if (filters.status !== 'all') out = out.filter(o => o.status === filters.status);
        if (filters.paymentStatus !== 'all') out = out.filter(o => o.payment_status === filters.paymentStatus);
        if (filters.paymentMethod !== 'all') out = out.filter(o => o.payment_method === filters.paymentMethod);
        if (filters.customerType !== 'all') out = out.filter(o => o.customer_type === filters.customerType);
        if (filters.region !== 'all') out = out.filter(o => o.shipping_region === filters.region);
        if (filters.dateFrom) out = out.filter(o => new Date(o.created_at) >= new Date(filters.dateFrom));
        if (filters.dateTo)   out = out.filter(o => new Date(o.created_at) <= new Date(filters.dateTo + 'T23:59:59'));
        if (filters.revenueMin) out = out.filter(o => o.total_amount >= parseFloat(filters.revenueMin));
        if (filters.revenueMax) out = out.filter(o => o.total_amount <= parseFloat(filters.revenueMax));

        // Sort
        if (sort.field && sort.dir) {
            out.sort((a, b) => {
                let av: unknown, bv: unknown;
                if (sort.field === 'items') { av = a.items?.length || 0; bv = b.items?.length || 0; }
                else { av = a[sort.field as keyof Order]; bv = b[sort.field as keyof Order]; }
                if (typeof av === 'string' && typeof bv === 'string')
                    return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
                return sort.dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
            });
        }

        return out;
    }, [orders, searchTerm, filters, sort]);

    const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
    const pageOrders = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleSort = (field: SortField) => {
        setSort(prev =>
            prev.field === field
                ? prev.dir === 'asc' ? { field, dir: 'desc' }
                : prev.dir === 'desc' ? { field: null, dir: null }
                : { field, dir: 'asc' }
                : { field, dir: 'asc' }
        );
        setPage(1);
    };

    /* Selection */
    const allPageSelected = pageOrders.length > 0 && pageOrders.every(o => selected.has(o.id));
    const someSelected = selected.size > 0;

    const toggleAll = () => {
        if (allPageSelected) {
            const next = new Set(selected);
            pageOrders.forEach(o => next.delete(o.id));
            setSelected(next);
        } else {
            const next = new Set(selected);
            pageOrders.forEach(o => next.add(o.id));
            setSelected(next);
        }
    };

    const toggleOne = (id: number) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected(next);
    };

    /* Status update */
    const updateOrderStatus = async (orderId: number, status: string) => {
        setUpdatingId(orderId);
        try {
            await axiosInstance.put(`/orders/${orderId}/status`, { status });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as Order['status'] } : o));
        } catch { alert('Failed to update status'); }
        finally { setUpdatingId(null); }
    };

    /* Bulk actions */
    const applyBulk = async (status: string) => {
        if (!status || selected.size === 0) return;
        for (const id of selected) await updateOrderStatus(id, status);
        setSelected(new Set());
        setBulkStatus('');
    };

    /* Export */
    const exportCSV = () => {
        const rows = [
            ['Order #','Customer','Email','Items','Total','Payment','Method','Status','Date'],
            ...processed.map(o => [
                o.order_number, o.user_name || '', o.customer_email || '',
                String(o.items?.length || 0), o.total_amount.toFixed(2),
                o.payment_status || '', o.payment_method || '', o.status,
                new Date(o.created_at).toLocaleDateString(),
            ]),
        ];
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `orders_${Date.now()}.csv`;
        a.click();
    };

    /* Active filter chips */
    const activeFilters: { key: keyof Filters; label: string }[] = [];
    if (filters.status !== 'all')        activeFilters.push({ key: 'status',        label: `Status: ${filters.status}` });
    if (filters.paymentStatus !== 'all') activeFilters.push({ key: 'paymentStatus', label: `Payment: ${filters.paymentStatus}` });
    if (filters.customerType !== 'all')  activeFilters.push({ key: 'customerType',  label: `Customer: ${filters.customerType}` });
    if (filters.region !== 'all')        activeFilters.push({ key: 'region',        label: `Region: ${filters.region}` });
    if (filters.dateFrom)                activeFilters.push({ key: 'dateFrom',      label: `From: ${filters.dateFrom}` });
    if (filters.dateTo)                  activeFilters.push({ key: 'dateTo',        label: `To: ${filters.dateTo}` });
    if (filters.revenueMin)              activeFilters.push({ key: 'revenueMin',    label: `Min $${filters.revenueMin}` });
    if (filters.revenueMax)              activeFilters.push({ key: 'revenueMax',    label: `Max $${filters.revenueMax}` });

    const removeFilter = (key: keyof Filters) => {
        const defaults: Record<keyof Filters, string> = {
            status: 'all', paymentStatus: 'all', paymentMethod: 'all',
            customerType: 'all', region: 'all', dateFrom: '', dateTo: '',
            revenueMin: '', revenueMax: '',
        };
        setFilters(prev => ({ ...prev, [key]: defaults[key] }));
        setPage(1);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    /* ── Regions / methods for filter dropdowns ── */
    const allRegions  = [...new Set(orders.map(o => o.shipping_region).filter(Boolean))];
    const allMethods  = [...new Set(orders.map(o => o.payment_method).filter(Boolean))];

    /* ── Loading ── */
    if (loading) return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="spinner-border" style={{ color: '#4f46e5', width: 40, height: 40 }} />
                <p style={{ marginTop: 16, color: '#64748b', fontSize: '0.9rem' }}>Loading orders…</p>
            </div>
        </div>
    );

    return (
        <>
            <style>{css(darkMode)}</style>

            <div className={`ao-shell ${darkMode ? 'dark' : ''}`}>

                {/* ─────────── TOP BAR ─────────── */}
                <div className="ao-topbar">
                    <div>
                        <h1 className="ao-page-title">Order Management</h1>
                        <p className="ao-page-sub">{analytics.total} total orders · {processed.length} filtered</p>
                    </div>
                    <div className="ao-topbar-actions">
                        {/* Notifications */}
                        <div style={{ position: 'relative' }}>
                            <button className="ao-icon-btn" onClick={() => { setShowNotifPanel(!showNotifPanel); setShowAIPanel(false); }}>
                                <FaRegBell size={17}/>
                                {unreadCount > 0 && <span className="ao-notif-badge">{unreadCount}</span>}
                            </button>
                            {showNotifPanel && (
                                <div className="ao-panel ao-panel-right">
                                    <div className="ao-panel-header">
                                        <span>Notifications</span>
                                        <button className="ao-panel-close" onClick={() => setShowNotifPanel(false)}><FaTimes size={13}/></button>
                                    </div>
                                    <div>
                                        {notifications.map(n => <NotifItem key={n.id} notif={n}/>)}
                                    </div>
                                    <button className="ao-panel-mark-all" onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}>
                                        Mark all as read
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* AI */}
                        <button className="ao-icon-btn" onClick={() => { setShowAIPanel(!showAIPanel); setShowNotifPanel(false); }}>
                            <FaRobot size={17}/> AI Insights
                        </button>

                        {/* Dark mode */}
                        <button className="ao-icon-btn" onClick={() => setDarkMode(d => !d)} title="Toggle dark mode">
                            {darkMode ? '☀️' : '🌙'}
                        </button>

                        {/* Export dropdown */}
                        <div className="dropdown">
                            <button className="ao-primary-btn dropdown-toggle" data-bs-toggle="dropdown">
                                <FaFileExport size={13}/> Export
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li><button className="dropdown-item" onClick={exportCSV}><FaFileCsv className="me-2 text-success"/>CSV</button></li>
                                <li><button className="dropdown-item" onClick={() => alert('Excel export – integrate SheetJS')}><FaFileExcel className="me-2 text-success"/>Excel</button></li>
                                <li><button className="dropdown-item" onClick={() => alert('PDF export – integrate jsPDF')}><FaFilePdf className="me-2 text-danger"/>PDF</button></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ─────────── AI PANEL ─────────── */}
                {showAIPanel && (
                    <div className="ao-ai-banner">
                        <div className="ao-ai-banner-header">
                            <span><FaRobot size={14} style={{ marginRight: 6 }}/> AI Insights</span>
                            <button className="ao-panel-close" onClick={() => setShowAIPanel(false)}><FaTimes size={13}/></button>
                        </div>
                        <div className="ao-ai-grid">
                            <AICard title="Expected orders next week"  value="~124"    sub="Based on 30-day trend"          icon={<FaChartLine/>}          color="#4f46e5"/>
                            <AICard title="Predicted revenue"          value="$18,400" sub="↑12% vs this week"              icon={<FaDollarSign/>}          color="#0369a1"/>
                            <AICard title="High-risk cancellations"    value="7 orders" sub="Manual review recommended"    icon={<FaExclamationTriangle/>} color="#b91c1c"/>
                            <AICard title="Delayed shipping alerts"    value="3 orders" sub="Expected SLA breach in 24h"   icon={<FaShippingFast/>}        color="#b45309"/>
                            <AICard title="Most valuable customers"    value="Alice J." sub="$2,340 total lifetime value"  icon={<FaUsers/>}               color="#15803d"/>
                        </div>
                    </div>
                )}

                {/* ─────────── ANALYTICS CARDS ─────────── */}
                <div className="row g-3 mb-4">
                    <AnalyticsCard label="Total Orders"      value={analytics.total}     growth={12}  icon={<FaBoxOpen size={18}/>}       accentColor="#4f46e5" delay={0}/>
                    <AnalyticsCard label="Pending"           value={analytics.pending}   growth={-4}  icon={<FaClock size={18}/>}         accentColor="#b45309" delay={50}/>
                    <AnalyticsCard label="Processing"        value={analytics.processing} growth={8}  icon={<FaSpinner size={18}/>}       accentColor="#1d4ed8" delay={100}/>
                    <AnalyticsCard label="Packed"            value={analytics.packed}    growth={5}   icon={<FaBoxOpen size={18}/>}       accentColor="#7c3aed" delay={150}/>
                    <AnalyticsCard label="Shipped"           value={analytics.shipped}   growth={18}  icon={<FaShippingFast size={18}/>}  accentColor="#0369a1" delay={200}/>
                    <AnalyticsCard label="Delivered"         value={analytics.delivered} growth={22}  icon={<FaCheckCircle size={18}/>}   accentColor="#15803d" delay={250}/>
                    <AnalyticsCard label="Cancelled"         value={analytics.cancelled} growth={-11} icon={<FaBan size={18}/>}           accentColor="#b91c1c" delay={300}/>
                    <AnalyticsCard label="Revenue"           value={`$${analytics.revenue.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`} growth={16} icon={<FaDollarSign size={18}/>} accentColor="#0f766e" delay={350}/>
                </div>

                {/* ─────────── TOOLBAR ─────────── */}
                <div className="ao-toolbar">
                    {/* Search */}
                    <div className="ao-search-wrap">
                        <FaSearch className="ao-search-icon"/>
                        <input
                            className="ao-search-input"
                            placeholder="Search by order #, customer, email, phone, product…"
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                        {searchTerm && <button className="ao-search-clear" onClick={() => setSearchTerm('')}><FaTimes size={11}/></button>}
                    </div>

                    <div className="ao-toolbar-right">
                        {/* Bulk action */}
                        {someSelected && (
                            <div className="ao-bulk-bar">
                                <span className="ao-bulk-count">{selected.size} selected</span>
                                <select className="ao-bulk-select" value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
                                    <option value="">Change status…</option>
                                    <option value="processing">Processing</option>
                                    <option value="packed">Packed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <button className="ao-bulk-apply" onClick={() => applyBulk(bulkStatus)} disabled={!bulkStatus}>Apply</button>
                                <button className="ao-bulk-clear" onClick={() => setSelected(new Set())}><FaTimes size={11}/></button>
                            </div>
                        )}

                        <button className={`ao-filter-btn ${showFilterPanel ? 'active' : ''}`} onClick={() => setShowFilterPanel(!showFilterPanel)}>
                            <FaSlidersH size={13}/> Filters {activeFilters.length > 0 && <span className="ao-filter-count">{activeFilters.length}</span>}
                        </button>
                    </div>
                </div>

                {/* ─────────── ACTIVE FILTER CHIPS ─────────── */}
                {activeFilters.length > 0 && (
                    <div className="ao-chips">
                        {activeFilters.map(f => (
                            <span key={f.key} className="ao-chip">
                                {f.label}
                                <button onClick={() => removeFilter(f.key)}><FaTimes size={9}/></button>
                            </span>
                        ))}
                        <button className="ao-chip-clear" onClick={() => { setFilters({ status:'all', paymentStatus:'all', paymentMethod:'all', customerType:'all', region:'all', dateFrom:'', dateTo:'', revenueMin:'', revenueMax:'' }); setPage(1); }}>
                            Clear all
                        </button>
                    </div>
                )}

                <div className="ao-layout">
                    {/* ─────────── FILTER SIDEBAR ─────────── */}
                    {showFilterPanel && (
                        <aside className="ao-filter-sidebar">
                            <div className="ao-fs-header">
                                <span><FaFilter size={13} style={{ marginRight: 6 }}/> Advanced Filters</span>
                                <button onClick={() => setShowFilterPanel(false)}><FaTimes size={13}/></button>
                            </div>

                            <div className="ao-fs-section">
                                <label className="ao-fs-label">Order Status</label>
                                <select className="ao-fs-select" value={filters.status} onChange={e => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}>
                                    <option value="all">All Statuses</option>
                                    {ALL_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                                </select>
                            </div>

                            <div className="ao-fs-section">
                                <label className="ao-fs-label">Payment Status</label>
                                <select className="ao-fs-select" value={filters.paymentStatus} onChange={e => { setFilters(p => ({ ...p, paymentStatus: e.target.value })); setPage(1); }}>
                                    <option value="all">All</option>
                                    <option value="paid">Paid</option>
                                    <option value="unpaid">Unpaid</option>
                                    <option value="refunded">Refunded</option>
                                    <option value="partial">Partial</option>
                                </select>
                            </div>

                            <div className="ao-fs-section">
                                <label className="ao-fs-label">Payment Method</label>
                                <select className="ao-fs-select" value={filters.paymentMethod} onChange={e => { setFilters(p => ({ ...p, paymentMethod: e.target.value })); setPage(1); }}>
                                    <option value="all">All Methods</option>
                                    {allMethods.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>

                            <div className="ao-fs-section">
                                <label className="ao-fs-label">Customer Type</label>
                                <select className="ao-fs-select" value={filters.customerType} onChange={e => { setFilters(p => ({ ...p, customerType: e.target.value })); setPage(1); }}>
                                    <option value="all">All Types</option>
                                    <option value="new">New</option>
                                    <option value="returning">Returning</option>
                                    <option value="vip">VIP</option>
                                </select>
                            </div>

                            <div className="ao-fs-section">
                                <label className="ao-fs-label">Shipping Region</label>
                                <select className="ao-fs-select" value={filters.region} onChange={e => { setFilters(p => ({ ...p, region: e.target.value })); setPage(1); }}>
                                    <option value="all">All Regions</option>
                                    {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="ao-fs-section">
                                <label className="ao-fs-label">Date Range</label>
                                <input type="date" className="ao-fs-select" value={filters.dateFrom} onChange={e => { setFilters(p => ({ ...p, dateFrom: e.target.value })); setPage(1); }}/>
                                <input type="date" className="ao-fs-select mt-2" value={filters.dateTo} onChange={e => { setFilters(p => ({ ...p, dateTo: e.target.value })); setPage(1); }}/>
                            </div>

                            <div className="ao-fs-section">
                                <label className="ao-fs-label">Revenue Range ($)</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <input type="number" className="ao-fs-select" placeholder="Min" value={filters.revenueMin} onChange={e => { setFilters(p => ({ ...p, revenueMin: e.target.value })); setPage(1); }}/>
                                    <input type="number" className="ao-fs-select" placeholder="Max" value={filters.revenueMax} onChange={e => { setFilters(p => ({ ...p, revenueMax: e.target.value })); setPage(1); }}/>
                                </div>
                            </div>

                            <button className="ao-fs-reset" onClick={() => { setFilters({ status:'all', paymentStatus:'all', paymentMethod:'all', customerType:'all', region:'all', dateFrom:'', dateTo:'', revenueMin:'', revenueMax:'' }); setPage(1); }}>
                                Reset All Filters
                            </button>
                        </aside>
                    )}

                    {/* ─────────── TABLE ─────────── */}
                    <div className="ao-table-wrap">
                        <div className="ao-table-scroll">
                            <table className="ao-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: 44 }}>
                                            <button className="ao-cb" onClick={toggleAll} aria-label="Select all">
                                                {allPageSelected ? <FaCheckSquare size={15} style={{ color: '#4f46e5' }}/> :
                                                 selected.size > 0 && pageOrders.some(o => selected.has(o.id)) ? <FaMinusSquare size={15} style={{ color: '#94a3b8' }}/> :
                                                 <FaSquare size={15} style={{ color: '#cbd5e1' }}/>}
                                            </button>
                                        </th>
                                        <SortTh label="Order #"   field="order_number" sort={sort} onSort={handleSort}/>
                                        <SortTh label="Customer"  field="user_name"     sort={sort} onSort={handleSort}/>
                                        <th>Email</th>
                                        <SortTh label="Items"     field="items"         sort={sort} onSort={handleSort}/>
                                        <SortTh label="Total"     field="total_amount"  sort={sort} onSort={handleSort}/>
                                        <th>Payment</th>
                                        <th>Method</th>
                                        <SortTh label="Status"    field="status"        sort={sort} onSort={handleSort}/>
                                        <SortTh label="Date"      field="created_at"    sort={sort} onSort={handleSort}/>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pageOrders.length === 0 ? (
                                        <tr><td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No orders match your filters.</td></tr>
                                    ) : pageOrders.map(order => (
                                        <tr key={order.id} className={selected.has(order.id) ? 'ao-row-selected' : ''}>
                                            <td>
                                                <button className="ao-cb" onClick={() => toggleOne(order.id)}>
                                                    {selected.has(order.id)
                                                        ? <FaCheckSquare size={15} style={{ color: '#4f46e5' }}/>
                                                        : <FaSquare size={15} style={{ color: '#cbd5e1' }}/>}
                                                </button>
                                            </td>
                                            <td><span className="ao-order-num">#{order.order_number}</span></td>
                                            <td>
                                                <div className="ao-customer">
                                                    <div className="ao-avatar">{(order.user_name || 'G')[0].toUpperCase()}</div>
                                                    <div>
                                                        <div className="ao-customer-name">{order.user_name || 'Guest'}</div>
                                                        {order.customer_type === 'vip' && <span className="ao-vip-badge">VIP</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="ao-email">{order.customer_email || '—'}</span></td>
                                            <td><span className="ao-item-count">{order.items?.length || 0} items</span></td>
                                            <td><span className="ao-amount">${order.total_amount.toFixed(2)}</span></td>
                                            <td><PaymentBadge status={order.payment_status}/></td>
                                            <td><span className="ao-method">{order.payment_method || '—'}</span></td>
                                            <td><StatusBadge status={order.status}/></td>
                                            <td><span className="ao-date">{new Date(order.created_at).toLocaleDateString('en-US',{ month:'short', day:'numeric', year:'numeric' })}</span></td>
                                            <td>
                                                <div className="ao-actions">
                                                    <Link href={`/admin/orders/${order.id}`} className="ao-action-view" title="View order">
                                                        <FaEye size={13}/>
                                                    </Link>
                                                    <div className="dropdown">
                                                        <button
                                                            className="ao-action-status dropdown-toggle"
                                                            data-bs-toggle="dropdown"
                                                            disabled={updatingId === order.id}
                                                            title="Update status"
                                                        >
                                                            {updatingId === order.id
                                                                ? <span className="spinner-border spinner-border-sm"/>
                                                                : 'Status'}
                                                        </button>
                                                        <ul className="dropdown-menu dropdown-menu-end" style={{ minWidth: 160, fontSize: '0.83rem' }}>
                                                            {ALL_STATUSES.map(s => (
                                                                <li key={s}>
                                                                    <button
                                                                        className={`dropdown-item ${order.status === s ? 'active' : ''} ${s === 'cancelled' ? 'text-danger' : ''}`}
                                                                        onClick={() => updateOrderStatus(order.id, s)}
                                                                    >
                                                                        <span style={{ marginRight: 6 }}>{STATUS_CONFIG[s].icon}</span>
                                                                        {STATUS_CONFIG[s].label}
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ─────────── PAGINATION ─────────── */}
                        <div className="ao-pagination">
                            <span className="ao-page-info">
                                Showing {Math.min((page - 1) * PAGE_SIZE + 1, processed.length)}–{Math.min(page * PAGE_SIZE, processed.length)} of {processed.length}
                            </span>
                            <div className="ao-page-controls">
                                <button className="ao-page-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                                <button className="ao-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><FaChevronLeft size={11}/></button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                                    if (p < 1 || p > totalPages) return null;
                                    return <button key={p} className={`ao-page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>;
                                })}
                                <button className="ao-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><FaChevronRight size={11}/></button>
                                <button className="ao-page-btn" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ══════════════════════════════════════════
   CSS
══════════════════════════════════════════ */
const css = (dark: boolean) => `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap');

  /* ── Variables ── */
  .ao-shell {
    --bg:       ${dark ? '#0f172a' : '#f8fafc'};
    --surface:  ${dark ? '#1e293b' : '#ffffff'};
    --border:   ${dark ? '#334155' : '#e2e8f0'};
    --text-1:   ${dark ? '#f1f5f9' : '#0f172a'};
    --text-2:   ${dark ? '#94a3b8' : '#64748b'};
    --text-3:   ${dark ? '#64748b' : '#94a3b8'};
    --accent:   #4f46e5;
    --accent-2: #0369a1;
    font-family: 'Geist', 'SF Pro Display', system-ui, sans-serif;
    background: var(--bg);
    min-height: 100vh;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    padding: 0 0 48px;
    transition: background 0.25s;
  }
  .ao-shell * { box-sizing: border-box; }

  /* ── Top bar ── */
  .ao-topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 28px;
  }
  .ao-page-title {
    font-size: clamp(1.4rem, 3vw, 1.9rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    color: var(--text-1);
    margin: 0 0 2px;
  }
  .ao-page-sub { font-size: 0.82rem; color: var(--text-2); margin: 0; }
  .ao-topbar-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

  .ao-icon-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--surface); border: 1px solid var(--border);
    color: var(--text-1); border-radius: 10px; padding: 7px 13px;
    font-size: 0.82rem; font-weight: 600; cursor: pointer;
    position: relative; transition: box-shadow 0.15s, border-color 0.15s;
  }
  .ao-icon-btn:hover { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,70,229,.1); }

  .ao-primary-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--accent); border: none;
    color: #fff; border-radius: 10px; padding: 8px 16px;
    font-size: 0.82rem; font-weight: 700; cursor: pointer;
    transition: opacity 0.15s, transform 0.12s;
  }
  .ao-primary-btn:hover { opacity: 0.88; transform: translateY(-1px); }

  /* Notification badge */
  .ao-notif-badge {
    position: absolute; top: -5px; right: -5px;
    background: #ef4444; color: #fff; border-radius: 100%;
    font-size: 0.65rem; font-weight: 800; width: 16px; height: 16px;
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Panels ── */
  .ao-panel {
    position: absolute; top: calc(100% + 8px); z-index: 1000;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; width: 320px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.12);
    overflow: hidden;
  }
  .ao-panel-right { right: 0; }
  .ao-panel-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 16px; border-bottom: 1px solid var(--border);
    font-size: 0.88rem; font-weight: 700; color: var(--text-1);
  }
  .ao-panel-close {
    background: none; border: none; color: var(--text-2); cursor: pointer;
    padding: 4px; border-radius: 6px; transition: background 0.15s;
  }
  .ao-panel-close:hover { background: var(--bg); }
  .ao-panel-mark-all {
    display: block; width: 100%; padding: 10px 16px;
    background: none; border: none; border-top: 1px solid var(--border);
    font-size: 0.78rem; color: var(--accent); font-weight: 600; cursor: pointer;
    text-align: left;
  }
  .ao-panel-mark-all:hover { background: var(--bg); }

  /* ── Notifications ── */
  .notif-item {
    display: flex; gap: 10px; align-items: flex-start;
    padding: 12px 16px; transition: background 0.1s;
  }
  .notif-item:hover { background: var(--bg); }
  .notif-unread { background: rgba(79,70,229,0.04); }
  .notif-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .notif-msg { font-size: 0.82rem; color: var(--text-1); font-weight: 500; margin-bottom: 2px; }
  .notif-time { font-size: 0.72rem; color: var(--text-3); }

  /* ── AI banner ── */
  .ao-ai-banner {
    background: linear-gradient(135deg, #1e1b4b 0%, #1e3a5f 100%);
    border-radius: 16px; padding: 20px 24px; margin-bottom: 24px;
    box-shadow: 0 4px 30px rgba(79,70,229,0.2);
  }
  .ao-ai-banner-header {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 0.85rem; font-weight: 700; color: #c7d2fe;
    margin-bottom: 16px; letter-spacing: 0.05em; text-transform: uppercase;
  }
  .ao-ai-banner-header .ao-panel-close { color: #94a3b8; }
  .ao-ai-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
  .ai-card {
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;
  }
  .ai-card-icon {
    width: 34px; height: 34px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px;
  }
  .ai-card-title { font-size: 0.72rem; color: #94a3b8; font-weight: 600; letter-spacing: 0.03em; margin-bottom: 3px; }
  .ai-card-value { font-size: 1.05rem; font-weight: 800; color: #f1f5f9; letter-spacing: -0.02em; margin-bottom: 2px; }
  .ai-card-sub   { font-size: 0.7rem; color: #64748b; }

  /* ── Analytics cards ── */
  .acard {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; padding: 18px 20px;
    display: flex; align-items: center; gap: 14px;
    transition: box-shadow 0.2s, transform 0.2s;
    animation: fadeSlideUp 0.4s both;
  }
  .acard:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.09); transform: translateY(-2px); }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .acard-icon {
    width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .acard-label { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--text-2); margin-bottom: 3px; }
  .acard-value { font-size: 1.35rem; font-weight: 800; letter-spacing: -0.04em; color: var(--text-1); margin-bottom: 4px; }
  .acard-growth { display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; font-weight: 600; }
  .acard-growth.up   { color: #16a34a; }
  .acard-growth.down { color: #dc2626; }

  /* ── Toolbar ── */
  .ao-toolbar {
    display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .ao-search-wrap {
    flex: 1; min-width: 220px; position: relative;
    display: flex; align-items: center;
  }
  .ao-search-icon { position: absolute; left: 13px; color: var(--text-3); font-size: 13px; pointer-events: none; }
  .ao-search-input {
    width: 100%; height: 40px; padding: 0 36px 0 38px;
    border: 1px solid var(--border); border-radius: 10px;
    background: var(--surface); color: var(--text-1); font-size: 0.85rem;
    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
    font-family: inherit;
  }
  .ao-search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
  .ao-search-clear {
    position: absolute; right: 10px; background: none; border: none;
    color: var(--text-3); cursor: pointer; padding: 4px;
  }

  .ao-toolbar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

  .ao-filter-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 8px 14px; font-size: 0.82rem; font-weight: 600;
    color: var(--text-1); cursor: pointer; transition: all 0.15s;
  }
  .ao-filter-btn.active { border-color: var(--accent); background: rgba(79,70,229,0.06); color: var(--accent); }
  .ao-filter-btn:hover  { border-color: var(--accent); }
  .ao-filter-count {
    background: var(--accent); color: #fff; border-radius: 100%;
    width: 18px; height: 18px; font-size: 0.65rem; font-weight: 800;
    display: inline-flex; align-items: center; justify-content: center;
  }

  /* Bulk bar */
  .ao-bulk-bar {
    display: flex; align-items: center; gap: 6px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 4px 12px 4px 10px;
  }
  .ao-bulk-count { font-size: 0.8rem; font-weight: 700; color: var(--accent); white-space: nowrap; }
  .ao-bulk-select {
    border: none; background: transparent; font-size: 0.8rem; color: var(--text-1);
    font-family: inherit; outline: none; cursor: pointer;
  }
  .ao-bulk-apply {
    background: var(--accent); color: #fff; border: none; border-radius: 7px;
    padding: 5px 12px; font-size: 0.78rem; font-weight: 700; cursor: pointer;
  }
  .ao-bulk-apply:disabled { opacity: 0.4; cursor: not-allowed; }
  .ao-bulk-clear { background: none; border: none; color: var(--text-3); cursor: pointer; padding: 4px; }

  /* ── Filter chips ── */
  .ao-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .ao-chip {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(79,70,229,0.08); color: var(--accent);
    border: 1px solid rgba(79,70,229,0.2); border-radius: 100px;
    font-size: 0.75rem; font-weight: 600; padding: 3px 10px 3px 12px;
  }
  .ao-chip button { background: none; border: none; color: var(--accent); cursor: pointer; padding: 1px; line-height: 1; }
  .ao-chip-clear {
    background: none; border: 1px solid var(--border); border-radius: 100px;
    font-size: 0.75rem; color: var(--text-2); padding: 3px 12px; cursor: pointer;
    transition: border-color 0.15s; font-family: inherit;
  }
  .ao-chip-clear:hover { border-color: #ef4444; color: #ef4444; }

  /* ── Layout ── */
  .ao-layout { display: flex; gap: 20px; align-items: flex-start; min-width: 0; }

  /* ── Filter sidebar ── */
  .ao-filter-sidebar {
    width: 240px; flex-shrink: 0;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden;
    box-shadow: 0 2px 16px rgba(0,0,0,0.06);
  }
  .ao-fs-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 16px; border-bottom: 1px solid var(--border);
    font-size: 0.83rem; font-weight: 700; color: var(--text-1);
  }
  .ao-fs-header button { background: none; border: none; color: var(--text-2); cursor: pointer; }
  .ao-fs-section { padding: 12px 14px; border-bottom: 1px solid var(--border); }
  .ao-fs-label { display: block; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-3); margin-bottom: 6px; }
  .ao-fs-select {
    width: 100%; padding: 7px 10px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--bg); color: var(--text-1); font-size: 0.82rem; font-family: inherit;
    outline: none; transition: border-color 0.15s;
  }
  .ao-fs-select:focus { border-color: var(--accent); }
  .mt-2 { margin-top: 6px; }
  .ao-fs-reset {
    display: block; width: 100%; padding: 12px; background: none; border: none;
    font-size: 0.8rem; color: #ef4444; font-weight: 600; cursor: pointer;
    text-align: center; font-family: inherit; transition: background 0.15s;
  }
  .ao-fs-reset:hover { background: #fef2f2; }

  /* ── Table ── */
  .ao-table-wrap { flex: 1; min-width: 0; width: 100%; max-width: 100%; }
  .ao-table-scroll {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 14px; overflow-x: auto; overflow-y: hidden;
    box-shadow: 0 2px 16px rgba(0,0,0,0.055);
    max-width: 100%;
    -webkit-overflow-scrolling: touch;
  }
  .ao-table {
    width: 100%; min-width: 1120px; border-collapse: collapse; font-size: 0.83rem;
  }
  .ao-table thead tr {
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    position: sticky; top: 0; z-index: 10;
  }
  .ao-table thead th {
    padding: 12px 14px; font-size: 0.72rem; font-weight: 700;
    letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--text-2); white-space: nowrap;
  }
  .ao-table tbody tr { border-bottom: 1px solid var(--border); transition: background 0.1s; }
  .ao-table tbody tr:last-child { border-bottom: none; }
  .ao-table tbody tr:hover { background: rgba(79,70,229,0.03); }
  .ao-row-selected { background: rgba(79,70,229,0.05) !important; }
  .ao-table td { padding: 13px 14px; vertical-align: middle; color: var(--text-1); }

  /* CB button */
  .ao-cb { background: none; border: none; cursor: pointer; padding: 2px; display: flex; align-items: center; }

  /* Cell variants */
  .ao-order-num { font-weight: 700; letter-spacing: -0.01em; color: var(--accent); font-size: 0.82rem; }
  .ao-customer  { display: flex; align-items: center; gap: 9px; }
  .ao-avatar    { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 800; flex-shrink: 0; }
  .ao-customer-name { font-weight: 600; font-size: 0.83rem; color: var(--text-1); }
  .ao-vip-badge { display: inline-block; background: #fef3c7; color: #b45309; font-size: 0.62rem; font-weight: 800; letter-spacing: 0.05em; padding: 1px 6px; border-radius: 100px; margin-top: 2px; }
  .ao-email   { color: var(--text-2); font-size: 0.78rem; }
  .ao-item-count { color: var(--text-2); font-size: 0.8rem; }
  .ao-amount  { font-weight: 800; letter-spacing: -0.02em; color: var(--text-1); }
  .ao-method  { color: var(--text-2); font-size: 0.78rem; }
  .ao-date    { color: var(--text-2); font-size: 0.78rem; white-space: nowrap; }

  /* Actions */
  .ao-actions { display: flex; gap: 6px; justify-content: flex-end; align-items: center; }
  .ao-action-view {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 8px;
    background: var(--bg); border: 1px solid var(--border);
    color: var(--text-2); transition: all 0.15s;
  }
  .ao-action-view:hover { border-color: var(--accent); color: var(--accent); background: rgba(79,70,229,0.06); }
  .ao-action-status {
    height: 30px; padding: 0 10px; border-radius: 8px;
    background: var(--accent); color: #fff; border: none;
    font-size: 0.75rem; font-weight: 700; cursor: pointer;
    transition: opacity 0.15s; white-space: nowrap;
    display: flex; align-items: center; gap: 5px;
  }
  .ao-action-status:hover:not(:disabled) { opacity: 0.85; }
  .ao-action-status:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Pagination ── */
  .ao-pagination {
    display: flex; justify-content: space-between; align-items: center;
    padding: 14px 18px; border-top: 1px solid var(--border);
    background: var(--surface); border-radius: 0 0 14px 14px; flex-wrap: wrap; gap: 10px;
  }
  .ao-page-info { font-size: 0.78rem; color: var(--text-2); }
  .ao-page-controls { display: flex; gap: 4px; }
  .ao-page-btn {
    width: 32px; height: 32px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--text-1); font-size: 0.8rem; font-weight: 600;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.12s;
  }
  .ao-page-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .ao-page-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
  .ao-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* ── Dark mode overrides for Bootstrap dropdowns ── */
  .dark .dropdown-menu {
    background: #1e293b; border-color: #334155;
  }
  .dark .dropdown-item { color: #f1f5f9; }
  .dark .dropdown-item:hover { background: #334155; }
  .dark .dropdown-item.active { background: #4f46e5; }

  /* ── Mobile ── */
  @media (max-width: 992px) {
    .ao-filter-sidebar { width: 100%; }
    .ao-layout { flex-direction: column; width: 100%; }
  }
  @media (max-width: 640px) {
    .ao-shell { padding: 0 0 32px; }
    .ao-topbar { flex-direction: column; }
    .ao-ai-grid { grid-template-columns: 1fr 1fr; }
    .ao-toolbar { width: 100%; }
    .ao-search-wrap { flex-basis: 100%; min-width: 0; }
    .ao-toolbar-right { width: 100%; }
    .ao-filter-btn { width: 100%; justify-content: center; }
    .ao-table-scroll { border-radius: 12px; }
  }
  @media (max-width: 420px) {
    .ao-ai-grid { grid-template-columns: 1fr; }
  }
`;
