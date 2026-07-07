import React, { useEffect, useMemo, useState, useRef } from 'react';
import '../App.css';
import api from '../services/api';

const bookingTypes = [
  {
    value: 'counselling',
    label: 'Counselling',
    description: 'A private pastoral conversation for prayer, clarity, care, or support through a difficult season.',
    image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auto=compress&cs=tinysrgb&w=700',
    rate: 10000,
  },
  {
    value: 'wedding',
    label: 'Wedding',
    description: 'Begin planning a chapel ceremony, marriage preparation meeting, or pastoral guidance for your day.',
    image: 'https://images.pexels.com/photos/1730877/pexels-photo-1730877.jpeg?auto=compress&cs=tinysrgb&w=700',
    rate: 200000,
  },
  {
    value: 'baptism',
    label: 'Baptism',
    description: 'Book baptism preparation and coordinate the details with the chapel team.',
    image: 'https://images.pexels.com/photos/8815058/pexels-photo-8815058.jpeg?auto=compress&cs=tinysrgb&w=700',
    rate: 50000,
  },
  {
    value: 'facility',
    label: 'Facility use',
    description: 'Request chapel space for fellowships, meetings, rehearsals, ministry sessions, or special gatherings.',
    image: 'https://images.pexels.com/photos/709552/pexels-photo-709552.jpeg?auto=compress&cs=tinysrgb&w=700',
    rate: 100000,
  },
  {
    value: 'appointment',
    label: 'Chaplain appointment',
    description: 'Reserve time with a chaplain for guidance, documentation, ministry planning, or spiritual direction.',
    image: 'https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=700',
    rate: 30000,
  },
];

const initialForm = {
  bookingType: 'counselling',
  requestedDate: '',
  requestedTime: '',
  hours: 1,
  numberOfPeople: 1,
  purpose: '',
  specialRequests: '',
  requiresChapel: false,
};

const formatType = (type) => bookingTypes.find((item) => item.value === type)?.label || type;

const formatDateTime = (date, time) => {
  if (!date) return 'Date not set';
  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return time ? `${formattedDate} at ${time}` : formattedDate;
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pageRef = useRef(null);
  const feedbackRef = useRef(null);

  const scrollToFeedback = (behavior = 'smooth') => {
    window.requestAnimationFrame(() => {
      (feedbackRef.current || pageRef.current)?.scrollIntoView?.({
        behavior,
        block: 'start',
      });
    });
  };

  const today = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);
  const selectedBookingType = bookingTypes.find((type) => type.value === formData.bookingType) || bookingTypes[0];

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings');
      setBookings(response.data.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (message || error) {
      scrollToFeedback();
    }
  }, [message, error]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => {
      const nextVal = type === 'checkbox' ? checked : (name === 'numberOfPeople' || name === 'hours' ? Number(value) : value);
      
      if (name === 'bookingType') {
        return {
          ...current,
          bookingType: value,
          requiresChapel: ['facility', 'wedding'].includes(value),
        };
      }
      
      return {
        ...current,
        [name]: nextVal,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    scrollToFeedback();

    try {
      await api.post('/bookings', formData);
      setMessage('Your booking request has been sent. The chapel team will review it.');
      setFormData(initialForm);
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (bookingId) => {
    setError('');
    setMessage('');
    scrollToFeedback();

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      setMessage('Booking cancelled.');
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel this booking.');
    }
  };

  return (
    <div className="bookings-page" ref={pageRef}>
      <section className="booking-hero">
        <div className="booking-hero-copy">
          <span>Chapel care, planned gently</span>
          <h1>Book the right support for the moment you are in.</h1>
          <p>
            Whether you need a quiet conversation, a chapel space, ceremony planning, or time with a chaplain,
            send the request here and the team will guide the next step.
          </p>
        </div>
        <div className="booking-hero-panel">
          <strong>What happens next</strong>
          <p>Submit your preferred date and purpose. The chapel team reviews availability, assigns the right person, and responds with a clear note.</p>
        </div>
      </section>

      <section className="booking-service-showcase" aria-label="Booking options">
        {bookingTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            className={`booking-service-card ${formData.bookingType === type.value ? 'active' : ''}`}
            onClick={() => setFormData((current) => ({
              ...current,
              bookingType: type.value,
              requiresChapel: ['facility', 'wedding'].includes(type.value)
            }))}
          >
            <img src={type.image} alt="" loading="lazy" />
            <span>{type.label}</span>
            <p>{type.description}</p>
          </button>
        ))}
      </section>

      <div className="booking-layout">
        <section className="form-card booking-form-card">
          <div className="booking-form-heading">
            <span>{selectedBookingType.label}</span>
            <h2>Make a Booking</h2>
            <p>{selectedBookingType.description}</p>
          </div>
          <div ref={feedbackRef} style={{ scrollMarginTop: '1rem' }} />
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <label className="form-label-group">
              <span>Booking Type</span>
              <select name="bookingType" value={formData.bookingType} onChange={handleChange} required>
                {bookingTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </label>

            <div className="booking-form-row">
              <label className="form-label-group">
                <span>Preferred Date</span>
                <input
                  type="date"
                  name="requestedDate"
                  min={today}
                  value={formData.requestedDate}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="form-label-group">
                <span>Preferred Time</span>
                <input
                  type="time"
                  name="requestedTime"
                  value={formData.requestedTime}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div className="booking-form-row">
              <label className="form-label-group">
                <span>Duration (Hours)</span>
                <input
                  type="number"
                  name="hours"
                  min="1"
                  value={formData.hours || 1}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="form-label-group">
                <span>Number of People</span>
                <input
                  type="number"
                  name="numberOfPeople"
                  min="1"
                  value={formData.numberOfPeople}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <label className="form-label-group textarea-label">
              <span>What do you need?</span>
              <textarea
                name="purpose"
                rows="4"
                value={formData.purpose}
                onChange={handleChange}
                placeholder="Tell us what you need. For weddings, include preferred ceremony details."
                required
              />
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0.5rem 0 1.25rem' }}>
              <input
                type="checkbox"
                id="requiresChapel"
                name="requiresChapel"
                checked={formData.requiresChapel || false}
                onChange={handleChange}
                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', margin: 0 }}
              />
              <label htmlFor="requiresChapel" style={{ color: '#cbd5e1', fontWeight: '500', cursor: 'pointer', userSelect: 'none' }}>
                Requires physical Chapel building/hall
              </label>
            </div>

            <label className="form-label-group textarea-label">
              <span>Special Requests or Notes</span>
              <textarea
                name="specialRequests"
                rows="3"
                value={formData.specialRequests}
                onChange={handleChange}
                placeholder="Accessibility needs, special requests, or notes for the chapel team"
              />
            </label>

            <div className="booking-price-preview">
              <span>Estimated Cost:</span>
              <strong>{((bookingTypes.find(t => t.value === formData.bookingType)?.rate || 0) * (formData.hours || 1)).toLocaleString()} UGX</strong>
              <small>({(bookingTypes.find(t => t.value === formData.bookingType)?.rate || 0).toLocaleString()} UGX / hour)</small>
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Sending...' : 'Submit Booking'}
            </button>
          </form>
        </section>

        <section className="bookings-list">
          <h2>My Booking Requests</h2>
          {loading && bookings.length === 0 ? (
            <p className="member-empty">Loading bookings...</p>
          ) : bookings.length > 0 ? (
            bookings.map((booking) => (
              <article key={booking._id} className="booking-item">
                <div className="booking-item-header">
                  <h2>{formatType(booking.bookingType)}</h2>
                  <span className={`booking-status status-${booking.status}`}>{booking.status}</span>
                </div>
                {booking.requiresChapel && (
                  <div style={{ margin: '-0.25rem 0 0.75rem' }}>
                    <span className="booking-chapel-badge" style={{ display: 'inline-block', background: 'rgba(168, 255, 120, 0.15)', color: '#a8ff78', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                      ⛪ Requires Chapel Hall
                    </span>
                  </div>
                )}
                <p><strong>When:</strong> {formatDateTime(booking.requestedDate, booking.requestedTime)} ({booking.hours || 1} {booking.hours === 1 ? 'hour' : 'hours'})</p>
                <p><strong>Cost:</strong> {(booking.price || 0).toLocaleString()} UGX</p>
                <p><strong>People:</strong> {booking.numberOfPeople || 1}</p>
                <p>{booking.purpose}</p>
                {booking.specialRequests && <p><strong>Notes:</strong> {booking.specialRequests}</p>}
                {booking.reviewReason && (
                  <div className="booking-review-note">
                    <strong>{booking.status === 'denied' ? 'Reason denied' : 'Admin note'}</strong>
                    <p>{booking.reviewReason}</p>
                    {booking.reviewedBy && (
                      <span>Reviewed by {booking.reviewedBy.firstName} {booking.reviewedBy.lastName}</span>
                    )}
                  </div>
                )}
                {['pending', 'approved'].includes(booking.status) && (
                  <button type="button" className="btn-secondary" onClick={() => handleCancel(booking._id)}>
                    Cancel
                  </button>
                )}
              </article>
            ))
          ) : (
            <p className="member-empty">No booking requests yet.</p>
          )}
        </section>
      </div>

      <style>{`
        .booking-price-preview {
          background: rgba(255, 255, 255, 0.05);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .booking-price-preview span {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .booking-price-preview strong {
          font-size: 1.4rem;
          color: #a8ff78;
        }
        .booking-price-preview small {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default BookingsPage;
