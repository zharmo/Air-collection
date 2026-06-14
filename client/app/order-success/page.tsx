'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    FaArrowRight, FaHome, FaShoppingBag, FaHeadset,
    FaMapMarkerAlt, FaMobileAlt, FaMoneyBillWave,
    FaPhone, FaReceipt, FaUser, FaEnvelope,
} from 'react-icons/fa';
import axiosInstance from '@/utils/axiosConfig';
import { useAuth } from '@/context/AuthContext';

/* ─────────────────────────── TYPES ─────────────────────────── */
interface OrderItem {
    name: string; quantity: number; price: number | string;
    size?: string; color?: string; image?: string;
}

interface MobilePayment {
    provider:        string;
    transfer_phone?: string; transferPhone?: string;
    transfer_name?:  string; transferName?:  string;
    amount_paid?:    number | string; amountPaid?: number | string;
}

interface Order {
    order_number:     string;
    status:           string;
    shipping_address: string;
    total_amount:     number;
    delivery_fee:     number;
    items:            OrderItem[];
    location?:        string;
    city?:            string;
    payment_method?:  string;
    mobile_payment?:  MobilePayment;
    /* customer — all possible backend shapes */
    user_name?:       string; user_email?:    string; user_phone?:    string;
    customer_name?:   string; customer_email?: string; customer_phone?: string;
    customer?: { name?: string; email?: string; phone?: string };
}

/* ─────────────────────────── HELPERS ───────────────────────── */
const toMoney = (v: number | string | null | undefined) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
};

const pick = (...vals: (string | undefined | null)[]) =>
    vals.find(v => v && String(v).trim() !== '') ?? '';

/*
 * Normalise mobile payment from ANY shape the backend may return.
 * Returns null if no mobile payment data at all.
 */
const normMP = (mp?: MobilePayment | null) => {
    if (!mp) return null;
    const provider = (mp.provider || '').toLowerCase();
    return {
        provider,
        providerLabel: provider === 'edahab' ? 'E-Dahab' : provider === 'zaad' ? 'Zaad' : mp.provider,
        senderPhone:   mp.transfer_phone || mp.transferPhone || '',
        receiptName:   mp.transfer_name  || mp.transferName  || '',
        amount:        Number(mp.amount_paid ?? mp.amountPaid ?? 0),
    };
};

/* ─────────────────────────── STYLES ────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap');

  :root {
    --ink:#0a0a0a; --ink-soft:#6b6b6b; --ink-faint:#ababab;
    --surface:#fff; --surface-warm:#fafaf7; --surface-muted:#f4f2ef;
    --accent:#c8a96e; --accent-light:#f0e8d8;
    --border:rgba(0,0,0,0.08); --border-strong:rgba(0,0,0,0.15);
    --green:#166534; --green-bg:#f0fdf4; --green-border:#bbf7d0;
  }
  *{box-sizing:border-box;}

  .os-page{
    min-height:100vh; background:var(--surface-warm);
    padding:60px max(24px,calc((100vw - 1300px)/2 + 40px));
    font-family:'Jost',sans-serif; font-weight:300; color:var(--ink);
    -webkit-font-smoothing:antialiased;
  }

  /* ── header ── */
  .os-header{margin-bottom:48px;padding-bottom:28px;border-bottom:1px solid var(--border-strong);}
  .os-eyebrow{font-size:11px;font-weight:500;letter-spacing:.25em;text-transform:uppercase;
              color:var(--accent);margin-bottom:10px;display:flex;align-items:center;gap:10px;}
  .os-eyebrow::before{content:'';display:inline-block;width:28px;height:1px;background:var(--accent);}
  .os-title{font-family:'Cormorant Garamond',serif;font-size:clamp(36px,5vw,56px);font-weight:500;
             color:var(--ink);line-height:1;letter-spacing:-.02em;margin:0 0 8px;}
  .os-order-num{font-size:13px;font-weight:400;color:var(--ink-soft);letter-spacing:.06em;}

  /* ── layout ── */
  .os-grid{display:grid;grid-template-columns:1fr 400px;gap:32px;align-items:start;}
  .os-panel{background:var(--surface);border:1px solid var(--border);margin-bottom:20px;}
  .os-panel:last-of-type{margin-bottom:0;}
  .os-panel-body{padding:32px 36px;}

  /* ── section heading ── */
  .os-sh{display:flex;align-items:center;gap:12px;margin-bottom:22px;padding-bottom:14px;
         border-bottom:1px solid var(--border);}
  .os-sh-icon{width:34px;height:34px;border:1px solid var(--border-strong);display:flex;
              align-items:center;justify-content:center;color:var(--accent);font-size:13px;flex-shrink:0;}
  .os-sh-title{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;
               color:var(--ink);margin:0;}

  /* ── status bar ── */
  .os-status{display:flex;align-items:center;gap:16px;padding:22px 28px;
             background:var(--green-bg);border:1px solid var(--green-border);}
  .os-status-tick{width:40px;height:40px;background:var(--green);border-radius:50%;display:flex;
                  align-items:center;justify-content:center;color:#fff;font-size:18px;flex-shrink:0;}
  .os-status-label{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;
                   color:var(--green);margin-bottom:3px;}
  .os-status-desc{font-size:13px;font-weight:300;color:var(--ink-soft);}

  /* ── shipping info grid ── */
  .os-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;}
  .os-info-cell{padding:13px 0;border-bottom:1px solid var(--border);}
  .os-info-cell:nth-last-child(-n+2){border-bottom:none;}
  .os-info-label{font-size:10px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;
                 color:var(--ink-soft);margin-bottom:5px;display:flex;align-items:center;gap:5px;}
  .os-info-value{font-size:14px;font-weight:500;color:var(--ink);line-height:1.4;}

  /* ── city tag ── */
  .os-city-tag{display:inline-flex;align-items:center;gap:6px;background:var(--accent-light);
               border:1px solid rgba(200,169,110,.4);padding:5px 14px;font-size:11px;font-weight:600;
               letter-spacing:.12em;text-transform:uppercase;color:var(--ink);margin-top:18px;}

  /* ── payment method badge ── */
  .os-pay-badge{display:inline-flex;align-items:center;gap:8px;background:var(--ink);color:#fff;
                padding:7px 18px;font-size:11px;font-weight:600;letter-spacing:.15em;
                text-transform:uppercase;margin-bottom:16px;}

  /* ── mobile money proof box ── */
  .os-proof-box{background:var(--accent-light);border:1px solid rgba(200,169,110,.5);
                padding:24px;margin-top:16px;}
  .os-proof-title{font-size:10px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
                  color:var(--accent);display:block;margin-bottom:18px;}
  .os-proof-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  .os-proof-label{font-size:10px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;
                  color:var(--ink-soft);margin-bottom:5px;display:flex;align-items:center;gap:4px;}
  .os-proof-value{font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;
                  color:var(--ink);line-height:1.2;word-break:break-all;}
  .os-proof-full{grid-column:1/-1;}

  /* ── COD info ── */
  .os-cod-desc{font-family:'Jost',sans-serif;font-size:13px;font-weight:300;
               color:var(--ink-soft);margin:0;line-height:1.7;}

  /* ── delivery ── */
  .os-delivery-title{font-size:15px;font-weight:600;color:var(--ink);margin:0 0 6px;}
  .os-delivery-desc{font-size:13px;font-weight:300;color:var(--ink-soft);margin:0;line-height:1.6;}

  /* ── help ── */
  .os-help{display:flex;align-items:flex-start;gap:16px;}
  .os-help-icon{color:var(--accent);font-size:22px;margin-top:2px;flex-shrink:0;}
  .os-help-text strong{font-size:13px;font-weight:600;color:var(--ink);display:block;margin-bottom:4px;}
  .os-help-text p{font-size:13px;font-weight:300;color:var(--ink-soft);margin:0 0 10px;line-height:1.6;}
  .os-link{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);
           text-decoration:none;border-bottom:1px solid var(--border-strong);padding-bottom:1px;
           display:inline-flex;align-items:center;gap:7px;transition:color .2s,border-color .2s;}
  .os-link:hover{color:var(--accent);border-color:var(--accent);}

  /* ── cta buttons ── */
  .os-cta-row{display:flex;gap:12px;margin-top:24px;}
  .os-btn{flex:1;font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:.18em;
          text-transform:uppercase;padding:16px 20px;text-decoration:none;display:inline-flex;
          align-items:center;justify-content:center;gap:9px;
          transition:all .3s cubic-bezier(.16,1,.3,1);border:1.5px solid var(--ink);cursor:pointer;}
  .os-btn-outline{background:transparent;color:var(--ink);}
  .os-btn-outline:hover{background:var(--ink);color:#fff;}
  .os-btn-filled{background:var(--ink);color:#fff;}
  .os-btn-filled:hover{background:transparent;color:var(--ink);}

  /* ── right summary panel ── */
  .os-summary{background:var(--surface);border:1px solid var(--border);position:sticky;top:24px;}
  .os-sum-header{padding:22px 30px;border-bottom:1px solid var(--border);display:flex;
                 align-items:center;justify-content:space-between;}
  .os-sum-title{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;
                color:var(--ink);margin:0;}
  .os-sum-count{font-size:11px;font-weight:400;color:var(--ink-soft);}
  .os-items-list{padding:22px 30px;border-bottom:1px solid var(--border);display:flex;
                 flex-direction:column;gap:18px;max-height:320px;overflow-y:auto;}
  .os-item{display:flex;gap:14px;align-items:flex-start;}
  .os-item-img{width:60px;height:60px;background:var(--surface-muted);overflow:hidden;flex-shrink:0;}
  .os-item-img img{width:100%;height:100%;object-fit:cover;}
  .os-item-name{font-size:13px;font-weight:500;color:var(--ink);margin-bottom:4px;line-height:1.4;}
  .os-item-meta{font-size:11px;font-weight:300;color:var(--ink-soft);letter-spacing:.03em;}
  .os-item-price{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;
                 color:var(--ink);margin-left:auto;flex-shrink:0;}
  .os-totals{padding:16px 30px;border-bottom:1px solid var(--border);display:flex;
             flex-direction:column;gap:8px;}
  .os-total-line{display:flex;justify-content:space-between;font-size:13px;font-weight:300;
                 color:var(--ink-soft);}
  .os-grand-total{padding:18px 30px;display:flex;align-items:center;justify-content:space-between;}
  .os-grand-label{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;
                  color:var(--ink);}
  .os-grand-value{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:500;
                  color:var(--ink);letter-spacing:-.01em;}

  /* ── responsive ── */
  @media(max-width:1024px){
    .os-grid{grid-template-columns:1fr;}
    .os-summary{position:static;}
    .os-page{padding:40px 24px;}
  }
  @media(max-width:640px){
    .os-panel-body{padding:22px 20px;}
    .os-sum-header,.os-items-list,.os-totals,.os-grand-total{padding-left:20px;padding-right:20px;}
    .os-proof-grid,.os-info-grid{grid-template-columns:1fr;}
    .os-cta-row{flex-direction:column;}
  }
`;

/* ─────────────────────────── LOADING ───────────────────────── */
function LoadingPage() {
    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: S }} />
            <div className="os-page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'70vh' }}>
                <p style={{ fontFamily:'Jost', fontSize:12, letterSpacing:'0.2em', textTransform:'uppercase', color:'#ababab' }}>
                    Loading your order…
                </p>
            </div>
        </>
    );
}

/* ─────────────────────────── EXPORT ────────────────────────── */
export default function OrderSuccessPage() {
    return <Suspense fallback={<LoadingPage />}><OrderSuccessContent /></Suspense>;
}

/* ─────────────────────────── CONTENT ───────────────────────── */
function OrderSuccessContent() {
    const searchParams = useSearchParams();
    const router       = useRouter();
    const orderId      = searchParams.get('orderId');
    const { user }     = useAuth();

    const [order,   setOrder  ] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    /*
     * We also keep the raw checkout form data that was saved to sessionStorage
     * at order submission time. This is our guaranteed fallback for mobile
     * payment fields — the backend may not yet return them.
     */
    const [localMP, setLocalMP] = useState<{
        paymentMethod: string;
        transferPhone: string;
        transferName:  string;
        total:         number;
    } | null>(null);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const imgUrl     = (p?: string) => {
        if (!p) return '';
        if (p.startsWith('/uploads')) return `${backendUrl}${p}`;
        return p;
    };

    useEffect(() => {
        /* Read the payment snapshot saved by checkout page */
        try {
            const raw = sessionStorage.getItem('lastOrderPayment');
            if (raw) setLocalMP(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (!orderId) { router.push('/'); return; }
        (async () => {
            try {
                const ep  = user ? `/orders/${orderId}` : `/guest-orders/${orderId}`;
                const res = await axiosInstance.get(ep);
                const d   = res.data.data;
                setOrder({
                    ...d,
                    total_amount: parseFloat(d.total_amount) || 0,
                    delivery_fee: parseFloat(d.delivery_fee) || 0,
                });
            } catch { router.push('/'); }
            finally  { setLoading(false); }
        })();
    }, [orderId, router, user]);

    if (loading) return <LoadingPage />;
    if (!order)  return null;

    /* ── Resolve all fields ── */
    const subtotal = order.total_amount - (order.delivery_fee || 0);

    const customerName  = pick(order.user_name,  order.customer_name,  order.customer?.name);
    const customerEmail = pick(order.user_email, order.customer_email, order.customer?.email);
    const customerPhone = pick(order.user_phone, order.customer_phone, order.customer?.phone);

    const addrParts = (order.shipping_address || '').split(',').map(s => s.trim()).filter(Boolean);

    /*
     * Payment method:
     * 1. Use what the backend returns in order.payment_method
     * 2. Fall back to what we saved in sessionStorage from the checkout form
     */
    const paymentMethod = pick(order.payment_method, localMP?.paymentMethod ?? null);
    const isMobileMoney = paymentMethod === 'zaad' || paymentMethod === 'edahab';
    const providerLabel = paymentMethod === 'zaad' ? 'Zaad'
                        : paymentMethod === 'edahab' ? 'E-Dahab' : '';

    /*
     * Mobile payment proof:
     * 1. Use backend data if available
     * 2. Fall back to sessionStorage snapshot
     */
    const backendProof = normMP(order.mobile_payment);
    const proof = backendProof ?? (
        isMobileMoney && localMP ? {
            provider:      paymentMethod,
            providerLabel: providerLabel,
            senderPhone:   localMP.transferPhone,
            receiptName:   localMP.transferName,
            amount:        localMP.total,
        } : null
    );

    /* Location / city */
    const isOutside = order.location === 'outside';
    const cityLabel = order.city
        || (addrParts.length > 1 ? addrParts[1] : '')
        || (isOutside ? 'Outside Hargeisa' : 'Hargeisa');

    const statusText = (order.status || 'pending')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: S }} />
            <div className="os-page">

                {/* ── Page header ── */}
                <div className="os-header">
                    <div className="os-eyebrow">Order Confirmed</div>
                    <h1 className="os-title">Thank you for your order.</h1>
                    <p className="os-order-num">Order #{order.order_number}</p>
                </div>

                <div className="os-grid">

                    {/* ══ LEFT COLUMN ══ */}
                    <div>

                        {/* 1 — Confirmed status */}
                        <div className="os-panel">
                            <div className="os-panel-body" style={{ padding:0 }}>
                                <div className="os-status">
                                    <div className="os-status-tick">✓</div>
                                    <div>
                                        <div className="os-status-label">{statusText}</div>
                                        <div className="os-status-desc">
                                            Dalabkaaga waa la xaqiijiyay, waxaana si dhakhso ah loo bilaabi doonaa ka shaqayntiisa.

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2 — Shipping details */}
                        <div className="os-panel">
                            <div className="os-panel-body">
                                <div className="os-sh">
                                    <div className="os-sh-icon"><FaMapMarkerAlt /></div>
                                    <p className="os-sh-title">Shipping Details</p>
                                </div>

                                <div className="os-info-grid">
                                    <div className="os-info-cell">
                                        <div className="os-info-label"><FaUser size={9} />Full Name</div>
                                        <div className="os-info-value">{customerName || '—'}</div>
                                    </div>
                                    <div className="os-info-cell">
                                        <div className="os-info-label"><FaPhone size={9} />Phone</div>
                                        <div className="os-info-value">{customerPhone || '—'}</div>
                                    </div>
                                    <div className="os-info-cell">
                                        <div className="os-info-label"><FaEnvelope size={9} />Email</div>
                                        <div className="os-info-value" style={{ fontSize:13 }}>{customerEmail || '—'}</div>
                                    </div>
                                    <div className="os-info-cell">
                                        <div className="os-info-label"><FaMapMarkerAlt size={9} />Street Address</div>
                                        <div className="os-info-value">{addrParts[0] || '—'}</div>
                                    </div>
                                </div>

                                {/* City tag — always visible */}
                                <div className="os-city-tag">
                                    <FaMapMarkerAlt size={9} /> {cityLabel}
                                </div>
                            </div>
                        </div>

                        {/* 3 — Payment */}
                        <div className="os-panel">
                            <div className="os-panel-body">
                                <div className="os-sh">
                                    <div className="os-sh-icon">
                                        {isMobileMoney ? <FaMobileAlt /> : <FaMoneyBillWave />}
                                    </div>
                                    <p className="os-sh-title">Payment</p>
                                </div>

                                {isMobileMoney ? (
                                    <>
                                        {/* ── Mobile money badge ── */}
                                        <div className="os-pay-badge">
                                            <FaMobileAlt size={11} />
                                            Mobile Money — {providerLabel}
                                        </div>

                                        <p className="os-cod-desc" style={{ marginBottom: proof ? 0 : undefined }}>
                                           Lacag bixintaada waa la xaqiijinayaa. Waxaan ku xaqiijin doonnaa dhowr daqiiqo gudahood.
.
                                        </p>

                                        {/* ── Proof box — always shown when mobile money ── */}
                                        {proof && (
                                            <div className="os-proof-box">
                                                <span className="os-proof-title">
                                                    Transfer Details You Submitted
                                                </span>
                                                <div className="os-proof-grid">
                                                    {/* Sent From */}
                                                    <div>
                                                        <div className="os-proof-label">
                                                            <FaPhone size={8} /> Sent From
                                                        </div>
                                                        <div className="os-proof-value">
                                                            {proof.senderPhone || '—'}
                                                        </div>
                                                    </div>
                                                    {/* Amount */}
                                                    <div>
                                                        <div className="os-proof-label">
                                                            Amount Paid
                                                        </div>
                                                        <div className="os-proof-value">
                                                            ${toMoney(proof.amount)}
                                                        </div>
                                                    </div>
                                                    {/* Receipt name — full width */}
                                                    <div className="os-proof-full">
                                                        <div className="os-proof-label">
                                                            <FaReceipt size={8} /> Name on Transfer
                                                        </div>
                                                        <div className="os-proof-value">
                                                            {proof.receiptName || '—'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="os-pay-badge">
                                            <FaMoneyBillWave size={11} /> Cash on Delivery
                                        </div>
                                        <p className="os-cod-desc">
                                            Please have ${toMoney(order.total_amount)} ready when your order arrives.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 4 — Estimated Delivery */}
                        <div className="os-panel">
                            <div className="os-panel-body">
                                <div className="os-sh">
                                    <div className="os-sh-icon" style={{ fontSize:13 }}>📦</div>
                                    <p className="os-sh-title">Estimated Delivery</p>
                                </div>
                                <p className="os-delivery-title">48 hours</p>
                                <p className="os-delivery-desc">
                                    We will send you a notification once your order is on its way.
                                    {isOutside && cityLabel && cityLabel !== 'Outside Hargeisa' &&
                                        ` Delivery to ${cityLabel} may take slightly longer than our Hargeisa estimates.`}
                                </p>
                            </div>
                        </div>

                        {/* 5 — Help */}
                        <div className="os-panel">
                            <div className="os-panel-body">
                                <div className="os-help">
                                    <FaHeadset className="os-help-icon" />
                                    <div className="os-help-text">
                                        <strong>Need help?</strong>
                                        <p>Questions about your order? Our team is available around the clock.</p>
                                        <Link href="/contact" className="os-link">
                                            Contact Support <FaArrowRight size={9} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CTA buttons */}
                        <div className="os-cta-row">
                            <Link href="/"       className="os-btn os-btn-outline"><FaHome size={11} /> Continue Shopping</Link>
                            <Link href="/orders" className="os-btn os-btn-filled"><FaShoppingBag size={11} /> My Orders</Link>
                        </div>

                    </div>

                    {/* ══ RIGHT — Order Summary ══ */}
                    <div className="os-summary">
                        <div className="os-sum-header">
                            <p className="os-sum-title">Order Summary</p>
                            <span className="os-sum-count">
                                {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="os-items-list">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="os-item">
                                    <div className="os-item-img">
                                        <img src={imgUrl(item.image)} alt={item.name}
                                             onError={e => { e.currentTarget.style.display = 'none'; }} />
                                    </div>
                                    <div style={{ flex:1 }}>
                                        <div className="os-item-name">{item.name}</div>
                                        <div className="os-item-meta">
                                            {item.size  && `Size: ${item.size}`}
                                            {item.size && item.color && ' · '}
                                            {item.color && `Color: ${item.color}`}
                                            {(item.size || item.color) && ' · '}
                                            Qty: {item.quantity}
                                        </div>
                                    </div>
                                    <div className="os-item-price">
                                        ${toMoney(Number(item.price) * Number(item.quantity))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="os-totals">
                            <div className="os-total-line">
                                <span>Subtotal</span><span>${toMoney(subtotal)}</span>
                            </div>
                            {order.delivery_fee > 0 && (
                                <div className="os-total-line">
                                    <span>Delivery</span><span>${toMoney(order.delivery_fee)}</span>
                                </div>
                            )}
                        </div>

                        <div className="os-grand-total">
                            <span className="os-grand-label">Total</span>
                            <span className="os-grand-value">${toMoney(order.total_amount)}</span>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
