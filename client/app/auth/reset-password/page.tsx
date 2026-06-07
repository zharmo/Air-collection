'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const token = searchParams.get('token');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    try {
      const res = await axiosInstance.post('/auth/reset-password', { token, newPassword: password });
      setMessage(res.data.message);
      setTimeout(() => router.push('/auth/signin'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed');
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <h2 className="text-center">Reset Password</h2>
              {message && <div className="alert alert-success">{message}</div>}
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <input type="password" className="form-control mb-3" placeholder="New Password" value={password} onChange={e => setPassword(e.target.value)} required />
                <input type="password" className="form-control mb-3" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                <button type="submit" className="btn btn-dark w-100 rounded-0">Reset Password</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
