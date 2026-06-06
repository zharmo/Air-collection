'use client';

import { useState } from 'react';
import { FaInstagram, FaPinterest, FaLinkedin } from 'react-icons/fa';
import axiosInstance from '@/utils/axiosConfig';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: 'General Inquiry',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await axiosInstance.post('/contact', formData);
      if (res.data.success) {
        setSuccess(true);
        setFormData({ fullName: '', email: '', subject: 'General Inquiry', message: '' });
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError('Failed to send message. Please try again later.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <h1 className="text-center fw-bold mb-2">AIR COLLECTION</h1>
              <h2 className="text-center fs-3 fw-semibold mb-3">CONTACT US</h2>
              <p className="text-center text-muted mb-5">
                We invite you to reach out with any inquiries. Our team is dedicated to providing an exceptional experience tailored to your unique needs.
              </p>

              {success && (
                <div className="alert alert-success text-center">Thank you! We will get back to you soon.</div>
              )}
              {error && (
                <div className="alert alert-danger text-center">{error}</div>
              )}

              <div className="row g-5">
                <div className="col-md-7">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="form-label fw-semibold">FULL NAME</label>
                      <input
                        type="text"
                        name="fullName"
                        className="form-control rounded-0 py-2"
                        placeholder="E.g. Julian Vaus"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-semibold">EMAIL ADDRESS</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control rounded-0 py-2"
                        placeholder="julian@example.co"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-semibold">SUBJECT</label>
                      <select
                        name="subject"
                        className="form-select rounded-0 py-2"
                        value={formData.subject}
                        onChange={handleChange}
                      >
                        <option>General Inquiry</option>
                        <option>Customer Support</option>
                        <option>Press / Media</option>
                        <option>Partnership</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-semibold">MESSAGE</label>
                      <textarea
                        name="message"
                        rows={4}
                        className="form-control rounded-0"
                        placeholder="How can we assist you today?"
                        value={formData.message}
                        onChange={handleChange}
                        required
                      ></textarea>
                    </div>
                    <button type="submit" className="btn btn-dark rounded-0 px-5 py-2" disabled={loading}>
                      {loading ? 'SENDING...' : 'SEND MESSAGE'}
                    </button>
                  </form>
                </div>

                <div className="col-md-5">
                  <div className="mb-4">
                    <h6 className="fw-bold mb-2">GENERAL INQUIRIES</h6>
                    <p className="text-muted mb-0">concierge@aircollection.com</p>
                  </div>
                  <div className="mb-4">
                    <h6 className="fw-bold mb-2">CUSTOMER SUPPORT</h6>
                    <p className="text-muted mb-0">support@aircollection.com</p>
                    <p className="text-muted">Monday — Friday: 9am — 6pm EST</p>
                  </div>
                  <div className="mb-4">
                    <h6 className="fw-bold mb-2">PRESS</h6>
                    <p className="text-muted mb-0">media@aircollection.com</p>
                  </div>
                  <div className="mt-5">
                    <h6 className="fw-bold mb-3">FOLLOW US</h6>
                    <div className="d-flex gap-3">
                      <a href="#" className="text-dark fs-3" aria-label="Instagram">
                        <FaInstagram />
                      </a>
                      <a href="#" className="text-dark fs-3" aria-label="Pinterest">
                        <FaPinterest />
                      </a>
                      <a href="#" className="text-dark fs-3" aria-label="LinkedIn">
                        <FaLinkedin />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}