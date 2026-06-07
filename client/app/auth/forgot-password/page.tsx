'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import axiosInstance from '@/utils/axiosConfig';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setSuccess(true);
      } else {
        setError(res.data.message || 'Something went wrong.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>

      <div className="fp-shell">
        {/* Decorative background */}
        <div className="fp-bg-orb fp-bg-orb-1" aria-hidden="true" />
        <div className="fp-bg-orb fp-bg-orb-2" aria-hidden="true" />
        <div className="fp-bg-grid"             aria-hidden="true" />

        <div className="fp-card">

          {/* ── Brand ── */}
          <div className="fp-brand">
            <div className="fp-brand-mark" aria-hidden="true">
              <span /><span /><span />
            </div>
            <h1 className="fp-brand-name">AIR COLLECTION</h1>
            <p className="fp-brand-sub">Password Recovery</p>
          </div>

          {/* ── Divider ── */}
          <div className="fp-rule" aria-hidden="true" />

          {/* ── Success state ── */}
          {success ? (
            <div className="fp-success">
              <div className="fp-success-envelope" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="fp-success-title">Check your inbox</h2>
              <p className="fp-success-body">
                We've sent a password reset link to
              </p>
              <div className="fp-success-email">{email}</div>
              <p className="fp-success-hint">
                Didn't receive it? Check your spam folder or try again.
              </p>
              <Link href="/auth/signin" className="fp-submit" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              {/* ── Intro ── */}
              <p className="fp-intro">
                Enter the email address associated with your account and we'll send you a link to reset your password.
              </p>

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} className="fp-form" noValidate>

                {error && (
                  <div className="fp-alert" role="alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                <div className="fp-field">
                  <label className="fp-label" htmlFor="fp-email">Email Address</label>
                  <div className="fp-input-wrap">
                    <span className="fp-input-icon" aria-hidden="true"><FaEnvelope size={12} /></span>
                    <input
                      id="fp-email"
                      type="email"
                      className="fp-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <button type="submit" className="fp-submit" disabled={loading}>
                  {loading
                    ? <><span className="fp-spinner" aria-hidden="true" /> Sending…</>
                    : 'Send Reset Link'}
                </button>

              </form>
            </>
          )}

          {/* ── Footer ── */}
          <div className="fp-footer">
            <Link href="/auth/signin" className="fp-back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="11" height="11" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Sign In
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Jost:wght@300;400;500;600&display=swap');

:root {
  --fp-cream:    #faf9f6;
  --fp-ink:      #0e0d0b;
  --fp-ink2:     #3a3830;
  --fp-ink3:     #7a7769;
  --fp-border:   rgba(14,13,11,0.10);
  --fp-border2:  rgba(14,13,11,0.06);
  --fp-gold:     #b8965a;
  --fp-gold2:    #d4b07a;
  --fp-red:      #c0392b;
  --fp-card-w:   420px;
  --fp-radius:   20px;
  --fp-ff-serif: 'Cormorant Garamond', Georgia, serif;
  --fp-ff-body:  'Jost', sans-serif;
  --fp-shadow:   0 2px 4px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.07), 0 32px 80px rgba(0,0,0,0.06);
}

/* ── Shell ── */
.fp-shell {
  font-family: var(--fp-ff-body);
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--fp-cream);
  position: relative;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ── Background orbs ── */
.fp-bg-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
  opacity: 0.35;
}
.fp-bg-orb-1 {
  width: 480px; height: 480px;
  background: radial-gradient(circle, #e8dcc8 0%, transparent 70%);
  top: -140px; left: -100px;
}
.fp-bg-orb-2 {
  width: 360px; height: 360px;
  background: radial-gradient(circle, #d9cfc0 0%, transparent 70%);
  bottom: -80px; right: -60px;
}

/* ── Subtle grid ── */
.fp-bg-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(14,13,11,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14,13,11,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
}

/* ── Card ── */
.fp-card {
  position: relative;
  width: 100%;
  max-width: var(--fp-card-w);
  background: #fff;
  border: 1px solid var(--fp-border);
  border-radius: var(--fp-radius);
  padding: 44px 44px 36px;
  box-shadow: var(--fp-shadow);
  animation: fp-rise 0.55s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes fp-rise {
  from { opacity: 0; transform: translateY(24px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}

/* ── Brand ── */
.fp-brand { text-align: center; margin-bottom: 22px; }

.fp-brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 14px;
}
.fp-brand-mark span {
  display: block;
  height: 1px;
  background: var(--fp-gold);
}
.fp-brand-mark span:nth-child(1) { width: 18px; }
.fp-brand-mark span:nth-child(2) { width: 8px;  opacity: 0.5; }
.fp-brand-mark span:nth-child(3) { width: 18px; }

.fp-brand-name {
  font-family: var(--fp-ff-serif);
  font-size: 1.75rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  color: var(--fp-ink);
  margin: 0 0 6px;
  line-height: 1;
}
.fp-brand-sub {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--fp-ink3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

/* ── Rule ── */
.fp-rule {
  border: none;
  border-top: 1px solid var(--fp-border2);
  margin: 0 0 24px;
}

/* ── Intro text ── */
.fp-intro {
  font-size: 0.82rem;
  color: var(--fp-ink3);
  line-height: 1.7;
  text-align: center;
  margin: 0 0 24px;
}

/* ── Alert ── */
.fp-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fdf3f2;
  border: 1px solid #f5c6c2;
  border-left: 3px solid var(--fp-red);
  border-radius: 8px;
  padding: 11px 14px;
  font-size: 0.8rem;
  color: #8b2218;
  margin-bottom: 18px;
  line-height: 1.5;
  animation: fp-shake 0.35s ease;
}
.fp-alert svg { flex-shrink: 0; margin-top: 1px; }
@keyframes fp-shake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-4px); }
  75%      { transform: translateX(4px); }
}

/* ── Form ── */
.fp-form { display: flex; flex-direction: column; }

/* ── Field ── */
.fp-field { margin-bottom: 20px; }

.fp-label {
  display: block;
  font-size: 0.67rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--fp-ink3);
  margin-bottom: 8px;
}

/* ── Input wrapper ── */
.fp-input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid var(--fp-border);
  border-radius: 10px;
  background: var(--fp-cream);
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
}
.fp-input-wrap:focus-within {
  border-color: rgba(14,13,11,0.35);
  box-shadow: 0 0 0 3px rgba(184,150,90,0.10);
  background: #fff;
}

.fp-input-icon {
  padding: 0 12px;
  color: var(--fp-ink3);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.fp-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 12px 12px 0;
  font-size: 0.88rem;
  font-family: var(--fp-ff-body);
  color: var(--fp-ink);
  outline: none;
  min-width: 0;
}
.fp-input::placeholder { color: #c2bdb3; }

/* ── Submit ── */
.fp-submit {
  width: 100%;
  padding: 13px;
  background: var(--fp-ink);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: var(--fp-ff-body);
  font-size: 0.82rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 2px 12px rgba(14,13,11,0.18);
}
.fp-submit:hover:not(:disabled) {
  background: #1c1b17;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(14,13,11,0.22);
}
.fp-submit:active:not(:disabled) { transform: translateY(0); }
.fp-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Spinner ── */
.fp-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: fp-spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes fp-spin { to { transform: rotate(360deg); } }

/* ── Success ── */
.fp-success {
  text-align: center;
  padding: 4px 0 8px;
  animation: fp-rise 0.5s cubic-bezier(0.22,1,0.36,1) both;
}

.fp-success-envelope {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c9a84c, #e8c97a);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 8px 28px rgba(184,150,90,0.28);
}
.fp-success-envelope svg { width: 26px; height: 26px; }

.fp-success-title {
  font-family: var(--fp-ff-serif);
  font-size: 1.6rem;
  font-weight: 500;
  color: var(--fp-ink);
  margin: 0 0 10px;
  letter-spacing: 0.01em;
}
.fp-success-body {
  font-size: 0.82rem;
  color: var(--fp-ink3);
  margin: 0 0 6px;
}
.fp-success-email {
  display: inline-block;
  font-size: 0.83rem;
  font-weight: 500;
  color: var(--fp-ink2);
  background: var(--fp-cream);
  border: 1px solid var(--fp-border);
  border-radius: 6px;
  padding: 4px 12px;
  margin-bottom: 14px;
  word-break: break-all;
}
.fp-success-hint {
  font-size: 0.75rem;
  color: var(--fp-ink3);
  margin: 0 0 22px;
  line-height: 1.6;
}

/* ── Footer ── */
.fp-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--fp-border2);
}
.fp-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 400;
  color: var(--fp-ink3);
  text-decoration: none;
  letter-spacing: 0.04em;
  transition: color 0.2s, gap 0.2s;
}
.fp-back-link:hover { color: var(--fp-ink); gap: 8px; }

/* ── Responsive ── */
@media (max-width: 500px) {
  .fp-card { padding: 32px 24px 28px; }
  .fp-brand-name { font-size: 1.5rem; }
}
`;
