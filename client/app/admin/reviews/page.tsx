'use client';

import { useState, useEffect } from 'react';
import { FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

interface Review {
  id: number;
  productName: string;
  user: string;
  rating: number;
  comment: string;
  approved: boolean;
  date: string;
}

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    setReviews([
      { id: 1, productName: 'Linen Lounge Shirt', user: 'elena@example.com', rating: 5, comment: 'Amazing quality!', approved: true, date: '2024-05-10' },
      { id: 2, productName: 'Tailored Wool Trouser', user: 'marcus@example.com', rating: 4, comment: 'Great fit.', approved: false, date: '2024-05-15' },
    ]);
  }, []);

  const handleApprove = (id: number) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, approved: true } : r));
  };
  const handleDelete = (id: number) => {
    if (confirm('Delete review?')) setReviews(reviews.filter(r => r.id !== id));
  };

  return (
    <div>
      <h1 className="fw-bold mb-4">Review Management</h1>
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead><tr><th>Product</th><th>User</th><th>Rating</th><th>Comment</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{reviews.map(review => (<tr key={review.id}><td>{review.productName}</td><td>{review.user}</td><td>{'⭐'.repeat(review.rating)}</td><td>{review.comment.substring(0, 50)}...</td><td>{review.approved ? <span className="badge bg-success">Approved</span> : <span className="badge bg-warning">Pending</span>}</td><td>{!review.approved && <button className="btn btn-sm btn-success me-2" onClick={() => handleApprove(review.id)}><FaCheck /></button>}<button className="btn btn-sm btn-danger" onClick={() => handleDelete(review.id)}><FaTrash /></button></td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}