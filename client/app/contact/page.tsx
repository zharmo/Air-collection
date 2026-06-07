'use client';

import { useState } from 'react';
import { FaInstagram, FaPinterest, FaLinkedin, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';
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
    <>
      <style>{`
        /* Import elegant fonts */
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500;600&display=swap');

        .contact-page {
          --ink: #0a0a0a;
          --ink-soft: #4a4a4a;
          --ink-light: #8a8a8a;
          --accent: #c8a96e;
          --accent-light: #f5efe6;
          --surface: #ffffff;
          --surface-muted: #fafaf7;
          --border: rgba(0,0,0,0.08);
        }

        .contact-hero {
          background: linear-gradient(120deg, #fdfbf8 0%, #f4f1ea 100%);
          border-bottom: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }
        .contact-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 30% 40%, rgba(200,169,110,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .contact-card {
          backdrop-filter: blur(4px);
          background: rgba(255,255,255,0.96);
          border: none;
          border-radius: 32px;
          box-shadow: 0 25px 45px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .contact-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 32px 48px -16px rgba(0,0,0,0.15);
        }
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          font-family: 'Jost', sans-serif;
          font-weight: 300;
          border: 1.5px solid #e2e2e0;
          border-radius: 20px;
          background: #fff;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          outline: none;
        }
        .form-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(200,169,110,0.2);
        }
        .form-label {
          font-family: 'Jost', sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-soft);
          margin-bottom: 0.5rem;
          display: block;
        }
        .btn-send {
          background: var(--ink);
          color: white;
          border: none;
          border-radius: 40px;
          padding: 0.9rem 2rem;
          font-family: 'Jost', sans-serif;
          font-weight: 600;
          letter-spacing: 0.05em;
          transition: all 0.25s ease;
          width: 100%;
          font-size: 0.9rem;
        }

        .contact-page {
          font-family: 'Jost', sans-serif;
          font-weight: 300;
        }

        .contact-page .lead,
        .contact-page .text-muted,
        .contact-page a,
        .contact-page p {
          font-family: 'Jost', sans-serif;
        }
        .btn-send:hover:not(:disabled) {
          background: #2a2a2a;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .btn-send:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .info-card {
          background: var(--surface-muted);
          border-radius: 24px;
          padding: 1.5rem;
          transition: all 0.2s ease;
          border: 1px solid var(--border);
        }
        .info-card:hover {
          background: white;
          border-color: var(--accent-light);
        }
        .social-icon {
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .social-icon:hover {
          transform: translateY(-3px);
          color: var(--accent) !important;
        }
        @media (max-width: 768px) {
          .contact-card {
            border-radius: 24px;
          }
          .form-input {
            border-radius: 16px;
          }
        }
      `}</style>

      <div className="contact-page">
        {/* Hero with decorative gradient */}
        <div className="contact-hero py-5">
          <div className="container py-4">
            <div className="text-center">
              <div className="mb-3">
                <span className="badge bg-light text-dark rounded-pill px-3 py-2" style={{ letterSpacing: '0.2em', fontWeight: 500, fontSize: '0.7rem' }}>
                  GET IN TOUCH
                </span>
              </div>
              <h1 className="display-4 fw-semibold" style={{ fontFamily: 'Cormorant Garamond, serif', letterSpacing: '-0.02em', color: '#0a0a0a' }}>
                We'd love to hear from you
              </h1>
              <p className="lead text-muted mx-auto" style={{ maxWidth: '600px', fontSize: '1.1rem' }}>
                Whether you have a question about our pieces, need styling advice, or just want to say hello – our team is here for you.
              </p>
            </div>
          </div>
        </div>

        <div className="container py-5 my-3">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="contact-card p-4 p-md-5">
                <div className="row g-5">
                  {/* Left column: Form */}
                  <div className="col-md-7">
                    <div className="mb-4">
                      <h2 className="h4 fw-semibold mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                        Send a message
                      </h2>
                      <p className="text-muted small">We'll reply within 24 hours</p>
                    </div>

                    {success && (
                      <div className="alert alert-success alert-dismissible fade show rounded-4" role="alert">
                        <strong>Thank you!</strong> Your message has been sent. We'll get back to you soon.
                        <button type="button" className="btn-close" onClick={() => setSuccess(false)}></button>
                      </div>
                    )}
                    {error && (
                      <div className="alert alert-danger alert-dismissible fade show rounded-4" role="alert">
                        <strong>Oops!</strong> {error}
                        <button type="button" className="btn-close" onClick={() => setError('')}></button>
                      </div>
                    )}

                    <form onSubmit={handleSubmit}>
                      <div className="mb-4">
                        <label className="form-label">Full name</label>
                        <input
                          type="text"
                          name="fullName"
                          className="form-input"
                          placeholder="E.g. Julian Vaus"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label">Email address</label>
                        <input
                          type="email"
                          name="email"
                          className="form-input"
                          placeholder="julian@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label">Subject</label>
                        <select
                          name="subject"
                          className="form-input"
                          value={formData.subject}
                          onChange={handleChange}
                          style={{ appearance: 'none', backgroundImage: 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>\')', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                        >
                          <option>General Inquiry</option>
                          <option>Customer Support</option>
                          <option>Press / Media</option>
                          <option>Partnership</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="form-label">Message</label>
                        <textarea
                          name="message"
                          rows={5}
                          className="form-input"
                          placeholder="How can we assist you today?"
                          value={formData.message}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <button type="submit" className="btn-send" disabled={loading}>
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                          </>
                        ) : (
                          'Send message'
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Right column: Contact info */}
                  <div className="col-md-5">
                    <div className="mb-4">
                      <h3 className="h5 fw-semibold mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Reach us directly</h3>
                      <div className="info-card mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-white rounded-circle p-2" style={{ color: 'var(--accent)' }}>
                            <FaEnvelope size={20} />
                          </div>
                          <div>
                            <div className="small text-muted">General Inquiries</div>
                            <a href="mailto:concierge@aircollection.com" className="text-dark text-decoration-none">concierge@aircollection.com</a>
                          </div>
                        </div>
                      </div>
                      <div className="info-card mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-white rounded-circle p-2" style={{ color: 'var(--accent)' }}>
                            <FaPhoneAlt size={18} />
                          </div>
                          <div>
                            <div className="small text-muted">Customer Support</div>
                            <a href="tel:+1234567890" className="text-dark text-decoration-none">+1 234 567 890</a>
                            <div className="small text-muted">Mon – Fri, 9am – 6pm EST</div>
                          </div>
                        </div>
                      </div>
                      <div className="info-card mb-4">
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-white rounded-circle p-2" style={{ color: 'var(--accent)' }}>
                            <FaMapMarkerAlt size={18} />
                          </div>
                          <div>
                            <div className="small text-muted">Press & Media</div>
                            <a href="mailto:media@aircollection.com" className="text-dark text-decoration-none">media@aircollection.com</a>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-2">
                      <h3 className="h5 fw-semibold mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Follow the journey</h3>
                      <div className="d-flex gap-4">
                        <a href="#" className="text-dark fs-4 social-icon" style={{ transition: 'all 0.2s' }} aria-label="Instagram">
                          <FaInstagram />
                        </a>
                        <a href="#" className="text-dark fs-4 social-icon" aria-label="Pinterest">
                          <FaPinterest />
                        </a>
                        <a href="#" className="text-dark fs-4 social-icon" aria-label="LinkedIn">
                          <FaLinkedin />
                        </a>
                      </div>
                      <p className="text-muted small mt-4 mb-0">We share daily inspiration, behind‑the‑scenes, and new collections.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
