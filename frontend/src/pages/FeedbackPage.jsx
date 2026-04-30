import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const FeedbackPage = () => {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    type: 'general',
    subject: '',
    message: '',
    rating: 5
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // API call here
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="container">
      <h1 className="page-title">Feedback</h1>
      <div className="feedback-container">
        {submitted && <div className="success-message">Thank you for your feedback!</div>}
        
        <form onSubmit={handleSubmit} className="feedback-form">
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="general">General Feedback</option>
            <option value="suggestion">Suggestion</option>
            <option value="complaint">Complaint</option>
            <option value="praise">Praise</option>
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
          
          <button type="submit" className="btn-primary">Submit Feedback</button>
        </form>
      </div>
      
      <style jsx>{`
        .feedback-container {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(255,255,255,0.95);
          padding: 2rem;
          border-radius: 12px;
        }
        .feedback-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .feedback-form input,
        .feedback-form textarea,
        .feedback-form select {
          padding: 0.8rem;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default FeedbackPage;