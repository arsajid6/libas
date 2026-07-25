import { BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import './CustomerReviews.css';

const CustomerReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [isWriting, setIsWriting] = useState(false);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${BASE_URL}/public/reviews/${productId}`);
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const res = await fetch(`${BASE_URL}/public/reviews/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, title, content, display_name: displayName, email })
      });
      
      const data = await res.json();
      if (res.ok) {
        setSubmitMessage('Review submitted successfully and is pending approval.');
        setIsWriting(false);
        // Reset form
        setRating(5);
        setTitle('');
        setContent('');
        setDisplayName('');
        setEmail('');
      } else {
        setSubmitMessage(data.error || 'Failed to submit review.');
      }
    } catch (err) {
      setSubmitMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(2)
    : 0;

  const getCountByRating = (star) => {
    return reviews.filter(r => r.rating === star).length;
  };

  const StarRating = ({ ratingValue }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= ratingValue ? 'star-filled' : 'star-empty'}>★</span>
        ))}
      </div>
    );
  };

  return (
    <div className="customer-reviews-section">
      <h2 className="cr-heading">Customer Reviews</h2>
      
      <div className="cr-summary-block">
        <div className="cr-average">
          <StarRating ratingValue={Math.round(avgRating)} />
          <div className="cr-avg-text">
            {avgRating} out of 5
          </div>
          <div className="cr-based-on">
            Based on {totalReviews} reviews <span className="verified-badge">✔</span>
          </div>
        </div>
        
        <div className="cr-bars">
          {[5, 4, 3, 2, 1].map(star => {
            const count = getCountByRating(star);
            const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="cr-bar-row">
                <div className="cr-bar-stars">
                  {'★'.repeat(star)}{'☆'.repeat(5-star)}
                </div>
                <div className="cr-bar-bg">
                  <div className="cr-bar-fill" style={{ width: `${percent}%` }}></div>
                </div>
                <div className="cr-bar-count">{count}</div>
              </div>
            );
          })}
        </div>
        
        <div className="cr-actions">
          <button 
            className="cr-write-btn"
            onClick={() => setIsWriting(!isWriting)}
          >
            {isWriting ? 'Cancel review' : 'Write a review'}
          </button>
        </div>
      </div>

      {submitMessage && (
        <div className="cr-submit-message">
          {submitMessage}
        </div>
      )}

      {isWriting && (
        <div className="cr-form-container">
          <h3>Write a review</h3>
          <form onSubmit={handleSubmit} className="cr-form">
            
            <div className="form-group cr-rating-selector">
              <label>Rating</label>
              <div className="star-selector">
                {[1, 2, 3, 4, 5].map(star => (
                  <span 
                    key={star} 
                    className={star <= rating ? 'star-filled' : 'star-empty'}
                    onClick={() => setRating(star)}
                    style={{ cursor: 'pointer', fontSize: '24px' }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Review Title</label>
              <input 
                type="text" 
                placeholder="Give your review a title" 
                required 
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Review content</label>
              <textarea 
                placeholder="Start writing here..." 
                rows="4" 
                required
                value={content}
                onChange={e => setContent(e.target.value)}
              ></textarea>
            </div>

            <div className="form-group">
              <label>Display name (displayed publicly)</label>
              <input 
                type="text" 
                placeholder="Display name" 
                required 
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email address</label>
              <input 
                type="email" 
                placeholder="Your email address" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="cr-form-footer">
              <p className="cr-disclaimer">
                How we use your data: We'll only contact you about the review you left, and only if necessary. By submitting your review, you agree to our terms and privacy policies.
              </p>
              <div className="cr-form-actions">
                <button type="button" className="cr-cancel-btn" onClick={() => setIsWriting(false)}>Cancel review</button>
                <button type="submit" className="cr-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Review List */}
      <div className="cr-review-list">
        {reviews.map(review => (
          <div key={review.id} className="cr-review-item">
            <div className="cr-review-header">
              <StarRating ratingValue={review.rating} />
              <div className="cr-review-date">{new Date(review.created_at).toLocaleDateString()}</div>
            </div>
            <h4 className="cr-review-title">{review.title}</h4>
            <div className="cr-reviewer-name">
              <strong>{review.display_name}</strong> <span className="verified-badge">✔</span> Verified Buyer
            </div>
            <p className="cr-review-content">{review.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomerReviews;
