import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import eventService from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${path}`;
};

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({
    subject: '',
    message: '',
    rating: 5,
    isAnonymous: false
  });
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventById(id);
      setEvent(response.data.event);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load event.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setRegistering(true);
      await eventService.registerForEvent(id);
      setMessage('Successfully registered.');
      setError('');
      loadEvent();
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    try {
      setCancelling(true);
      await eventService.cancelRegistration(id);
      setMessage('Registration cancelled.');
      setError('');
      loadEvent();
    } catch (error) {
      setError(error.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  const handleFeedbackChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFeedback((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      setFeedbackSubmitting(true);
      await eventService.addEventFeedback(id, {
        ...feedback,
        rating: Number(feedback.rating)
      });
      setMessage('Thank you for your feedback.');
      setError('');
      setFeedback({ subject: '', message: '', rating: 5, isAnonymous: false });
    } catch (error) {
      setError(error.response?.data?.message || 'Feedback submission failed');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const isRegistered = () => {
    return event?.attendees?.some((attendee) => attendee.toString() === user?._id);
  };

  if (loading) return <div className="loading">Loading event details...</div>;
  if (!event) return <div className="container"><p>Event not found</p></div>;

  return (
    <div className="container">
      <div className="event-detail">
        <h1>{event.title}</h1>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        {event.featuredImage && (
          <img src={getMediaUrl(event.featuredImage)} alt={event.title} className="event-media-image" />
        )}
        {event.eventVideo && (
          <video src={getMediaUrl(event.eventVideo)} controls className="event-media-video" />
        )}
        <div className="event-meta">
          <p>Date: {new Date(event.startDate).toLocaleDateString()}</p>
          <p>Time: {event.startTime} - {event.endTime}</p>
          <p>Location: {event.location}</p>
        </div>

        <div className="event-description">
          <h3>About This Event</h3>
          <p>{event.description}</p>
        </div>

        {event.speakers?.length > 0 && (
          <div className="speakers">
            <h3>Speakers</h3>
            {event.speakers.map((speaker, i) => (
              <div key={i} className="speaker">
                <strong>{speaker.name}</strong> - {speaker.title}
              </div>
            ))}
          </div>
        )}

        {event.registrationRequired && event.status === 'published' && (
          <div className="registration-box">
            <h3>Registration</h3>
            <p>Capacity: {event.registeredCount} / {event.capacity || 'Unlimited'}</p>
            {event.registrationDeadline && <p>Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}</p>}
            {isRegistered() ? (
              <div className="registration-actions">
                <p className="registered">You are registered for this event</p>
                <button onClick={handleCancelRegistration} disabled={cancelling} className="btn-secondary">
                  {cancelling ? 'Cancelling...' : 'Cancel Registration'}
                </button>
              </div>
            ) : (
              <button onClick={handleRegister} disabled={registering} className="btn-primary">
                {registering ? 'Registering...' : 'Register Now'}
              </button>
            )}
          </div>
        )}

        {isAuthenticated && (
          <div className="event-feedback-box">
            <h3>Event Feedback</h3>
            <form onSubmit={handleFeedbackSubmit}>
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={feedback.subject}
                onChange={handleFeedbackChange}
                required
              />
              <textarea
                name="message"
                placeholder="Share your feedback"
                rows="4"
                value={feedback.message}
                onChange={handleFeedbackChange}
                required
              />
              <div className="feedback-row">
                <select name="rating" value={feedback.rating} onChange={handleFeedbackChange}>
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Okay</option>
                  <option value="2">2 - Poor</option>
                  <option value="1">1 - Very poor</option>
                </select>
                <label className="checkbox-label">
                  <input type="checkbox" name="isAnonymous" checked={feedback.isAnonymous} onChange={handleFeedbackChange} />
                  Anonymous
                </label>
              </div>
              <button type="submit" disabled={feedbackSubmitting} className="btn-primary">
                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        )}

        <button onClick={() => navigate('/events')} className="btn-secondary">Back to Events</button>
      </div>
      <style>{`
        .event-media-image, .event-media-video {
          width: 100%;
          max-height: 420px;
          object-fit: cover;
          border-radius: 12px;
          margin: 1rem 0;
          background: #111;
        }
        .registration-actions {
          display: grid;
          gap: 0.75rem;
        }
        .event-feedback-box {
          margin: 1.5rem 0;
          padding: 1.25rem;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
        }
        .event-feedback-box form {
          display: grid;
          gap: 0.75rem;
        }
        .event-feedback-box input,
        .event-feedback-box textarea,
        .event-feedback-box select {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
        }
        .feedback-row {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }
        .feedback-row select {
          flex: 1;
          min-width: 220px;
        }
      `}</style>
    </div>
  );
};

export default EventDetailPage;
