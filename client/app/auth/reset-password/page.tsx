'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import axiosInstance from '@/utils/axiosConfig';

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="container py-5 text-center">
          <div className="spinner-border text-dark" role="status"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token')?.trim() || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { setError('Please fill in both fields.'); return; }
    if (password !== confirmPassword)  { setError('Passwords do not match.'); return; }
    if (password.length < 6)           { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.post('/auth/reset-password', { token, newPassword: password });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/auth/signin'), 3000);
      } else {
        setError(res.data.message || 'Reset failed. Try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <>
        <style>{CSS}</style>
        <div className="rp-shell"><div className="rp-spinner-lg" /></div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>

      <div className="rp-shell">
        {/* Decorative background */}
        <div className="rp-bg-orb rp-bg-orb-1" aria-hidden="true" />
        <div className="rp-bg-orb rp-bg-orb-2" aria-hidden="true" />
        <div className="rp-bg-grid"            aria-hidden="true" />

        <div className="rp-card">

          {/* ── Brand ── */}
          <div className="rp-brand">
            <div className="rp-brand-mark" aria-hidden="true">
              <span /><span /><span />
            </div>
            <h1 className="rp-brand-name">AIR COLLECTION</h1>
            <p className="rp-brand-sub">Secure your account</p>
          </div>

          {/* ── Divider ── */}
          <div className="rp-rule" aria-hidden="true" />

          {/* ── Success ── */}
          {success ? (
            <div className="rp-success">
              <div className="rp-success-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="rp-success-title">Password Reset!</h2>
              <p className="rp-success-body">
                Your new password has been set. Redirecting you to sign in…
              </p>
              <div className="rp-redirect-bar"><div className="rp-redirect-fill" /></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rp-form" noValidate>

              {error && (
                <div className="rp-alert" role="alert">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              {/* New password */}
              <div className="rp-field">
                <label className="rp-label" htmlFor="rp-new-pw">New Password</label>
                <div className="rp-input-wrap">
                  <span className="rp-input-icon" aria-hidden="true"><FaLock size={12} /></span>
                  <input
                    id="rp-new-pw"
                    type={showPassword ? 'text' : 'password'}
                    className="rp-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="rp-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
                {/* Strength bar */}
                <div className="rp-strength-wrap" aria-hidden="true">
                  {[1,2,3,4].map(n => (
                    <div
                      key={n}
                      className={`rp-strength-seg${
                        password.length === 0 ? '' :
                        password.length < 6  ? (n === 1 ? ' rp-s-weak'   : '') :
                        password.length < 10 ? (n <= 2  ? ' rp-s-fair'   : '') :
                        password.length < 14 ? (n <= 3  ? ' rp-s-strong' : '') :
                                               ' rp-s-max'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Confirm password */}
              <div className="rp-field">
                <label className="rp-label" htmlFor="rp-confirm-pw">Confirm Password</label>
                <div className={`rp-input-wrap${confirmPassword && confirmPassword !== password ? ' rp-input-wrap-err' : confirmPassword && confirmPassword === password ? ' rp-input-wrap-ok' : ''}`}>
                  <span className="rp-input-icon" aria-hidden="true"><FaLock size={12} /></span>
                  <input
                    id="rp-confirm-pw"
                    type={showPassword ? 'text' : 'password'}
                    className="rp-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {confirmPassword && confirmPassword === password && (
                    <span className="rp-match-icon" aria-label="Passwords match">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  )}
                </div>
              </div>

              <button type="submit" className="rp-submit" disabled={loading || !token}>
                {loading
                  ? <><span className="rp-spinner" aria-hidden="true" /> Resetting…</>
                  : 'Reset Password'}
              </button>
            </form>
          )}

          {/* ── Footer link ── */}
          <div className="rp-footer">
            <Link href="/auth/signin" className="rp-back-link">
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

/* ── Variables ── */
:root {
  --rp-cream:    #faf9f6;
  --rp-ink:      #0e0d0b;
  --rp-ink2:     #3a3830;
  --rp-ink3:     #7a7769;
  --rp-border:   rgba(14,13,11,0.10);
  --rp-border2:  rgba(14,13,11,0.06);
  --rp-gold:     #b8965a;
  --rp-gold2:    #d4b07a;
  --rp-red:      #c0392b;
  --rp-green:    #2e7d52;
  --rp-card-w:   420px;
  --rp-radius:   20px;
  --rp-ff-serif: 'Cormorant Garamond', Georgia, serif;
  --rp-ff-body:  'Jost', sans-serif;
  --rp-shadow:   0 2px 4px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.07), 0 32px 80px rgba(0,0,0,0.06);
}

/* ── Shell ── */
.rp-shell {
  font-family: var(--rp-ff-body);
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: var(--rp-cream);
  position: relative;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ── Background orbs ── */
.rp-bg-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
  opacity: 0.35;
}
.rp-bg-orb-1 {
  width: 520px; height: 520px;
  background: radial-gradient(circle, #e8dcc8 0%, transparent 70%);
  top: -160px; right: -120px;
}
.rp-bg-orb-2 {
  width: 400px; height: 400px;
  background: radial-gradient(circle, #d9cfc0 0%, transparent 70%);
  bottom: -100px; left: -80px;
}

/* ── Subtle grid ── */
.rp-bg-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(14,13,11,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14,13,11,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
}

/* ── Loading spinner ── */
.rp-spinner-lg {
  width: 36px; height: 36px;
  border: 2px solid var(--rp-border);
  border-top-color: var(--rp-ink);
  border-radius: 50%;
  animation: rp-spin 0.8s linear infinite;
}
@keyframes rp-spin { to { transform: rotate(360deg); } }

/* ── Card ── */
.rp-card {
  position: relative;
  width: 100%;
  max-width: var(--rp-card-w);
  background: #fff;
  border: 1px solid var(--rp-border);
  border-radius: var(--rp-radius);
  padding: 44px 44px 36px;
  box-shadow: var(--rp-shadow);
  animation: rp-rise 0.55s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes rp-rise {
  from { opacity: 0; transform: translateY(24px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}

/* ── Brand ── */
.rp-brand { text-align: center; margin-bottom: 22px; }

.rp-brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 14px;
}
.rp-brand-mark span {
  display: block;
  height: 1px;
  background: var(--rp-gold);
}
.rp-brand-mark span:nth-child(1) { width: 18px; }
.rp-brand-mark span:nth-child(2) { width: 8px;  opacity: 0.5; }
.rp-brand-mark span:nth-child(3) { width: 18px; }

.rp-brand-name {
  font-family: var(--rp-ff-serif);
  font-size: 1.75rem;
  font-weight: 500;
  letter-spacing: 0.18em;
  color: var(--rp-ink);
  margin: 0 0 6px;
  line-height: 1;
}

.rp-brand-sub {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--rp-ink3);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

/* ── Rule ── */
.rp-rule {
  border: none;
  border-top: 1px solid var(--rp-border2);
  margin: 0 0 28px;
}

/* ── Alert ── */
.rp-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fdf3f2;
  border: 1px solid #f5c6c2;
  border-left: 3px solid var(--rp-red);
  border-radius: 8px;
  padding: 11px 14px;
  font-size: 0.8rem;
  color: #8b2218;
  margin-bottom: 20px;
  line-height: 1.5;
  animation: rp-shake 0.35s ease;
}
.rp-alert svg { flex-shrink: 0; margin-top: 1px; }
@keyframes rp-shake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-4px); }
  75%      { transform: translateX(4px); }
}

/* ── Form ── */
.rp-form { display: flex; flex-direction: column; gap: 0; }

/* ── Field ── */
.rp-field { margin-bottom: 20px; }

.rp-label {
  display: block;
  font-size: 0.67rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--rp-ink3);
  margin-bottom: 8px;
}

/* ── Input wrapper ── */
.rp-input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid var(--rp-border);
  border-radius: 10px;
  background: var(--rp-cream);
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
}
.rp-input-wrap:focus-within {
  border-color: rgba(14,13,11,0.35);
  box-shadow: 0 0 0 3px rgba(184,150,90,0.10);
  background: #fff;
}
.rp-input-wrap-err { border-color: #f5a09a !important; }
.rp-input-wrap-ok  { border-color: #86c9a4 !important; }

.rp-input-icon {
  padding: 0 12px;
  color: var(--rp-ink3);
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.rp-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 4px;
  font-size: 0.88rem;
  font-family: var(--rp-ff-body);
  color: var(--rp-ink);
  outline: none;
  min-width: 0;
}
.rp-input::placeholder { color: #c2bdb3; }

.rp-eye-btn {
  padding: 0 13px;
  height: 100%;
  background: none;
  border: none;
  border-left: 1px solid var(--rp-border2);
  color: var(--rp-ink3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.rp-eye-btn:hover { color: var(--rp-ink); background: rgba(14,13,11,0.03); }

.rp-match-icon {
  padding: 0 12px;
  color: var(--rp-green);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* ── Strength bar ── */
.rp-strength-wrap {
  display: flex;
  gap: 4px;
  margin-top: 7px;
}
.rp-strength-seg {
  flex: 1;
  height: 3px;
  border-radius: 99px;
  background: var(--rp-border);
  transition: background 0.3s;
}
.rp-s-weak   { background: #e05c50; }
.rp-s-fair   { background: #e8a84a; }
.rp-s-strong { background: #5aaa7a; }
.rp-s-max    { background: var(--rp-gold); }

/* ── Submit ── */
.rp-submit {
  margin-top: 8px;
  width: 100%;
  padding: 13px;
  background: var(--rp-ink);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: var(--rp-ff-body);
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
.rp-submit:hover:not(:disabled) {
  background: #1c1b17;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(14,13,11,0.22);
}
.rp-submit:active:not(:disabled) { transform: translateY(0); }
.rp-submit:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Submit spinner ── */
.rp-spinner {
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: rp-spin 0.7s linear infinite;
  display: inline-block;
}

/* ── Success ── */
.rp-success {
  text-align: center;
  padding: 10px 0 6px;
  animation: rp-rise 0.5s cubic-bezier(0.22,1,0.36,1) both;
}
.rp-success-icon {
  width: 56px; height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2e7d52, #4caf80);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
  box-shadow: 0 6px 24px rgba(46,125,82,0.25);
}
.rp-success-icon svg { width: 24px; height: 24px; stroke-width: 2.5; }
.rp-success-title {
  font-family: var(--rp-ff-serif);
  font-size: 1.55rem;
  font-weight: 500;
  color: var(--rp-ink);
  margin: 0 0 10px;
  letter-spacing: 0.01em;
}
.rp-success-body {
  font-size: 0.83rem;
  color: var(--rp-ink3);
  line-height: 1.65;
  margin: 0 0 20px;
}
.rp-redirect-bar {
  height: 2px;
  background: var(--rp-border);
  border-radius: 99px;
  overflow: hidden;
}
.rp-redirect-fill {
  height: 100%;
  background: var(--rp-gold);
  animation: rp-fill 3s linear forwards;
  border-radius: 99px;
}
@keyframes rp-fill { from { width: 0%; } to { width: 100%; } }

/* ── Footer ── */
.rp-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--rp-border2);
}
.rp-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 400;
  color: var(--rp-ink3);
  text-decoration: none;
  letter-spacing: 0.04em;
  transition: color 0.2s, gap 0.2s;
}
.rp-back-link:hover { color: var(--rp-ink); gap: 8px; }

/* ── Responsive ── */
@media (max-width: 500px) {
  .rp-card { padding: 32px 24px 28px; }
  .rp-brand-name { font-size: 1.5rem; }
}
`;
