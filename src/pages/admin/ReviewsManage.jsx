import { BASE_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { Check, X, Trash2 } from 'lucide-react';
import './ReviewsManage.css';

const ReviewsManage = () => {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/reviews`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${BASE_URL}/admin/reviews/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchReviews();
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  if (isLoading) return <div style={{ padding: '24px' }}>Loading reviews...</div>;

  return (
    <div className="reviews-manage-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Customer Reviews</h2>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No reviews found</td></tr>
            ) : reviews.map(r => (
              <tr key={r.id}>
                <td data-label="ID">#{r.id}</td>
                <td data-label="Product">{r.product_name}</td>
                <td data-label="Customer">
                  <div>
                    <div style={{ fontWeight: 500 }}>{r.display_name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{r.email}</div>
                  </div>
                </td>
                <td data-label="Rating">
                  {'⭐'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </td>
                <td style={{ maxWidth: '300px' }} data-label="Review">
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px' }}>{r.title}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#444', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.content}
                    </p>
                  </div>
                </td>
                <td data-label="Status">
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                    backgroundColor: r.status === 'approved' ? '#dcfce7' : r.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                    color: r.status === 'approved' ? '#166534' : r.status === 'rejected' ? '#991b1b' : '#92400e'
                  }}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
                <td className="action-cell" data-label="Actions">
                  <div style={{ display: 'flex', gap: '8px', flexDirection: 'row', justifyContent: 'flex-end' }}>
                    {r.status !== 'approved' && (
                      <button 
                        onClick={() => handleUpdateStatus(r.id, 'approved')}
                        className="btn-icon btn-approve"
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button 
                        onClick={() => handleUpdateStatus(r.id, 'rejected')}
                        className="btn-icon btn-reject"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default ReviewsManage;
