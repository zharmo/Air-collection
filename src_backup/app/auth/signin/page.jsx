'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      router.push('/');
    } else {
      setError(result.message || 'Invalid email or password');
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google OAuth route (to be implemented)
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <h1 className="text-center fw-bold mb-1">AIR COLLECTION</h1>
              <p className="text-center text-muted mb-4">Welcome back</p>
              <p className="text-center mb-4">Log in to access your curated collection.</p>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    className="form-control form-control-lg rounded-0"
                    id="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">PASSWORD</label>
                  <input
                    type="password"
                    className="form-control form-control-lg rounded-0"
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="remember">Remember me</label>
                  </div>
                  <Link href="/auth/forgot-password" className="text-decoration-none">Forgot password?</Link>
                </div>

                <button
                  type="submit"
                  className="btn btn-dark btn-lg w-100 rounded-0 mb-3"
                  disabled={loading}
                >
                  {loading ? 'SIGNING IN...' : 'SIGN IN'}
                </button>
              </form>

              <div className="text-center position-relative my-4">
                <hr />
                <span className="px-3 bg-white position-relative" style={{ top: '-12px' }}>OR</span>
              </div>

              <button
                onClick={handleGoogleLogin}
                className="btn btn-outline-dark btn-lg w-100 rounded-0 d-flex align-items-center justify-content-center gap-2"
              >
                <FaGoogle /> CONTINUE WITH GOOGLE
              </button>

              <p className="text-center mt-4 mb-0">
                Don't have an account? <Link href="/auth/signup" className="text-decoration-none">Create one</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}