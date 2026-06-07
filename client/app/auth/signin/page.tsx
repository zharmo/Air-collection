'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/utils/axiosConfig';

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="container py-5 text-center">
          <div className="spinner-border text-dark" role="status"></div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email,      setEmail     ] = useState('');
  const [password,   setPassword  ] = useState('');
  const [showPw,     setShowPw    ] = useState(false);
  const [loading,    setLoading   ] = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [error,      setError     ] = useState('');
  const [tokenProcessing, setTokenProcessing] = useState(false);
  const { login } = useAuth();

  // Handle Google redirect token
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setTokenProcessing(true);
      localStorage.setItem('token', token);
      axiosInstance.get('/auth/me')
        .then(res => {
          const user = res.data.data;
          localStorage.setItem('user', JSON.stringify(user));
          router.push('/');
        })
        .catch(err => {
          console.error('Token validation error:', err);
          setError('Google sign-in failed. Please try again.');
          setTokenProcessing(false);
        });
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) router.push('/');
      else setError(result.message || 'Login failed. Please check your email and password.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /*
   * ── Google OAuth ──
   * Same pattern as SignIn – redirect browser to backend OAuth entry point.
   * Backend redirects to /auth/callback?token=<JWT> after success.
   *
   * We intentionally do NOT reset googleLoad here because the page is
   * navigating away; showing a spinner until the page unloads is correct UX.
   */
  const handleGoogleSignin = () => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) {
      setError('Google sign-in is not configured. Please contact support.');
      return;
    }
    setGoogleLoad(true);
    // Full-page navigation – required for OAuth redirects
    window.location.href = `${base}/auth/google`;
  };

  if (tokenProcessing) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-dark" role="status"></div>
        <p className="mt-3">Completing sign in...</p>
      </div>
    );
  }

  return (
    <>
      <style>{STYLES}</style>

      <div className="auth-root">

        {/* ══ LEFT PANEL ══ */}
        <aside className="auth-panel-left">
          <div className="auth-panel-inner">
            <div className="auth-brand-mark">AIR COLLECTION</div>

            <div className="auth-panel-hero">
              <div className="auth-panel-year">SS&apos;25</div>
              <h2 className="auth-panel-headline">
                The new<br />
                <em>arrivals</em><br />
                await.
              </h2>
            </div>

            {/* Collection grid */}
            <div className="auth-collection-grid">
              <div
                className="auth-col-block auth-col-block-tall"
                style={{ background: 'linear-gradient(160deg,#1c1c1c 0%,#3a3230 100%)' }}
              >
                <div className="auth-col-tag">Outerwear</div>
              </div>
              <div className="auth-col-right">
                <div
                  className="auth-col-block"
                  style={{ background: 'linear-gradient(140deg,#c8b89a 0%,#a89070 100%)' }}
                >
                  <div className="auth-col-tag">Knitwear</div>
                </div>
                <div
                  className="auth-col-block"
                  style={{ background: 'linear-gradient(140deg,#2c2c2c 0%,#505050 100%)' }}
                >
                  <div className="auth-col-tag">Essentials</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="auth-stats">
              <div className="auth-stat">
                <div className="auth-stat-val">2,400+</div>
                <div className="auth-stat-label">Members</div>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <div className="auth-stat-val">340+</div>
                <div className="auth-stat-label">Curated pieces</div>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <div className="auth-stat-val">4.9★</div>
                <div className="auth-stat-label">Avg. rating</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ══ RIGHT FORM ══ */}
        <main className="auth-form-side">
          <div className="auth-form-wrap">

            {/* Mobile-only brand (panel is hidden on small screens) */}
            <div className="auth-mobile-brand">AIR COLLECTION</div>

            <div className="auth-eyebrow">Welcome back</div>
            <h1 className="auth-heading">Sign in</h1>
            <p className="auth-sub">Access your orders, wishlist, and saved collection details.</p>

            {/* Error banner */}
            {error && (
              <div className="auth-error" role="alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8"  x2="12"    y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            {/* ── Google OAuth button ── */}
            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleSignin}
              disabled={googleLoad || loading}
              aria-busy={googleLoad}
              aria-label="Continue with Google"
            >
              {googleLoad ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Redirecting to Google…
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div className="auth-divider"><span>or sign in with email</span></div>

            {/* ── Email / password form ── */}
            <form onSubmit={handleSubmit} noValidate>

              <div className="auth-field">
                <label className="auth-label" htmlFor="si-email">Email address</label>
                <input
                  id="si-email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading || googleLoad}
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="si-password">Password</label>
                <div className="auth-pw-wrap">
                  <input
                    id="si-password"
                    type={showPw ? 'text' : 'password'}
                    className="auth-input auth-input-pw"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading || googleLoad}
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPw(v => !v)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || googleLoad}
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner auth-spinner-white" aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <p className="auth-switch">
              New to Air Collection?{' '}
              <Link href="/auth/signup" className="auth-switch-link">Create account</Link>
            </p>

            <footer className="auth-footer">
              <Link href="/privacy">Privacy</Link>
              <span aria-hidden="true">·</span>
              <Link href="/terms">Terms</Link>
              <span aria-hidden="true">·</span>
              <Link href="/help">Help</Link>
              <span aria-hidden="true">·</span>
              <span>© 2025 Air Collection</span>
            </footer>
          </div>
        </main>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   STYLES
═══════════════════════════════════════ */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-root {
    display: flex;
    min-height: 100vh;
    font-family: 'DM Sans', sans-serif;
    background: #faf9f7;
  }

  /* ── Left panel ── */
  .auth-panel-left {
    flex: 0 0 46%;
    background: #0a0a0a;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: stretch;
  }
  .auth-panel-left::before {
    content: '';
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 1;
  }
  .auth-panel-left::after {
    content: '';
    position: absolute;
    width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(180,154,100,0.12) 0%, transparent 70%);
    bottom: -80px; left: -80px;
    pointer-events: none; z-index: 1;
  }

  .auth-panel-inner {
    display: flex;
    flex-direction: column;
    padding: 48px 52px;
    width: 100%;
    position: relative;
    z-index: 2;
  }

  .auth-brand-mark {
    font-family: 'Cormorant Garamond', serif;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.38em;
    color: rgba(255,255,255,0.3);
    text-transform: uppercase;
    margin-bottom: 52px;
  }

  .auth-panel-hero { margin-bottom: 44px; }
  .auth-panel-year {
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    color: #b49a7a;
    font-weight: 500;
    margin-bottom: 12px;
  }
  .auth-panel-headline {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(2.6rem, 3.8vw, 3.8rem);
    font-weight: 400;
    line-height: 1.1;
    color: #f5f0eb;
    letter-spacing: -0.02em;
  }
  .auth-panel-headline em { font-style: italic; color: #b49a7a; }

  /* Collection grid */
  .auth-collection-grid {
    display: flex;
    gap: 10px;
    margin-bottom: 44px;
    height: 200px;
    flex: 1;
  }
  .auth-col-block-tall { flex: 1.2; }
  .auth-col-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .auth-col-block {
    flex: 1;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    transition: transform 0.25s;
  }
  .auth-col-block:hover { transform: scale(1.02); }
  .auth-col-tag {
    position: absolute;
    bottom: 12px; left: 12px;
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
    font-weight: 500;
  }

  /* Stats */
  .auth-stats {
    display: flex;
    align-items: center;
    margin-top: auto;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }
  .auth-stat { flex: 1; text-align: center; }
  .auth-stat-val {
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.35rem;
    font-weight: 500;
    color: #f5f0eb;
    letter-spacing: -0.02em;
    margin-bottom: 3px;
  }
  .auth-stat-label {
    font-size: 0.67rem;
    color: rgba(255,255,255,0.3);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .auth-stat-divider {
    width: 1px; height: 32px;
    background: rgba(255,255,255,0.10);
  }

  /* ── Right form side ── */
  .auth-form-side {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    background: #faf9f7;
    overflow-y: auto;
  }

  .auth-form-wrap {
    width: 100%;
    max-width: 420px;
    animation: auth-fade-up 0.45s ease both;
  }
  @keyframes auth-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* Shown only on mobile when left panel is hidden */
  .auth-mobile-brand {
    display: none;
    font-family: 'Cormorant Garamond', serif;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.3em;
    color: #0e0e0e;
    text-align: center;
    margin-bottom: 36px;
    text-transform: uppercase;
  }

  .auth-eyebrow {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #b49a7a;
    margin-bottom: 10px;
  }
  .auth-heading {
    font-family: 'Cormorant Garamond', serif;
    font-size: 2.8rem;
    font-weight: 400;
    color: #0e0e0e;
    letter-spacing: -0.03em;
    line-height: 1;
    margin-bottom: 8px;
  }
  .auth-sub {
    font-size: 0.88rem;
    color: #8a8680;
    margin-bottom: 28px;
    font-weight: 300;
  }

  /* Error */
  .auth-error {
    display: flex;
    align-items: center;
    gap: 9px;
    background: #fff5f5;
    border: 1px solid #fecaca;
    border-radius: 10px;
    color: #b91c1c;
    font-size: 0.82rem;
    font-weight: 500;
    padding: 12px 14px;
    margin-bottom: 20px;
    animation: auth-shake 0.35s ease;
  }
  @keyframes auth-shake {
    0%,100% { transform: translateX(0); }
    20%     { transform: translateX(-4px); }
    40%     { transform: translateX(4px); }
    60%     { transform: translateX(-3px); }
    80%     { transform: translateX(3px); }
  }

  /* Google button */
  .auth-google-btn {
    width: 100%;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: #ffffff;
    border: 1.5px solid #e4e2de;
    border-radius: 12px;
    font-size: 0.88rem;
    font-weight: 600;
    color: #1a1a1a;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.01em;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.12s;
  }
  .auth-google-btn:hover:not(:disabled) {
    border-color: #c8c5c0;
    box-shadow: 0 4px 16px rgba(0,0,0,0.07);
    transform: translateY(-1px);
  }
  .auth-google-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
  .auth-google-btn:disabled { opacity: 0.60; cursor: not-allowed; }

  /* Divider */
  .auth-divider {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 20px 0;
    color: #c5c1bc;
    font-size: 0.74rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .auth-divider::before,
  .auth-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e8e5e1;
  }

  /* Fields */
  .auth-field { margin-bottom: 16px; }
  .auth-label {
    display: block;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: #6b6762;
    margin-bottom: 7px;
  }
  .auth-input {
    width: 100%;
    height: 50px;
    padding: 0 16px;
    border: 1.5px solid #e4e2de;
    border-radius: 12px;
    background: #ffffff;
    color: #1a1a1a;
    font-size: 0.9rem;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .auth-input:focus        { border-color: #1a1a1a; box-shadow: 0 0 0 3px rgba(26,26,26,0.07); }
  .auth-input::placeholder { color: #c0bdb9; }
  .auth-input:disabled     { opacity: 0.55; cursor: not-allowed; background: #f5f4f2; }

  .auth-pw-wrap { position: relative; }
  .auth-input-pw { padding-right: 48px; }
  .auth-pw-toggle {
    position: absolute;
    right: 14px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    color: #a09c98; cursor: pointer;
    display: flex; align-items: center;
    padding: 4px;
    line-height: 1;
    transition: color 0.15s;
  }
  .auth-pw-toggle:hover { color: #1a1a1a; }

  /* Strength meter */
  .auth-strength {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;
  }
  .auth-strength-bars { display: flex; gap: 4px; flex: 1; }
  .auth-strength-bar  { height: 3px; flex: 1; border-radius: 100px; }
  .auth-strength-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    min-width: 44px;
    text-align: right;
  }

  /* Terms – the visual checkbox span MUST be the immediate next sibling of the hidden input */
  .auth-terms-field { margin-bottom: 24px; }
  .auth-check-label {
    display: inline-flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    user-select: none;
  }
  .auth-check-input { display: none; }
  .auth-check-box {
    width: 18px; height: 18px; min-width: 18px;
    border: 1.5px solid #d4d1cc;
    border-radius: 5px;
    background: #fff;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, border-color 0.15s;
    position: relative;
    margin-top: 1px;
  }
  .auth-check-input:checked + .auth-check-box {
    background: #0e0e0e;
    border-color: #0e0e0e;
  }
  .auth-check-input:checked + .auth-check-box::after {
    content: '';
    width: 4px; height: 7px;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
    transform: rotate(42deg) translate(-1px,-1px);
  }
  .auth-check-text {
    font-size: 0.83rem;
    color: #6b6762;
    line-height: 1.5;
  }
  .auth-inline-link {
    color: #0e0e0e;
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-color: rgba(14,14,14,0.3);
    transition: text-decoration-color 0.15s;
  }
  .auth-inline-link:hover { text-decoration-color: #0e0e0e; }

  /* Submit */
  .auth-submit-btn {
    width: 100%;
    height: 52px;
    background: #0e0e0e;
    color: #fff;
    border: none;
    border-radius: 12px;
    font-size: 0.88rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: 'DM Sans', sans-serif;
    transition: background 0.2s, transform 0.12s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(14,14,14,0.20);
    margin-bottom: 20px;
  }
  .auth-submit-btn:hover:not(:disabled) {
    background: #2a2a2a;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(14,14,14,0.25);
  }
  .auth-submit-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
  .auth-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  /* Spinner */
  .auth-spinner {
    display: inline-block;
    width: 16px; height: 16px;
    border: 2px solid rgba(0,0,0,0.15);
    border-top-color: #1a1a1a;
    border-radius: 50%;
    animation: auth-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  .auth-spinner-white {
    border-color: rgba(255,255,255,0.25);
    border-top-color: #ffffff;
  }
  @keyframes auth-spin { to { transform: rotate(360deg); } }

  .auth-switch {
    text-align: center;
    font-size: 0.83rem;
    color: #8a8680;
    margin-bottom: 32px;
  }
  .auth-switch-link {
    color: #0e0e0e;
    font-weight: 600;
    text-decoration: none;
    border-bottom: 1px solid #0e0e0e;
    padding-bottom: 1px;
    transition: opacity 0.15s;
  }
  .auth-switch-link:hover { opacity: 0.6; }

  .auth-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 0.72rem;
    color: #b5b1ac;
  }
  .auth-footer a { color: inherit; text-decoration: none; transition: color 0.15s; }
  .auth-footer a:hover { color: #6b6762; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .auth-panel-left   { display: none; }
    .auth-mobile-brand { display: block; }
    .auth-form-side    { padding: 32px 20px; }
  }
  @media (max-width: 480px) {
    .auth-heading { font-size: 2.2rem; }
  }
`;
