'use client';

import { ChangeEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaMoneyBillWave, FaMapMarkerAlt, FaUser, FaArrowRight, FaMobileAlt } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/utils/axiosConfig';

const OUTSIDE_CITIES = [
    { value: 'burco',   label: 'Burco'   },
    { value: 'boorama', label: 'Boorama' },
    { value: 'berbera', label: 'Berbera' },
    { value: 'others',  label: 'Others'  },
];

const PROVIDER_NUMBERS: Record<string, string> = {
    zaad:   '464378',
    edahab: '736865',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap');
  :root {
    --ink:#0a0a0a; --ink-soft:#6b6b6b; --ink-faint:#ababab;
    --surface:#fff; --surface-warm:#fafaf7; --surface-muted:#f4f2ef;
    --accent:#c8a96e; --accent-light:#f0e8d8;
    --border:rgba(0,0,0,0.08); --border-strong:rgba(0,0,0,0.15);
  }
  *{box-sizing:border-box;}
  .co-page{min-height:100vh;background:var(--surface-warm);padding:60px max(24px,calc((100vw - 1300px)/2 + 40px));}
  .co-header{margin-bottom:48px;padding-bottom:28px;border-bottom:1px solid var(--border-strong);display:flex;align-items:flex-end;justify-content:space-between;}
  .co-eyebrow{font-family:'Jost',sans-serif;font-size:11px;font-weight:500;letter-spacing:.25em;text-transform:uppercase;color:var(--accent);margin-bottom:10px;display:flex;align-items:center;gap:10px;}
  .co-eyebrow::before{content:'';display:inline-block;width:28px;height:1px;background:var(--accent);}
  .co-title{font-family:'Cormorant Garamond',serif;font-size:clamp(36px,5vw,56px);font-weight:500;color:var(--ink);line-height:1;letter-spacing:-.02em;margin:0;}
  .co-back{font-family:'Jost',sans-serif;font-size:11px;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-soft);text-decoration:none;display:inline-flex;align-items:center;gap:8px;padding-bottom:2px;border-bottom:1px solid var(--border-strong);transition:color .2s,border-color .2s;}
  .co-back:hover{color:var(--ink);border-color:var(--ink);}
  .co-grid{display:grid;grid-template-columns:1fr 420px;gap:32px;align-items:start;}
  .co-panel{background:var(--surface);border:1px solid var(--border);}
  .co-panel-body{padding:40px;}
  .co-sec{margin-bottom:40px;}
  .co-sec:last-of-type{margin-bottom:0;}
  .co-sec-head{display:flex;align-items:center;gap:12px;margin-bottom:28px;padding-bottom:16px;border-bottom:1px solid var(--border);}
  .co-sec-icon{width:36px;height:36px;border:1px solid var(--border-strong);display:flex;align-items:center;justify-content:center;color:var(--accent);font-size:14px;flex-shrink:0;}
  .co-sec-title{font-family:'Jost',sans-serif;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--ink);margin:0;}
  .co-2col{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  .co-1col{display:grid;grid-template-columns:1fr;gap:20px;}
  .co-field{display:flex;flex-direction:column;gap:8px;}
  .co-label{font-family:'Jost',sans-serif;font-size:10px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-soft);}
  .co-input{font-family:'Jost',sans-serif;font-size:14px;font-weight:300;color:var(--ink);background:var(--surface-warm);border:1px solid var(--border-strong);padding:14px 16px;outline:none;transition:border-color .2s,background .2s;width:100%;border-radius:0;-webkit-appearance:none;}
  .co-input:focus{border-color:var(--ink);background:var(--surface);}
  .co-input::placeholder{color:var(--ink-faint);font-weight:300;}
  .co-loc-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
  .co-loc-card{border:1px solid var(--border-strong);padding:18px 20px;cursor:pointer;transition:border-color .2s,background .2s;display:flex;align-items:center;gap:12px;background:var(--surface-warm);user-select:none;}
  .co-loc-card:hover{border-color:var(--ink);}
  .co-loc-card.sel{border-color:var(--ink);background:var(--surface);}
  .co-radio{width:16px;height:16px;border-radius:50%;border:1.5px solid var(--border-strong);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .2s;}
  .co-loc-card.sel .co-radio{border-color:var(--ink);}
  .co-radio-dot{width:7px;height:7px;border-radius:50%;background:var(--ink);}
  .co-loc-label{font-family:'Jost',sans-serif;font-size:13px;font-weight:500;color:var(--ink);letter-spacing:.02em;}
  .co-city-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;animation:co-fade .22s ease;}
  .co-city-card{border:1px solid var(--border-strong);padding:13px 10px;cursor:pointer;text-align:center;font-family:'Jost',sans-serif;font-size:12px;font-weight:500;color:var(--ink-soft);background:var(--surface-warm);transition:border-color .2s,background .2s,color .2s;letter-spacing:.05em;user-select:none;}
  .co-city-card:hover{border-color:var(--ink);color:var(--ink);}
  .co-city-card.sel{border-color:var(--ink);background:var(--ink);color:#fff;}
  .co-pay-cards{display:flex;flex-direction:column;gap:12px;}
  .co-pay-card{border:1px solid var(--border-strong);padding:20px 24px;cursor:pointer;transition:border-color .2s,background .2s;background:var(--surface-warm);display:flex;align-items:center;gap:16px;user-select:none;}
  .co-pay-card:hover{border-color:var(--ink);}
  .co-pay-card.sel{border-color:var(--ink);background:var(--surface);}
  .co-pay-radio{width:18px;height:18px;border-radius:50%;border:1.5px solid var(--border-strong);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color .2s;}
  .co-pay-card.sel .co-pay-radio{border-color:var(--ink);}
  .co-pay-radio-dot{width:8px;height:8px;border-radius:50%;background:var(--ink);}
  .co-pay-label{font-family:'Jost',sans-serif;font-size:13px;font-weight:500;letter-spacing:.05em;color:var(--ink);margin-bottom:3px;}
  .co-pay-desc{font-family:'Jost',sans-serif;font-size:12px;font-weight:300;color:var(--ink-soft);}
  .co-mm{margin-top:16px;animation:co-fade .25s ease;}
  .co-tabs{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--border-strong);margin-bottom:20px;overflow:hidden;}
  .co-tab{padding:14px;text-align:center;cursor:pointer;font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-soft);background:var(--surface-warm);border:none;border-right:1px solid var(--border-strong);transition:background .2s,color .2s;user-select:none;}
  .co-tab:last-child{border-right:none;}
  .co-tab.active{background:var(--ink);color:#fff;}
  .co-info-box{background:var(--accent-light);border:1px solid rgba(200,169,110,.45);padding:22px 24px;margin-bottom:20px;}
  .co-info-eyebrow{font-family:'Jost',sans-serif;font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin-bottom:8px;display:block;}
  .co-info-number{font-family:'Cormorant Garamond',serif;font-size:30px;font-weight:600;color:var(--ink);letter-spacing:.02em;display:block;margin-bottom:10px;line-height:1;}
  .co-info-text{font-family:'Jost',sans-serif;font-size:13px;font-weight:300;color:var(--ink-soft);line-height:1.6;}
  .co-info-amount{font-family:'Jost',sans-serif;font-size:13px;font-weight:600;color:var(--ink);}
  .co-mm-fields{display:flex;flex-direction:column;gap:16px;}
  .co-error{background:#fef2f2;border:1px solid #fecaca;padding:14px 20px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .co-error-text{font-family:'Jost',sans-serif;font-size:13px;color:#dc2626;}
  .co-error-close{background:none;border:none;color:#dc2626;cursor:pointer;font-size:16px;padding:0;line-height:1;}
  .co-submit{width:100%;background:var(--ink);color:#fff;border:1.5px solid var(--ink);font-family:'Jost',sans-serif;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;padding:20px 32px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:12px;margin-top:36px;transition:all .3s cubic-bezier(.16,1,.3,1);}
  .co-submit:hover:not(:disabled){background:transparent;color:var(--ink);}
  .co-submit:disabled{opacity:.6;cursor:not-allowed;}
  .sum-panel{background:var(--surface);border:1px solid var(--border);position:sticky;top:24px;}
  .sum-head{padding:24px 32px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
  .sum-title{font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--ink);margin:0;}
  .sum-count{font-family:'Jost',sans-serif;font-size:11px;color:var(--ink-soft);}
  .sum-items{padding:24px 32px;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:20px;max-height:340px;overflow-y:auto;}
  .sum-item{display:flex;gap:16px;align-items:flex-start;}
  .sum-img{width:64px;height:64px;background:var(--surface-muted);overflow:hidden;flex-shrink:0;}
  .sum-img img{width:100%;height:100%;object-fit:cover;}
  .sum-name{font-family:'Jost',sans-serif;font-size:13px;font-weight:500;color:var(--ink);margin-bottom:4px;line-height:1.4;}
  .sum-meta{font-family:'Jost',sans-serif;font-size:11px;font-weight:300;color:var(--ink-soft);}
  .sum-price{font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--ink);margin-left:auto;flex-shrink:0;}
  .sum-total-row{padding:28px 32px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border);}
  .sum-total-label{font-family:'Jost',sans-serif;font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--ink);}
  .sum-total-val{font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:500;color:var(--ink);letter-spacing:-.01em;}
  .sum-note{padding:0 32px 24px;font-family:'Jost',sans-serif;font-size:11px;font-weight:300;color:var(--ink-faint);}
  .empty-page{min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;text-align:center;padding:60px 24px;background:var(--surface-warm);}
  .empty-emoji{font-size:72px;line-height:1;margin-bottom:8px;}
  .empty-title{font-family:'Cormorant Garamond',serif;font-size:40px;font-weight:500;color:var(--ink);margin:0;}
  .empty-desc{font-family:'Jost',sans-serif;font-size:14px;font-weight:300;color:var(--ink-soft);}
  .btn-ink{font-family:'Jost',sans-serif;font-size:12px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;background:var(--ink);color:#fff;border:1.5px solid var(--ink);padding:16px 40px;text-decoration:none;display:inline-flex;align-items:center;gap:10px;transition:all .3s cubic-bezier(.16,1,.3,1);margin-top:8px;}
  .btn-ink:hover{background:transparent;color:var(--ink);}
  @keyframes co-fade{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
  @media(max-width:1024px){.co-grid{grid-template-columns:1fr;}.sum-panel{position:static;}.co-page{padding:40px 24px;}.co-header{flex-direction:column;align-items:flex-start;gap:16px;}}
  @media(max-width:640px){.co-panel-body{padding:24px;}.co-2col{grid-template-columns:1fr;}.co-loc-cards{grid-template-columns:1fr;}.co-city-cards{grid-template-columns:repeat(2,1fr);}.sum-head,.sum-items,.sum-total-row,.sum-note{padding-left:20px;padding-right:20px;}.co-page{padding:32px 16px;}}
`;

export default function CheckoutPage() {
    const router          = useRouter();
    const { cart, clearCart } = useCart();
    const { user }        = useAuth();
    const [loading, setLoading] = useState(false);
    const [error,   setError  ] = useState('');

    const [form, setForm] = useState({
        fullName:      '',
        email:         '',
        phone:         '',
        streetAddress: '',
        location:      'inside' as 'inside' | 'outside',
        outsideCity:   '',
        paymentMethod: 'cash_on_delivery' as 'cash_on_delivery' | 'zaad' | 'edahab',
        transferPhone: '',
        transferName:  '',
    });

    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const imgUrl = (p?: string) => {
        if (!p) return '';
        return p.startsWith('/uploads') ? `${backendUrl}${p}` : p;
    };

    useEffect(() => {
        if (user) setForm(p => ({ ...p, email: user.email || '', fullName: user.name || '' }));
    }, [user]);

    const subtotal      = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const total         = subtotal;
    const isMobileMoney = form.paymentMethod === 'zaad' || form.paymentMethod === 'edahab';

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm(p => ({ ...p, [e.target.name]: e.target.value }));
        setError('');
    };

    const validate = () => {
        if (!form.fullName.trim())      return 'Please enter your full name';
        if (!form.email.trim())         return 'Please enter your email address';
        if (!form.phone.trim())         return 'Please enter your phone number';
        if (!form.streetAddress.trim()) return 'Please enter your street address';
        if (form.location === 'outside' && !form.outsideCity) return 'Please select your city';
        if (isMobileMoney) {
            if (!form.transferPhone.trim()) return 'Please enter the number you sent the money from';
            if (!form.transferName.trim())  return 'Please enter the name used for the transfer';
        }
        if (cart.items.length === 0) return 'Your cart is empty';
        return null;
    };

    const handlePlaceOrder = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setLoading(true);
        setError('');

        try {
            const cityLabel = form.location === 'outside'
                ? (OUTSIDE_CITIES.find(c => c.value === form.outsideCity)?.label ?? 'Outside Hargeisa')
                : 'Hargeisa';

            const shippingAddress = form.location === 'outside'
                ? `${form.streetAddress}, ${cityLabel}, Somaliland`
                : `${form.streetAddress}, Hargeisa, Somaliland`;

            /*
             * IMPORTANT: we save the payment data to sessionStorage RIGHT HERE
             * before the API call. This guarantees the success page can show
             * the mobile money details even if the backend doesn't return them yet.
             */
            if (isMobileMoney) {
                sessionStorage.setItem('lastOrderPayment', JSON.stringify({
                    paymentMethod: form.paymentMethod,
                    transferPhone: form.transferPhone,
                    transferName:  form.transferName,
                    total,
                }));
            } else {
                sessionStorage.removeItem('lastOrderPayment');
            }

            const orderData = {
                /* Customer */
                customer: {
                    name:    form.fullName,
                    email:   form.email,
                    phone:   form.phone,
                    address: form.streetAddress,
                },
                /* Also at top level for backends that read flat fields */
                customer_name:  form.fullName,
                customer_email: form.email,
                customer_phone: form.phone,

                /* Location */
                location:        form.location,
                city:            cityLabel,
                shipping_address: shippingAddress,

                /* Items */
                items: cart.items.map(item => ({
                    productId: item.product_id,
                    name:      item.name,
                    quantity:  item.quantity,
                    price:     item.price,
                    size:      item.size  ?? null,
                    color:     item.color ?? null,
                    image:     item.image ?? null,
                })),

                /* Totals */
                subtotal,
                deliveryFee: 0,
                total,

                /* Payment — both naming conventions */
                paymentMethod:  form.paymentMethod,
                payment_method: form.paymentMethod,

                /* Mobile money proof — only when used */
                ...(isMobileMoney && {
                    /* camelCase */
                    mobilePayment: {
                        provider:      form.paymentMethod,
                        transferPhone: form.transferPhone,
                        transferName:  form.transferName,
                        amountPaid:    total,
                    },
                    /* snake_case */
                    mobile_payment: {
                        provider:       form.paymentMethod,
                        transfer_phone: form.transferPhone,
                        transfer_name:  form.transferName,
                        amount_paid:    total,
                    },
                    /* flat fields — some backends read these */
                    mobile_provider:       form.paymentMethod,
                    mobile_transfer_phone: form.transferPhone,
                    mobile_transfer_name:  form.transferName,
                    mobile_amount_paid:    total,
                }),
            };

            const endpoint = user ? '/orders' : '/guest-orders';
            const response = await axiosInstance.post(endpoint, orderData);
            const orderId  = response.data.data.orderId;
            clearCart();
            router.push(`/order-success?orderId=${orderId}`);
        } catch (e: any) {
            console.error('Order error:', e);
            setError(e.response?.data?.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const submitLabel =
        form.paymentMethod === 'zaad'   ? 'Confirm Order — Paid via Zaad'    :
        form.paymentMethod === 'edahab' ? 'Confirm Order — Paid via E-Dahab' :
                                          'Confirm Order — Cash on Delivery';

    if (cart.items.length === 0) return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="empty-page">
                <div className="empty-emoji">🛒</div>
                <h2 className="empty-title">Your cart is empty</h2>
                <p className="empty-desc">Looks like you haven't added anything yet.</p>
                <Link href="/" className="btn-ink">Continue Shopping <FaArrowRight size={11} /></Link>
            </div>
        </>
    );

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: CSS }} />
            <div className="co-page">

                <div className="co-header">
                    <div>
                        <div className="co-eyebrow">Secure Checkout</div>
                        <h1 className="co-title">Complete Your Order</h1>
                    </div>
                    <Link href="/cart" className="co-back">← Back to Cart</Link>
                </div>

                <div className="co-grid">

                    {/* ══ FORM ══ */}
                    <div className="co-panel">
                        <div className="co-panel-body">

                            {error && (
                                <div className="co-error">
                                    <span className="co-error-text">{error}</span>
                                    <button className="co-error-close" onClick={() => setError('')}>✕</button>
                                </div>
                            )}

                            {/* 1 — Customer */}
                            <div className="co-sec">
                                <div className="co-sec-head">
                                    <div className="co-sec-icon"><FaUser /></div>
                                    <p className="co-sec-title">Customer Information</p>
                                </div>
                                <div className="co-2col">
                                    <div className="co-field">
                                        <label className="co-label">Full Name *</label>
                                        <input type="text" name="fullName" className="co-input"
                                            placeholder="John Doe" value={form.fullName} onChange={handleChange} />
                                    </div>
                                    <div className="co-field">
                                        <label className="co-label">Email Address *</label>
                                        <input type="email" name="email" className="co-input"
                                            placeholder="john@example.com" value={form.email} onChange={handleChange} />
                                    </div>
                                    <div className="co-field">
                                        <label className="co-label">Phone Number *</label>
                                        <input type="tel" name="phone" className="co-input"
                                            placeholder="+252 63 123456" value={form.phone} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            {/* 2 — Shipping */}
                            <div className="co-sec">
                                <div className="co-sec-head">
                                    <div className="co-sec-icon"><FaMapMarkerAlt /></div>
                                    <p className="co-sec-title">Shipping Address</p>
                                </div>

                                <div className="co-1col" style={{ marginBottom:24 }}>
                                    <div className="co-field">
                                        <label className="co-label">Street Address *</label>
                                        <input type="text" name="streetAddress" className="co-input"
                                            placeholder="Wadnaha Road, 26 June District"
                                            value={form.streetAddress} onChange={handleChange} />
                                    </div>
                                </div>

                                <label className="co-label" style={{ display:'block', marginBottom:12 }}>Location *</label>
                                <div className="co-loc-cards">
                                    <div
                                        className={`co-loc-card${form.location === 'inside' ? ' sel' : ''}`}
                                        onClick={() => { setForm(p => ({ ...p, location:'inside', outsideCity:'' })); setError(''); }}
                                    >
                                        <div className="co-radio">{form.location === 'inside' && <div className="co-radio-dot" />}</div>
                                        <span className="co-loc-label">Inside Hargeisa</span>
                                    </div>
                                    <div
                                        className={`co-loc-card${form.location === 'outside' ? ' sel' : ''}`}
                                        onClick={() => { setForm(p => ({ ...p, location:'outside' })); setError(''); }}
                                    >
                                        <div className="co-radio">{form.location === 'outside' && <div className="co-radio-dot" />}</div>
                                        <span className="co-loc-label">Outside Hargeisa</span>
                                    </div>
                                </div>

                                {form.location === 'outside' && (
                                    <div>
                                        <label className="co-label" style={{ display:'block', marginBottom:12 }}>Select Your City *</label>
                                        <div className="co-city-cards">
                                            {OUTSIDE_CITIES.map(city => (
                                                <div
                                                    key={city.value}
                                                    className={`co-city-card${form.outsideCity === city.value ? ' sel' : ''}`}
                                                    onClick={() => { setForm(p => ({ ...p, outsideCity:city.value })); setError(''); }}
                                                >
                                                    {city.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 3 — Payment */}
                            <div className="co-sec">
                                <div className="co-sec-head">
                                    <div className="co-sec-icon"><FaMoneyBillWave /></div>
                                    <p className="co-sec-title">Payment Method</p>
                                </div>

                                <div className="co-pay-cards">
                                    <div
                                        className={`co-pay-card${form.paymentMethod === 'cash_on_delivery' ? ' sel' : ''}`}
                                        onClick={() => { setForm(p => ({ ...p, paymentMethod:'cash_on_delivery', transferPhone:'', transferName:'' })); setError(''); }}
                                    >
                                        <div className="co-pay-radio">{form.paymentMethod === 'cash_on_delivery' && <div className="co-pay-radio-dot" />}</div>
                                        <div>
                                            <div className="co-pay-label">Cash on Delivery</div>
                                            <div className="co-pay-desc">Pay when you receive your order</div>
                                        </div>
                                    </div>

                                    <div
                                        className={`co-pay-card${isMobileMoney ? ' sel' : ''}`}
                                        onClick={() => { if (!isMobileMoney) { setForm(p => ({ ...p, paymentMethod:'zaad' })); setError(''); } }}
                                    >
                                        <div className="co-pay-radio">{isMobileMoney && <div className="co-pay-radio-dot" />}</div>
                                        <div>
                                            <div className="co-pay-label" style={{ display:'flex', alignItems:'center', gap:8 }}>
                                                <FaMobileAlt size={13} style={{ color:'var(--accent)' }} />
                                                Mobile Money — Zaad / E-Dahab
                                            </div>
                                            <div className="co-pay-desc">Send payment via Zaad or E-Dahab</div>
                                        </div>
                                    </div>
                                </div>

                                {isMobileMoney && (
                                    <div className="co-mm">
                                        <div className="co-tabs">
                                            <div className={`co-tab${form.paymentMethod === 'zaad' ? ' active' : ''}`}
                                                onClick={() => setForm(p => ({ ...p, paymentMethod:'zaad' }))}>Zaad</div>
                                            <div className={`co-tab${form.paymentMethod === 'edahab' ? ' active' : ''}`}
                                                onClick={() => setForm(p => ({ ...p, paymentMethod:'edahab' }))}>E-Dahab</div>
                                        </div>

                                        <div className="co-info-box">
                                            <span className="co-info-eyebrow">
                                                Fadlan ku dir lacagta {form.paymentMethod === 'zaad' ? 'Zaad' : 'E-Dahab'} aad ku iibsatay number-ka hoose.
                                            </span>
                                            <span className="co-info-number">{PROVIDER_NUMBERS[form.paymentMethod]}</span>
                                            <p className="co-info-text">
                                                Fadlan si sax ah ugu dir <span className="co-info-amount">${total.toFixed(2)}</span> lambarka kore, waa ku iibso
                                                kadibna buuxi faahfaahinta hoose si aan u xaqiijinno lacag-bixintaada.
                                            </p>
                                        </div>

                                        <div className="co-mm-fields">
                                            <div className="co-field">
                                                <label className="co-label">Number ka aad ka so dirtay</label>
                                                <input type="tel" name="transferPhone" className="co-input"
                                                    placeholder="+252 63 XXXXXXX"
                                                    value={form.transferPhone} onChange={handleChange} />
                                            </div>
                                            <div className="co-field">
                                                <label className="co-label">Magaca Number ka aad kaso dirtay</label>
                                                <input type="text" name="transferName" className="co-input"
                                                    placeholder="Gali magaca ku qoran rasiidka lacagta kadib markaad dirto"
                                                    value={form.transferName} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button className="co-submit" onClick={handlePlaceOrder} disabled={loading}>
                                {loading ? 'Placing Order…' : <>{submitLabel} <FaArrowRight size={11} /></>}
                            </button>

                        </div>
                    </div>

                    {/* ══ SUMMARY ══ */}
                    <div className="sum-panel">
                        <div className="sum-head">
                            <p className="sum-title">Order Summary</p>
                            <span className="sum-count">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="sum-items">
                            {cart.items.map(item => (
                                <div key={item.id} className="sum-item">
                                    <div className="sum-img">
                                        <img src={imgUrl(item.image)} alt={item.name}
                                            onError={e => { e.currentTarget.style.display = 'none'; }} />
                                    </div>
                                    <div style={{ flex:1 }}>
                                        <div className="sum-name">{item.name}</div>
                                        <div className="sum-meta">
                                            {item.size  && `Size: ${item.size}`}
                                            {item.size && item.color && ' · '}
                                            {item.color && `Color: ${item.color}`}
                                            {(item.size || item.color) && ' · '}
                                            Qty: {item.quantity}
                                        </div>
                                    </div>
                                    <div className="sum-price">${(item.price * item.quantity).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                        <div className="sum-total-row">
                            <span className="sum-total-label">Total</span>
                            <span className="sum-total-val">${total.toFixed(2)}</span>
                        </div>
                        <p className="sum-note">
                            {isMobileMoney
                                ? `Pay $${total.toFixed(2)} via ${form.paymentMethod === 'zaad' ? 'Zaad' : 'E-Dahab'} before confirming.`
                                : 'Cash on delivery. No hidden fees.'}
                        </p>
                    </div>

                </div>
            </div>
        </>
    );
}
