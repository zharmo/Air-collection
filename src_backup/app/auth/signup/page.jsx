'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaGoogle } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    const result = await register(name, email, password);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.message || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogleSignup = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <h1 className="text-center fw-bold mb-1">AIR COLLECTION</h1>
              <h2 className="text-center fs-5 mb-3">Join Air Collection</h2>
              <p className="text-center text-muted mb-4">Create an account to start your curated journey.</p>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">FULL NAME</label>
                  <input
                    type="text"
                    className="form-control form-control-lg rounded-0"
                    id="name"
                    placeholder="Evelyn Thorne"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    className="form-control form-control-lg rounded-0"
                    id="email"
                    placeholder="evelyn@example.com"
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
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-check mb-4">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="terms">
                    I agree to the <Link href="/terms" className="text-decoration-none">Terms of Service</Link> and <Link href="/privacy" className="text-decoration-none">Privacy Policy</Link>.
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-dark btn-lg w-100 rounded-0 mb-3"
                  disabled={loading}
                >
                  {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                </button>
              </form>

              <div className="text-center position-relative my-4">
                <hr />
                <span className="px-3 bg-white position-relative" style={{ top: '-12px' }}>OR</span>
              </div>

              <button
                onClick={handleGoogleSignup}
                className="btn btn-outline-dark btn-lg w-100 rounded-0 d-flex align-items-center justify-content-center gap-2"
              >
                <FaGoogle /> CONTINUE WITH GOOGLE
              </button>

              <p className="text-center mt-4 mb-0">
                ALREADY HAVE AN ACCOUNT? <Link href="/auth/signin" className="text-decoration-none">SIGN IN</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer links as shown in design */}
      <div className="text-center mt-5 pt-4 border-top">
        <div className="d-flex flex-wrap justify-content-center gap-3 mb-2">
          <Link href="/privacy" className="text-decoration-none text-muted small">Privacy Policy</Link>
          <Link href="/terms" className="text-decoration-none text-muted small">Terms of Service</Link>
          <Link href="/help" className="text-decoration-none text-muted small">Help Center</Link>
        </div>
        <p className="text-muted small mb-0">© 2024 Air Collection. All rights reserved.</p>
      </div>
    </div>
  );
}