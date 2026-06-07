'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaEnvelope, FaSave, FaEdit } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/utils/axiosConfig';

const accountTypographyStyles = `
    .account-page {
        font-family: 'Jost', sans-serif;
        font-weight: 300;
        color: #0a0a0a;
    }

    .account-page h1,
    .account-page h2 {
        font-family: 'Cormorant Garamond', serif;
        font-size: clamp(38px, 5vw, 58px);
        font-weight: 500 !important;
        letter-spacing: -0.01em;
        line-height: 1;
    }

    .account-page h3,
    .account-page h5,
    .account-page h6 {
        font-family: 'Jost', sans-serif;
        font-weight: 600 !important;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    .account-page .form-label {
        font-family: 'Jost', sans-serif;
        font-size: 11px;
        font-weight: 500 !important;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #6b6b6b;
    }

    .account-page .form-control,
    .account-page .input-group-text,
    .account-page p,
    .account-page span,
    .account-page .small {
        font-family: 'Jost', sans-serif;
    }

    .account-page .form-control {
        font-size: 14px;
        font-weight: 300;
    }

    .account-page .btn {
        font-family: 'Jost', sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.16em;
        text-transform: uppercase;
    }

    .account-page .fw-bold,
    .account-page .fw-semibold,
    .account-page .fw-medium {
        font-weight: 500 !important;
    }
`;

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({ name: user.name || '', email: user.email || '' });
        } else {
            router.push('/auth/signin');
        }
    }, [user, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await axiosInstance.put('/users/profile', formData);
            setMessage('Profile updated successfully');
            setIsEditing(false);
            // Refresh user in context (optional: you can update local storage)
            localStorage.setItem('user', JSON.stringify({ ...user, ...formData }));
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="container py-5 account-page">
            <style>{accountTypographyStyles}</style>
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4 p-md-5">
                            <div className="text-center mb-4">
                                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '100px', height: '100px' }}>
                                    <FaUser size={40} className="text-muted" />
                                </div>
                                <h1 className="fw-bold">My Profile</h1>
                                <p className="text-muted">Manage your account information</p>
                            </div>

                            {message && (
                                <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'} alert-dismissible`}>
                                    {message}
                                    <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Full Name</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white"><FaUser /></span>
                                        <input
                                            type="text"
                                            name="name"
                                            className="form-control rounded-0"
                                            value={formData.name}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Email Address</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white"><FaEnvelope /></span>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control rounded-0"
                                            value={formData.email}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="d-flex gap-3 mt-4">
                                    {!isEditing ? (
                                        <button type="button" className="btn btn-dark rounded-0 px-4" onClick={() => setIsEditing(true)}>
                                            <FaEdit className="me-2" /> Edit Profile
                                        </button>
                                    ) : (
                                        <>
                                            <button type="submit" className="btn btn-dark rounded-0 px-4" disabled={loading}>
                                                <FaSave className="me-2" /> {loading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button type="button" className="btn btn-outline-secondary rounded-0 px-4" onClick={() => { setIsEditing(false); setFormData({ name: user.name, email: user.email }); }}>
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                </div>
                            </form>

                            <hr className="my-4" />

                            <div className="text-center">
                                <button className="btn btn-outline-danger rounded-0" onClick={logout}>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
