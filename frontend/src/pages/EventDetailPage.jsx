import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import eventService from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { getMediaUrl } from '../utils/media';

const eventFallbackImage = 'https://images.pexels.com/photos/267559/pexels-photo-267559.jpeg?auto=compress&cs=tinysrgb&w=1600';

const prettyType = (value = 'event') => value.replace(/_/g, ' ');

const formatDate = (dateString) => {
  if (!dateString) return 'Date to be announced';
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
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
    isAnonymous: false,
  });

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEventById(id);
      setEvent(response.data.event);
      setError('');
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Failed to load event.');
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
    } catch (registerError) {
      setError(registerError.response?.data?.message || 'Registration failed');
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
    } catch (cancelError) {
      setError(cancelError.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  const handleFeedbackChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFeedback((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      setFeedbackSubmitting(true);
      await eventService.addEventFeedback(id, {
        ...feedback,
        rating: Number(feedback.rating),
      });
      setMessage('Thank you for your feedback.');
      setError('');
      setFeedback({ subject: '', message: '', rating: 5, isAnonymous: false });
    } catch (feedbackError) {
      setError(feedbackError.response?.data?.message || 'Feedback submission failed');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const isRegistered = () => (
    event?.attendees?.some((attendee) => attendee.toString() === user?._id)
  );

  if (loading) return <div className="loading">Loading event details...</div>;
  if (!event) return <div className="container"><p className="member-empty">Event not found.</p></div>;

  const imageUrl = event.featuredImage ? getMediaUrl(event.featuredImage) : eventFallbackImage;

  return (
    <div className="container event-detail-page">
      <button onClick={() => navigate('/events')} className="btn-secondary" style={{ marginBottom: '1rem' }}>
        Back to Events
      </button>

      <article className="event-detail-rich">
        <section className="event-detail-hero">
          <img src={imageUrl} alt="" />
          <div className="event-detail-overlay">
            <span>{prettyType(event.type)}</span>
            <h1>{event.title}</h1>
            <p>{event.description}</p>
          </div>
        </section>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="event-detail-layout">
          <section className="event-main-panel">
            {event.eventVideo && (
              <div className="event-media-panel">
                <h2>Event Video</h2>
                <video src={getMediaUrl(event.eventVideo)} controls preload="metadata" />
              </div>
            )}

            <div className="event-story-panel">
              <span>About this gathering</span>
              <h2>Come ready to participate, connect, and be encouraged.</h2>
              <p>{event.description}</p>
            </div>

            {event.speakers?.length > 0 && (
              <div className="event-speakers-panel">
                <span>Speakers</span>
                <div className="event-speaker-grid">
                  {event.speakers.map((speaker) => (
                    <div key={`${speaker.name}-${speaker.title}`} className="event-speaker-card">
                      <strong>{speaker.name}</strong>
                      <span>{speaker.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isAuthenticated && (
              <div className="event-feedback-box">
                <span>After the event</span>
                <h2>Share Feedback</h2>
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
          </section>

          <aside className="event-side-panel">
            <div className="event-detail-card">
              <span>When</span>
              <strong>{formatDate(event.startDate)}</strong>
              <p>{event.startTime || 'Time to be announced'} - {event.endTime || 'End time to be announced'}</p>
            </div>
            <div className="event-detail-card">
              <span>Where</span>
              <strong>{event.location || 'Location to be announced'}</strong>
              {event.venue?.address && <p>{event.venue.address}</p>}
            </div>
            {event.registrationRequired && event.status === 'published' && (
              <div className="registration-box event-registration-card">
                <span>Registration</span>
                <strong>{event.registeredCount || 0} / {event.capacity || 'Unlimited'}</strong>
                {event.registrationDeadline && <p>Deadline: {formatDate(event.registrationDeadline)}</p>}
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
          </aside>
        </div>
      </article>

      <style>{`
        .event-detail-page { padding-bottom: 3rem; }
        .event-detail-rich {
          background: var(--glass-panel);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 8px;
          padding: 1.1rem;
          box-shadow: var(--shadow-deep);
          backdrop-filter: blur(22px) saturate(130%);
        }
        .event-detail-hero {
          height: 300px;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        .event-detail-hero img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }
        .event-detail-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(10,16,21,0.92), rgba(10,16,21,0.58), rgba(10,16,21,0.2));
        }
        .event-detail-overlay {
          position: absolute;
          inset: auto 1.3rem 1.3rem;
          z-index: 1;
          color: white;
        }
        .event-detail-overlay span,
        .event-story-panel span,
        .event-speakers-panel > span,
        .event-feedback-box > span,
        .event-detail-card span,
        .event-registration-card > span {
          display: block;
          color: var(--brand-soft);
          font-size: 0.76rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 0.45rem;
        }
        .event-detail-overlay h1 {
          max-width: 820px;
          font-size: clamp(2.2rem, 5vw, 4.5rem);
          line-height: 0.98;
          margin-bottom: 0.8rem;
        }
        .event-detail-overlay p {
          max-width: 720px;
          color: rgba(255,255,255,0.78);
        }
        .event-detail-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 330px;
          gap: 1rem;
          align-items: start;
        }
        .event-main-panel,
        .event-side-panel {
          display: grid;
          gap: 1rem;
        }
        .event-media-panel,
        .event-story-panel,
        .event-speakers-panel,
        .event-feedback-box,
        .event-detail-card,
        .event-registration-card {
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 8px;
          padding: 1rem;
          color: white;
        }
        .event-media-panel h2,
        .event-story-panel h2,
        .event-feedback-box h2 {
          color: white;
          line-height: 1.12;
          margin-bottom: 0.65rem;
        }
        .event-media-panel video {
          width: 100%;
          max-height: 520px;
          border-radius: 8px;
          background: #05080a;
        }
        .event-story-panel p,
        .event-detail-card p,
        .event-registration-card p {
          color: rgba(255,255,255,0.74);
          line-height: 1.65;
        }
        .event-speaker-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 0.75rem;
        }
        .event-speaker-card {
          padding: 0.85rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .event-speaker-card strong,
        .event-speaker-card span {
          display: block;
        }
        .event-speaker-card span {
          color: rgba(255,255,255,0.68);
        }
        .event-detail-card strong,
        .event-registration-card strong {
          display: block;
          color: white;
          font-size: 1.25rem;
          line-height: 1.2;
          margin-bottom: 0.35rem;
        }
        .event-feedback-box form {
          display: grid;
          gap: 0.75rem;
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
        .registration-actions {
          display: grid;
          gap: 0.75rem;
        }
        @media (max-width: 860px) {
          .event-detail-layout {
            grid-template-columns: 1fr;
          }
          .event-side-panel {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }
        }
        @media (max-width: 560px) {
          .event-detail-hero {
            height: 180px;
          }
          .event-detail-hero img {
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default EventDetailPage;
