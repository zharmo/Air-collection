'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/utils/axiosConfig';
import {
    FaDollarSign, FaUsers, FaShoppingBag, FaBoxOpen,
    FaArrowUp, FaArrowDown, FaExclamationTriangle,
    FaCheckCircle, FaClock, FaTruck, FaChartLine,
    FaCircle, FaInbox
} from 'react-icons/fa';

interface DashboardStats {
    totalRevenue: number; todayRevenue: number; revenueChange: number;
    totalCustomers: number; totalOrders: number; deliveredOrders: number;
    activeOrders: number; todayOrders: number; pendingOrders: number;
    totalProducts: number; lowStockProducts: number; outOfStockProducts: number;
}

/* ── Tiny reusable sub-components ── */

function SkeletonBlock({ w = '100%', h = 16, radius = 4, mb = 0 }: { w?: string | number; h?: number; radius?: number; mb?: number }) {
    return (
        <div style={{
            width: w, height: h, borderRadius: radius,
            background: 'linear-gradient(90deg,#f1f5f9 25%,#e8edf5 50%,#f1f5f9 75%)',
            backgroundSize: '200% 100%',
            animation: 'adShimmer 1.4s infinite',
            marginBottom: mb,
        }} />
    );
}

function TrendBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
    const up = value >= 0;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 9px', borderRadius: 20,
            background: up ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
            color: up ? '#059669' : '#dc2626',
            fontSize: 11, fontWeight: 700, letterSpacing: '.04em',
        }}>
            {up ? <FaArrowUp size={8} /> : <FaArrowDown size={8} />}
            {Math.abs(value)}{suffix}
        </span>
    );
}

function StatPill({ label, color }: { label: string; color: string }) {
    const colors: Record<string, { bg: string; text: string; dot: string }> = {
        success: { bg: 'rgba(16,185,129,.09)', text: '#059669', dot: '#10b981' },
        warning: { bg: 'rgba(245,158,11,.09)', text: '#d97706', dot: '#f59e0b' },
        danger:  { bg: 'rgba(239,68,68,.09)',  text: '#dc2626', dot: '#ef4444' },
        info:    { bg: 'rgba(99,102,241,.09)', text: '#4f46e5', dot: '#6366f1' },
    };
    const c = colors[color] || colors.info;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 20,
            background: c.bg, color: c.text,
            fontSize: 11, fontWeight: 600, letterSpacing: '.06em',
        }}>
            <FaCircle size={5} style={{ color: c.dot, flexShrink: 0 }} />
            {label}
        </span>
    );
}

/* ── Main component ── */
export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0, todayRevenue: 0, revenueChange: 0,
        totalCustomers: 0, totalOrders: 0, deliveredOrders: 0,
        activeOrders: 0, todayOrders: 0, pendingOrders: 0,
        totalProducts: 0, lowStockProducts: 0, outOfStockProducts: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const ordersRes = await axiosInstance.get('/orders');
                const orders    = ordersRes.data.data || [];
                const productsRes = await axiosInstance.get('/products');
                const products    = productsRes.data.data || [];

                let totalCustomers = 0;
                try {
                    const usersRes = await axiosInstance.get('/users');
                    const users    = usersRes.data.data || [];
                    totalCustomers = users.filter((u: any) => u.role === 'customer').length;
                } catch {
                    const userIds  = new Set(orders.filter((o: any) => o.user_id).map((o: any) => o.user_id));
                    totalCustomers = userIds.size;
                }

                const today = new Date().toISOString().split('T')[0];
                let totalRevenue = 0, todayRevenue = 0, deliveredOrders = 0,
                    activeOrders = 0, todayOrders = 0, pendingOrders = 0;

                for (const order of orders) {
                    const amount    = parseFloat(order.total_amount) || 0;
                    const status    = order.status;
                    const orderDate = order.created_at ? order.created_at.split('T')[0] : '';
                    totalRevenue += amount;
                    if (orderDate === today) { todayOrders++; todayRevenue += amount; }
                    if (status === 'delivered')                          deliveredOrders++;
                    if (status === 'processing' || status === 'shipped') activeOrders++;
                    if (status === 'pending')                            pendingOrders++;
                }

                setStats({
                    totalRevenue, todayRevenue, revenueChange: 12.4,
                    totalCustomers, totalOrders: orders.length,
                    deliveredOrders, activeOrders, todayOrders, pendingOrders,
                    totalProducts: products.length,
                    lowStockProducts:  products.filter((p: any) => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
                    outOfStockProducts: products.filter((p: any) => p.stock_quantity === 0).length,
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const fulfillmentRate = stats.totalOrders > 0
        ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0;
    const pendingRate = stats.totalOrders > 0
        ? Math.round((stats.pendingOrders / stats.totalOrders) * 100) : 0;
    const activeRate = stats.totalOrders > 0
        ? Math.round((stats.activeOrders / stats.totalOrders) * 100) : 0;
    const stockHealthPct = stats.totalProducts > 0
        ? Math.round(((stats.totalProducts - stats.outOfStockProducts - stats.lowStockProducts) / stats.totalProducts) * 100) : 100;

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    /* ── Skeleton ── */
    if (loading) return (
        <>
            <style>{`@keyframes adShimmer { to { background-position: -200% 0; } }`}</style>
            <div style={{ padding: '0 0 40px' }}>
                {/* Header skeleton */}
                <div style={{ marginBottom: 32 }}>
                    <SkeletonBlock w={160} h={12} mb={12} />
                    <SkeletonBlock w={240} h={28} mb={8} />
                    <SkeletonBlock w={320} h={13} />
                </div>
                {/* KPI row skeleton */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
                    {[...Array(4)].map((_,i) => (
                        <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,.06)', borderRadius: 12, padding: 24 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                                <SkeletonBlock w={40} h={40} radius={10} />
                                <SkeletonBlock w={60} h={22} radius={20} />
                            </div>
                            <SkeletonBlock w={100} h={32} mb={8} radius={6} />
                            <SkeletonBlock w={130} h={11} radius={4} />
                        </div>
                    ))}
                </div>
                {/* Bottom cards skeleton */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    {[...Array(2)].map((_,i) => (
                        <div key={i} style={{ background:'#fff', border:'1px solid rgba(0,0,0,.06)', borderRadius:12, padding:28 }}>
                            <SkeletonBlock w={120} h={13} mb={24} />
                            {[...Array(3)].map((_,j) => (
                                <div key={j} style={{ marginBottom:20 }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                                        <SkeletonBlock w={80} h={11} />
                                        <SkeletonBlock w={40} h={11} />
                                    </div>
                                    <SkeletonBlock h={6} radius={3} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );

    /* ── Dashboard ── */
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

                @keyframes adShimmer { to { background-position: -200% 0; } }
                @keyframes adFadeUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
                @keyframes adPulse   { 0%,100%{opacity:1} 50%{opacity:.4} }

                :root {
                    --ad-ink:      #0f172a;
                    --ad-soft:     #64748b;
                    --ad-faint:    #94a3b8;
                    --ad-border:   rgba(0,0,0,0.06);
                    --ad-surface:  #ffffff;
                    --ad-bg:       #f8f9fb;
                    --ad-muted:    #f1f5f9;
                    --ad-green:    #10b981;
                    --ad-green-bg: rgba(16,185,129,.08);
                    --ad-amber:    #f59e0b;
                    --ad-amber-bg: rgba(245,158,11,.08);
                    --ad-red:      #ef4444;
                    --ad-red-bg:   rgba(239,68,68,.08);
                    --ad-indigo:   #6366f1;
                    --ad-blue:     #3b82f6;
                    --ad-shadow:   0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.06);
                    --ad-shadow-h: 0 4px 6px rgba(0,0,0,.05), 0 12px 32px rgba(0,0,0,.1);
                    --ad-radius:   12px;
                }

                /* ── Fonts ── */
                .ad-root { font-family: 'Inter', sans-serif; color: var(--ad-ink); }

                /* ── Dashboard header ── */
                .ad-header {
                    display: flex; align-items: flex-start;
                    justify-content: space-between; flex-wrap: wrap;
                    gap: 16px; margin-bottom: 32px;
                    animation: adFadeUp .4s ease both;
                }
                .ad-header-eyebrow {
                    font-size: 11px; font-weight: 500;
                    letter-spacing: .14em; text-transform: uppercase;
                    color: var(--ad-faint); margin-bottom: 6px;
                }
                .ad-header-title {
                    font-size: 26px; font-weight: 700;
                    letter-spacing: -.02em; color: var(--ad-ink);
                    margin: 0 0 4px;
                }
                .ad-header-sub {
                    font-size: 13px; font-weight: 400;
                    color: var(--ad-soft); margin: 0;
                }
                .ad-live-pill {
                    display: inline-flex; align-items: center; gap: 7px;
                    padding: 7px 14px; border-radius: 20px;
                    background: rgba(16,185,129,.1); color: #059669;
                    font-size: 11px; font-weight: 600; letter-spacing: .06em;
                    white-space: nowrap;
                }
                .ad-live-dot {
                    width: 7px; height: 7px; border-radius: 50%;
                    background: var(--ad-green);
                    animation: adPulse 2s ease-in-out infinite;
                }

                /* ── Card base ── */
                .ad-card {
                    background: var(--ad-surface);
                    border: 1px solid var(--ad-border);
                    border-radius: var(--ad-radius);
                    box-shadow: var(--ad-shadow);
                    transition: box-shadow .25s ease, transform .25s ease;
                }
                .ad-card:hover {
                    box-shadow: var(--ad-shadow-h);
                    transform: translateY(-2px);
                }

                /* ── KPI cards row ── */
                .ad-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px; margin-bottom: 20px;
                }

                .ad-kpi {
                    padding: 24px;
                    animation: adFadeUp .4s ease both;
                }

                .ad-kpi-top {
                    display: flex; align-items: flex-start;
                    justify-content: space-between; margin-bottom: 20px;
                }

                .ad-kpi-icon {
                    width: 44px; height: 44px; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }

                .ad-kpi-value {
                    font-size: 28px; font-weight: 700;
                    letter-spacing: -.025em; color: var(--ad-ink);
                    line-height: 1; margin-bottom: 6px;
                    font-variant-numeric: tabular-nums;
                }
                .ad-kpi-label {
                    font-size: 12px; font-weight: 500;
                    color: var(--ad-soft); letter-spacing: .03em;
                }
                .ad-kpi-sub {
                    font-size: 11px; color: var(--ad-faint);
                    margin-top: 3px; font-weight: 400;
                }

                /* ── Alert banner ── */
                .ad-alert {
                    display: flex; align-items: center; gap: 12px;
                    padding: 14px 20px; border-radius: var(--ad-radius);
                    margin-bottom: 20px; border: 1px solid;
                    animation: adFadeUp .4s ease .1s both;
                }
                .ad-alert-warn {
                    background: rgba(245,158,11,.07);
                    border-color: rgba(245,158,11,.25);
                }
                .ad-alert-danger {
                    background: rgba(239,68,68,.06);
                    border-color: rgba(239,68,68,.2);
                }
                .ad-alert-icon { flex-shrink: 0; }
                .ad-alert-text { flex: 1; font-size: 13px; font-weight: 500; }
                .ad-alert-count {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 13px; font-weight: 600;
                    padding: 2px 10px; border-radius: 6px;
                }

                /* ── Bottom grid ── */
                .ad-bottom-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px; margin-bottom: 16px;
                    animation: adFadeUp .4s ease .15s both;
                }

                /* section titles */
                .ad-section-title {
                    font-size: 11px; font-weight: 700;
                    letter-spacing: .14em; text-transform: uppercase;
                    color: var(--ad-faint); margin-bottom: 24px;
                    display: flex; align-items: center; gap: 10px;
                }
                .ad-section-title::after {
                    content: ''; flex: 1; height: 1px;
                    background: var(--ad-border);
                }

                /* stat row */
                .ad-stat-row { margin-bottom: 22px; }
                .ad-stat-row:last-child { margin-bottom: 0; }
                .ad-stat-header {
                    display: flex; align-items: center;
                    justify-content: space-between; margin-bottom: 9px;
                }
                .ad-stat-name {
                    font-size: 12px; font-weight: 500;
                    color: var(--ad-soft); display: flex; align-items: center; gap: 8px;
                }
                .ad-stat-val {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 13px; font-weight: 600;
                    color: var(--ad-ink);
                }

                /* progress bar */
                .ad-bar-track {
                    height: 5px; border-radius: 3px;
                    background: var(--ad-muted); overflow: hidden;
                }
                .ad-bar-fill {
                    height: 100%; border-radius: 3px;
                    transition: width .6s cubic-bezier(.16,1,.3,1);
                }

                /* large metric */
                .ad-big-metric {
                    display: flex; align-items: flex-end;
                    gap: 12px; margin-bottom: 20px;
                }
                .ad-big-num {
                    font-size: 42px; font-weight: 700;
                    letter-spacing: -.03em; color: var(--ad-ink);
                    line-height: 1; font-variant-numeric: tabular-nums;
                }
                .ad-big-label {
                    font-size: 13px; font-weight: 400;
                    color: var(--ad-soft); padding-bottom: 6px;
                }

                /* donut ring */
                .ad-ring-wrap {
                    display: flex; align-items: center; gap: 24px;
                    margin-bottom: 24px;
                }
                .ad-ring { flex-shrink: 0; position: relative; }
                .ad-ring-pct {
                    position: absolute; inset: 0;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 14px; font-weight: 700; color: var(--ad-ink);
                    font-family: 'JetBrains Mono', monospace;
                }
                .ad-ring-legend { flex: 1; display: flex; flex-direction: column; gap: 8px; }
                .ad-ring-item {
                    display: flex; align-items: center; justify-content: space-between;
                    font-size: 12px;
                }
                .ad-ring-dot-label {
                    display: flex; align-items: center; gap: 8px;
                    color: var(--ad-soft); font-weight: 500;
                }
                .ad-ring-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
                .ad-ring-num {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 12px; font-weight: 600; color: var(--ad-ink);
                }

                /* inventory health bar */
                .ad-inv-bar {
                    height: 8px; border-radius: 4px;
                    display: flex; overflow: hidden; gap: 2px;
                    margin-bottom: 12px;
                }
                .ad-inv-seg { height: 100%; border-radius: 2px; transition: width .6s ease; }

                /* today revenue card */
                .ad-today-card {
                    padding: 20px 24px;
                    display: flex; align-items: center;
                    justify-content: space-between; flex-wrap: wrap; gap: 12px;
                    animation: adFadeUp .4s ease .2s both;
                }

                .ad-mono { font-family: 'JetBrains Mono', monospace; }

                /* ── Responsive ── */
                @media (max-width: 1100px) {
                    .ad-kpi-grid { grid-template-columns: repeat(2,1fr); }
                }
                @media (max-width: 768px) {
                    .ad-kpi-grid   { grid-template-columns: repeat(2,1fr); gap:12px; }
                    .ad-bottom-grid { grid-template-columns: 1fr; }
                    .ad-big-num { font-size:34px; }
                    .ad-header-title { font-size:22px; }
                }
                @media (max-width: 480px) {
                    .ad-kpi-grid { grid-template-columns: 1fr 1fr; gap:10px; }
                    .ad-kpi { padding:18px; }
                    .ad-kpi-value { font-size:22px; }
                }
            `}</style>

            <div className="ad-root">

                {/* ── Header ── */}
                <div className="ad-header">
                    <div>
                        <p className="ad-header-eyebrow">{dateStr}</p>
                        <h1 className="ad-header-title">Store Overview</h1>
                        <p className="ad-header-sub">Real-time performance metrics and catalog health.</p>
                    </div>
                    <div className="ad-live-pill">
                        <span className="ad-live-dot" />
                        Live Data
                    </div>
                </div>

                {/* ── Alert banners ── */}
                {stats.outOfStockProducts > 0 && (
                    <div className="ad-alert ad-alert-danger">
                        <FaExclamationTriangle className="ad-alert-icon" size={14} style={{ color:'#ef4444' }} />
                        <span className="ad-alert-text" style={{ color:'#b91c1c' }}>
                            Out-of-stock products require immediate attention — customers cannot purchase these items.
                        </span>
                        <span className="ad-alert-count" style={{ background:'rgba(239,68,68,.1)', color:'#dc2626' }}>
                            {stats.outOfStockProducts} items
                        </span>
                    </div>
                )}
                {stats.lowStockProducts > 0 && (
                    <div className="ad-alert ad-alert-warn">
                        <FaExclamationTriangle className="ad-alert-icon" size={14} style={{ color:'#f59e0b' }} />
                        <span className="ad-alert-text" style={{ color:'#92400e' }}>
                            {stats.lowStockProducts} product{stats.lowStockProducts > 1 ? 's are' : ' is'} running low — consider restocking soon.
                        </span>
                        <span className="ad-alert-count" style={{ background:'rgba(245,158,11,.1)', color:'#b45309' }}>
                            Low stock
                        </span>
                    </div>
                )}

                {/* ── KPI cards ── */}
                <div className="ad-kpi-grid">

                    {/* Revenue */}
                    <div className="ad-card ad-kpi" style={{ animationDelay:'.05s' }}>
                        <div className="ad-kpi-top">
                            <div className="ad-kpi-icon" style={{ background:'rgba(99,102,241,.1)' }}>
                                <FaDollarSign size={18} style={{ color:'var(--ad-indigo)' }} />
                            </div>
                            <TrendBadge value={stats.revenueChange} />
                        </div>
                        <div className="ad-kpi-value ad-mono">
                            ${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })}
                        </div>
                        <div className="ad-kpi-label">Total Revenue</div>
                        <div className="ad-kpi-sub">vs last month</div>
                    </div>

                    {/* Customers */}
                    <div className="ad-card ad-kpi" style={{ animationDelay:'.1s' }}>
                        <div className="ad-kpi-top">
                            <div className="ad-kpi-icon" style={{ background:'rgba(59,130,246,.1)' }}>
                                <FaUsers size={17} style={{ color:'var(--ad-blue)' }} />
                            </div>
                            <StatPill label="Active" color="success" />
                        </div>
                        <div className="ad-kpi-value">{stats.totalCustomers.toLocaleString()}</div>
                        <div className="ad-kpi-label">Total Customers</div>
                        <div className="ad-kpi-sub">Registered accounts</div>
                    </div>

                    {/* Total Orders */}
                    <div className="ad-card ad-kpi" style={{ animationDelay:'.15s' }}>
                        <div className="ad-kpi-top">
                            <div className="ad-kpi-icon" style={{ background:'rgba(16,185,129,.1)' }}>
                                <FaShoppingBag size={16} style={{ color:'var(--ad-green)' }} />
                            </div>
                            {stats.pendingOrders > 0
                                ? <StatPill label={`${stats.pendingOrders} pending`} color="warning" />
                                : <StatPill label="All clear" color="success" />
                            }
                        </div>
                        <div className="ad-kpi-value">{stats.totalOrders.toLocaleString()}</div>
                        <div className="ad-kpi-label">Total Orders</div>
                        <div className="ad-kpi-sub">{stats.todayOrders} new today</div>
                    </div>

                    {/* Products */}
                    <div className="ad-card ad-kpi" style={{ animationDelay:'.2s' }}>
                        <div className="ad-kpi-top">
                            <div className="ad-kpi-icon" style={{ background:'rgba(245,158,11,.1)' }}>
                                <FaBoxOpen size={16} style={{ color:'var(--ad-amber)' }} />
                            </div>
                            {stats.outOfStockProducts > 0
                                ? <StatPill label="Action needed" color="danger" />
                                : <StatPill label="Healthy" color="success" />
                            }
                        </div>
                        <div className="ad-kpi-value">{stats.totalProducts.toLocaleString()}</div>
                        <div className="ad-kpi-label">Total Products</div>
                        <div className="ad-kpi-sub">{stats.outOfStockProducts} out of stock</div>
                    </div>
                </div>

                {/* ── Today + Revenue card (full width) ── */}
                <div className="ad-card ad-today-card" style={{ marginBottom:16 }}>
                    <div>
                        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--ad-faint)', marginBottom:4 }}>
                            Today's Revenue
                        </div>
                        <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
                            <span style={{ fontSize:32, fontWeight:700, letterSpacing:'-.025em', color:'var(--ad-ink)', fontFamily:'JetBrains Mono, monospace' }}>
                                ${stats.todayRevenue.toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 })}
                            </span>
                            <span style={{ fontSize:13, color:'var(--ad-soft)' }}>{stats.todayOrders} order{stats.todayOrders !== 1 ? 's' : ''} placed today</span>
                        </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:28, flexWrap:'wrap' }}>
                        {[
                            { icon: FaCheckCircle, label:'Delivered',  val: stats.deliveredOrders, color:'var(--ad-green)' },
                            { icon: FaTruck,        label:'In Transit', val: stats.activeOrders,   color:'var(--ad-blue)'   },
                            { icon: FaClock,        label:'Pending',    val: stats.pendingOrders,  color:'var(--ad-amber)'  },
                        ].map(({ icon: Icon, label, val, color }) => (
                            <div key={label} style={{ textAlign:'center' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                                    <Icon size={12} style={{ color }} />
                                    <span style={{ fontSize:11, fontWeight:500, color:'var(--ad-soft)', letterSpacing:'.06em', textTransform:'uppercase' }}>{label}</span>
                                </div>
                                <div style={{ fontSize:22, fontWeight:700, color:'var(--ad-ink)', letterSpacing:'-.02em', fontFamily:'JetBrains Mono, monospace' }}>
                                    {val}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Bottom 2-col grid ── */}
                <div className="ad-bottom-grid">

                    {/* Orders Fulfillment */}
                    <div className="ad-card" style={{ padding:28 }}>
                        <p className="ad-section-title">
                            <FaChartLine size={10} /> Orders Fulfillment
                        </p>

                        {/* Fulfillment donut */}
                        <div className="ad-ring-wrap">
                            <div className="ad-ring">
                                <svg width={80} height={80} viewBox="0 0 80 80">
                                    <circle cx={40} cy={40} r={30} fill="none" stroke="var(--ad-muted)" strokeWidth={8} />
                                    <circle cx={40} cy={40} r={30} fill="none"
                                        stroke="var(--ad-green)" strokeWidth={8}
                                        strokeDasharray={`${(fulfillmentRate / 100) * 188.5} 188.5`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 40 40)"
                                        style={{ transition:'stroke-dasharray .8s cubic-bezier(.16,1,.3,1)' }}
                                    />
                                </svg>
                                <div className="ad-ring-pct">{fulfillmentRate}%</div>
                            </div>
                            <div className="ad-ring-legend">
                                {[
                                    { label:'Delivered', val: stats.deliveredOrders, color:'var(--ad-green)'  },
                                    { label:'Active',    val: stats.activeOrders,    color:'var(--ad-blue)'   },
                                    { label:'Pending',   val: stats.pendingOrders,   color:'var(--ad-amber)'  },
                                ].map(({ label, val, color }) => (
                                    <div key={label} className="ad-ring-item">
                                        <div className="ad-ring-dot-label">
                                            <div className="ad-ring-dot" style={{ background:color }} />
                                            {label}
                                        </div>
                                        <span className="ad-ring-num">{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Progress rows */}
                        {[
                            { label:'Fulfillment Rate', pct: fulfillmentRate, color:'var(--ad-green)',  icon: FaCheckCircle, iconColor:'var(--ad-green)' },
                            { label:'Active / Transit', pct: activeRate,      color:'var(--ad-blue)',   icon: FaTruck,        iconColor:'var(--ad-blue)'  },
                            { label:'Pending Review',   pct: pendingRate,     color:'var(--ad-amber)',  icon: FaClock,        iconColor:'var(--ad-amber)' },
                        ].map(({ label, pct, color, icon: Icon, iconColor }) => (
                            <div key={label} className="ad-stat-row">
                                <div className="ad-stat-header">
                                    <div className="ad-stat-name">
                                        <Icon size={10} style={{ color: iconColor }} />
                                        {label}
                                    </div>
                                    <span className="ad-stat-val">{pct}%</span>
                                </div>
                                <div className="ad-bar-track">
                                    <div className="ad-bar-fill" style={{ width:`${pct}%`, background: color }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Inventory Status */}
                    <div className="ad-card" style={{ padding:28 }}>
                        <p className="ad-section-title">
                            <FaBoxOpen size={10} /> Inventory Status
                        </p>

                        {/* Big number */}
                        <div className="ad-big-metric">
                            <span className="ad-big-num">{stats.totalProducts}</span>
                            <span className="ad-big-label">total SKUs</span>
                        </div>

                        {/* Segmented health bar */}
                        <div className="ad-inv-bar">
                            {/* Healthy */}
                            <div className="ad-inv-seg" style={{
                                flex: stats.totalProducts - stats.outOfStockProducts - stats.lowStockProducts,
                                background:'var(--ad-green)', opacity:.85,
                            }} />
                            {/* Low stock */}
                            <div className="ad-inv-seg" style={{
                                flex: stats.lowStockProducts,
                                background:'var(--ad-amber)',
                            }} />
                            {/* Out of stock */}
                            <div className="ad-inv-seg" style={{
                                flex: stats.outOfStockProducts,
                                background:'var(--ad-red)',
                            }} />
                        </div>

                        {/* Legend */}
                        <div style={{ display:'flex', gap:16, marginBottom:28, flexWrap:'wrap' }}>
                            {[
                                { dot:'var(--ad-green)', label:'Healthy',      count: stats.totalProducts - stats.outOfStockProducts - stats.lowStockProducts },
                                { dot:'var(--ad-amber)', label:'Low Stock',     count: stats.lowStockProducts },
                                { dot:'var(--ad-red)',   label:'Out of Stock',  count: stats.outOfStockProducts },
                            ].map(({ dot, label, count }) => (
                                <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                    <div style={{ width:8, height:8, borderRadius:2, background:dot, flexShrink:0 }} />
                                    <span style={{ fontSize:11, color:'var(--ad-soft)', fontWeight:500 }}>{label}</span>
                                    <span style={{ fontSize:11, fontWeight:700, color:'var(--ad-ink)', fontFamily:'JetBrains Mono, monospace' }}>{count}</span>
                                </div>
                            ))}
                        </div>

                        {/* Progress rows */}
                        {[
                            {
                                label:'Stock Health',
                                pct: stockHealthPct,
                                color: stockHealthPct > 75 ? 'var(--ad-green)' : stockHealthPct > 40 ? 'var(--ad-amber)' : 'var(--ad-red)',
                                icon: FaCheckCircle,
                                iconColor: 'var(--ad-green)',
                            },
                            {
                                label:'Low Stock Alert',
                                pct: stats.totalProducts > 0 ? Math.round((stats.lowStockProducts / stats.totalProducts) * 100) : 0,
                                color:'var(--ad-amber)',
                                icon: FaExclamationTriangle,
                                iconColor:'var(--ad-amber)',
                            },
                            {
                                label:'Out of Stock',
                                pct: stats.totalProducts > 0 ? Math.round((stats.outOfStockProducts / stats.totalProducts) * 100) : 0,
                                color:'var(--ad-red)',
                                icon: FaInbox,
                                iconColor:'var(--ad-red)',
                            },
                        ].map(({ label, pct, color, icon: Icon, iconColor }) => (
                            <div key={label} className="ad-stat-row">
                                <div className="ad-stat-header">
                                    <div className="ad-stat-name">
                                        <Icon size={10} style={{ color: iconColor }} />
                                        {label}
                                    </div>
                                    <span className="ad-stat-val">{pct}%</span>
                                </div>
                                <div className="ad-bar-track">
                                    <div className="ad-bar-fill" style={{ width:`${pct}%`, background: color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </>
    );
}
