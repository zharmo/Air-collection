'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaComments,
  FaRegStar,
  FaStar,
  FaTrash,
} from 'react-icons/fa';

interface Review {
  id: number;
  productName: string;
  user: string;
  rating: number;
  comment: string;
  approved: boolean;
  date: string;
}

const StatCard = ({
  label,
  value,
  icon,
  color,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  delay?: number;
}) => (
  <div className="rv-stat" style={{ animationDelay: `${delay}ms` }}>
    <div className="rv-stat-icon" style={{ background: `${color}18`, color }}>
      {icon}
    </div>
    <div>
      <p className="rv-stat-label">{label}</p>
      <p className="rv-stat-value">{value}</p>
    </div>
  </div>
);

const RatingStars = ({ rating }: { rating: number }) => (
  <span className="rv-stars" aria-label={`${rating} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, index) =>
      index < rating ? <FaStar key={index} /> : <FaRegStar key={index} />,
    )}
  </span>
);

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    setReviews([
      {
        id: 1,
        productName: 'Linen Lounge Shirt',
        user: 'elena@example.com',
        rating: 5,
        comment: 'Amazing quality!',
        approved: true,
        date: '2024-05-10',
      },
      {
        id: 2,
        productName: 'Tailored Wool Trouser',
        user: 'marcus@example.com',
        rating: 4,
        comment: 'Great fit.',
        approved: false,
        date: '2024-05-15',
      },
    ]);
  }, []);

  const stats = useMemo(() => {
    const approved = reviews.filter((review) => review.approved).length;
    const pending = reviews.length - approved;
    const averageRating = reviews.length
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
      : '0.0';

    return {
      total: reviews.length,
      approved,
      pending,
      averageRating,
    };
  }, [reviews]);

  const handleApprove = (id: number) => {
    setReviews((current) =>
      current.map((review) =>
        review.id === id ? { ...review, approved: true } : review,
      ),
    );
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete review?')) {
      setReviews((current) => current.filter((review) => review.id !== id));
    }
  };

  return (
    <>
      <style>{`
        @keyframes rvFadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .rv-shell {
          --rv-bg: #f8fafc;
          --rv-surface: #ffffff;
          --rv-border: #e2e8f0;
          --rv-text-1: #0f172a;
          --rv-text-2: #64748b;
          --rv-text-3: #94a3b8;
          --rv-accent: #4f46e5;
          font-family: Geist, "SF Pro Display", system-ui, sans-serif;
          color: var(--rv-text-1);
          background: var(--rv-bg);
          min-height: 100vh;
          padding-bottom: 48px;
        }

        .rv-topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 28px;
          animation: rvFadeSlideUp .4s both;
        }

        .rv-page-sub {
          font-size: .82rem;
          color: var(--rv-text-2);
          margin: 4px 0 0;
        }

        .rv-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .rv-stat {
          background: var(--rv-surface);
          border: 1px solid var(--rv-border);
          border-radius: 14px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 2px 16px rgba(0, 0, 0, .055);
          transition: box-shadow .2s, transform .2s;
          animation: rvFadeSlideUp .4s both;
        }

        .rv-stat:hover {
          box-shadow: 0 6px 24px rgba(0, 0, 0, .09);
          transform: translateY(-2px);
        }

        .rv-stat-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .rv-stat-label {
          font-size: .72rem;
          font-weight: 600;
          letter-spacing: .05em;
          text-transform: uppercase;
          color: var(--rv-text-2);
          margin: 0 0 3px;
        }

        .rv-stat-value {
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -.04em;
          color: var(--rv-text-1);
          margin: 0;
        }

        .rv-table-card {
          background: var(--rv-surface);
          border: 1px solid var(--rv-border);
          border-radius: 14px;
          overflow-x: auto;
          box-shadow: 0 2px 16px rgba(0, 0, 0, .055);
          animation: rvFadeSlideUp .4s .12s both;
        }

        .rv-table {
          width: 100%;
          border-collapse: collapse;
          font-size: .83rem;
        }

        .rv-table thead tr {
          border-bottom: 1px solid var(--rv-border);
          background: var(--rv-bg);
        }

        .rv-table th {
          padding: 12px 14px;
          font-size: .72rem;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          color: var(--rv-text-2);
          white-space: nowrap;
        }

        .rv-table tbody tr {
          border-bottom: 1px solid var(--rv-border);
          transition: background .1s;
          animation: rvFadeSlideUp .35s both;
        }

        .rv-table tbody tr:last-child {
          border-bottom: none;
        }

        .rv-table tbody tr:hover {
          background: rgba(79, 70, 229, .03);
        }

        .rv-table td {
          padding: 13px 14px;
          vertical-align: middle;
          color: var(--rv-text-1);
        }

        .rv-product {
          font-weight: 700;
          color: var(--rv-accent);
        }

        .rv-user {
          color: var(--rv-text-2);
          font-size: .78rem;
        }

        .rv-comment {
          max-width: 320px;
          color: var(--rv-text-2);
        }

        .rv-date {
          color: var(--rv-text-2);
          white-space: nowrap;
          font-size: .78rem;
        }

        .rv-stars {
          display: inline-flex;
          gap: 2px;
          color: #f59e0b;
          font-size: 13px;
        }

        .rv-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: .72rem;
          font-weight: 700;
          letter-spacing: .04em;
          padding: 3px 9px;
          border-radius: 100px;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .rv-badge.approved {
          background: #dcfce7;
          color: #15803d;
        }

        .rv-badge.pending {
          background: #fef3c7;
          color: #b45309;
        }

        .rv-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }

        .rv-action-btn {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid var(--rv-border);
          background: var(--rv-bg);
          color: var(--rv-text-2);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all .15s;
        }

        .rv-action-btn.approve:hover {
          border-color: #16a34a;
          color: #16a34a;
          background: rgba(22, 163, 74, .08);
        }

        .rv-action-btn.delete:hover {
          border-color: #ef4444;
          color: #dc2626;
          background: rgba(239, 68, 68, .08);
        }

        .rv-empty {
          text-align: center;
          padding: 3rem;
          color: var(--rv-text-3);
        }

        @media (max-width: 992px) {
          .rv-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .rv-shell {
            padding-bottom: 32px;
          }

          .rv-topbar {
            margin-bottom: 20px;
          }

          .rv-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="rv-shell">
        <div className="rv-topbar">
          <div>
            <h1>Review Management</h1>
            <p className="rv-page-sub">
              {stats.total} total reviews, {stats.pending} awaiting approval.
            </p>
          </div>
        </div>

        <div className="rv-stats">
          <StatCard
            label="Total Reviews"
            value={stats.total}
            icon={<FaComments size={18} />}
            color="#4f46e5"
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon={<FaCheckCircle size={18} />}
            color="#16a34a"
            delay={80}
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={<FaClock size={18} />}
            color="#f59e0b"
            delay={160}
          />
          <StatCard
            label="Average Rating"
            value={stats.averageRating}
            icon={<FaStar size={18} />}
            color="#f59e0b"
            delay={240}
          />
        </div>

        <div className="rv-table-card">
          <table className="rv-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>User</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="rv-empty">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                reviews.map((review, index) => (
                  <tr key={review.id} style={{ animationDelay: `${index * 45}ms` }}>
                    <td>
                      <span className="rv-product">{review.productName}</span>
                    </td>
                    <td>
                      <span className="rv-user">{review.user}</span>
                    </td>
                    <td>
                      <RatingStars rating={review.rating} />
                    </td>
                    <td>
                      <span className="rv-comment">{review.comment}</span>
                    </td>
                    <td>
                      <span className="rv-date">{review.date}</span>
                    </td>
                    <td>
                      <span className={`rv-badge ${review.approved ? 'approved' : 'pending'}`}>
                        {review.approved ? <FaCheckCircle size={10} /> : <FaClock size={10} />}
                        {review.approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="rv-actions">
                        {!review.approved && (
                          <button
                            className="rv-action-btn approve"
                            onClick={() => handleApprove(review.id)}
                            aria-label="Approve review"
                          >
                            <FaCheck size={12} />
                          </button>
                        )}
                        <button
                          className="rv-action-btn delete"
                          onClick={() => handleDelete(review.id)}
                          aria-label="Delete review"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
