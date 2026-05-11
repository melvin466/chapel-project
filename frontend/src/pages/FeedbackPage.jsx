import React, { useState } from 'react';
import api from '../services/api';

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    type: 'general',
    subject: '',
    message: '',
    rating: 5
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/feedback', { ...formData, rating: Number(formData.rating) });
      setSubmitted(true);
      setFormData({ type: 'general', subject: '', message: '', rating: 5 });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1 className="page-title">Feedback</h1>
      <div className="feedback-container">
        {submitted && <div className="success-message">Thank you for your feedback!</div>}
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="feedback-form">
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="general">General Feedback</option>
            <option value="suggestion">Suggestion</option>
            <option value="complaint">Complaint</option>
            <option value="website">Website</option>
          </select>
          
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            value={formData.subject}
            onChange={handleChange}
            required
          />
          
          <textarea
            name="message"
            placeholder="Your message..."
            rows="5"
            value={formData.message}
            onChange={handleChange}
            required
          />
          
          <div className="rating">
            <label>Rating:</label>
            <select name="rating" value={formData.rating} onChange={handleChange}>
              {[5,4,3,2,1].map(r => (
                <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackPage;
