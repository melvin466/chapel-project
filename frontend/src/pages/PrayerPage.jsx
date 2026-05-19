import React, { useState, useEffect } from 'react';
import prayerService from '../services/prayerService';

const PrayerPage = () => {
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    urgency: 'normal',
    isAnonymous: false
  });

  useEffect(() => {
    loadPrayerRequests();
  }, []);

  const loadPrayerRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await prayerService.getPrayerRequests({ limit: 50 });
      setPrayerRequests(response.data?.prayerRequests || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load prayer requests.');
    } finally {
      setLoading(false);
    }
  };

  const handlePray = async (id) => {
    try {
      await prayerService.prayForRequest(id);
      setMessage('Prayer recorded.');
      setError(null);
      loadPrayerRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to record prayer.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await prayerService.createPrayerRequest(formData);
      setMessage('Prayer request submitted.');
      setFormData({ title: '', description: '', category: 'personal', urgency: 'normal', isAnonymous: false });
      await loadPrayerRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit prayer request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container prayer-page">
      <h1 className="page-title">Prayer Requests</h1>
      {message && <div className="success-message">{message}</div>}
      <div className="two-columns prayer-layout">
        <div className="form-card">
          <h2>Share a Request</h2>
          <form onSubmit={handleSubmit}>
            <input name="title" placeholder="Prayer title" value={formData.title} onChange={handleChange} required />
            <textarea name="description" placeholder="What should we pray for?" rows="5" value={formData.description} onChange={handleChange} required />
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="personal">Personal</option>
              <option value="family">Family</option>
              <option value="health">Health</option>
              <option value="academic">Academic</option>
              <option value="financial">Financial</option>
              <option value="spiritual">Spiritual</option>
              <option value="other">Other</option>
            </select>
            <select name="urgency" value={formData.urgency} onChange={handleChange}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
            <label className="checkbox-label">
              <input type="checkbox" name="isAnonymous" checked={formData.isAnonymous} onChange={handleChange} />
              Post anonymously
            </label>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
        <div className="elegant-list">
      {loading && <p>Loading prayer requests...</p>}
      {error && <p className="error-message">{error}</p>}
      {prayerRequests.length > 0 ? (
        prayerRequests.map(request => (
          <div key={request._id} className="prayer-item">
            <h2>{request.title}</h2>
            <p>{request.description}</p>
            <p>
              <strong>Category:</strong> {request.category} | <strong>Urgency:</strong> {request.urgency}
            </p>
            {request.status === 'answered' && request.adminResponse && (
              <div className="prayer-answer">
                <strong>Admin response</strong>
                <p>{request.adminResponse}</p>
              </div>
            )}
            <button onClick={() => handlePray(request._id)}>
              Pray ({request.prayerCount || 0})
            </button>
          </div>
        ))
      ) : (
        !loading && <p>No prayer requests available at the moment.</p>
      )}
        </div>
      </div>
    </div>
  );
};

export default PrayerPage;
