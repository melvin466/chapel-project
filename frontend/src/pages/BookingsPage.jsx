import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import api from '../services/api';

const bookingTypes = [
  {
    value: 'counselling',
    label: 'Counselling',
    description: 'A private pastoral conversation for prayer, clarity, care, or support through a difficult season.',
    image: 'https://images.pexels.com/photos/5699456/pexels-photo-5699456.jpeg?auto=compress&cs=tinysrgb&w=700',
  },
  {
    value: 'wedding',
    label: 'Wedding',
    description: 'Begin planning a chapel ceremony, marriage preparation meeting, or pastoral guidance for your day.',
    image: 'https://images.pexels.com/photos/1730877/pexels-photo-1730877.jpeg?auto=compress&cs=tinysrgb&w=700',
  },
  {
    value: 'baptism',
    label: 'Baptism',
    description: 'Book baptism preparation and coordinate the details with the chapel team.',
    image: 'https://images.pexels.com/photos/8815058/pexels-photo-8815058.jpeg?auto=compress&cs=tinysrgb&w=700',
  },
  {
    value: 'facility',
    label: 'Facility use',
    description: 'Request chapel space for fellowships, meetings, rehearsals, ministry sessions, or special gatherings.',
    image: 'https://images.pexels.com/photos/709552/pexels-photo-709552.jpeg?auto=compress&cs=tinysrgb&w=700',
  },
  {
    value: 'appointment',
    label: 'Chaplain appointment',
    description: 'Reserve time with a chaplain for guidance, documentation, ministry planning, or spiritual direction.',
    image: 'https://images.pexels.com/photos/4101143/pexels-photo-4101143.jpeg?auto=compress&cs=tinysrgb&w=700',
  },
];

const initialForm = {
  bookingType: 'counselling',
  requestedDate: '',
  requestedTime: '',
  numberOfPeople: 1,
  purpose: '',
  specialRequests: '',
};

const formatType = (type) => bookingTypes.find((item) => item.value === type)?.label || type;

const formatDateTime = (date, time) => {
  if (!date) return 'Date not set';
  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === 'numberOfPeople' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

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

    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      setMessage('Booking cancelled.');
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel this booking.');
    }
  };

  return (
    <div className="bookings-page">
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
            onClick={() => setFormData((current) => ({ ...current, bookingType: type.value }))}
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

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Sending...' : 'Submit Booking'}
            </button>
          </form>
        </section>

        <section className="bookings-list">
          <h2>My Booking Requests</h2>
          {loading ? (
            <p className="member-empty">Loading bookings...</p>
          ) : bookings.length > 0 ? (
            bookings.map((booking) => (
              <article key={booking._id} className="booking-item">
                <div className="booking-item-header">
                  <h2>{formatType(booking.bookingType)}</h2>
                  <span className={`booking-status status-${booking.status}`}>{booking.status}</span>
                </div>
                <p><strong>When:</strong> {formatDateTime(booking.requestedDate, booking.requestedTime)}</p>
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
    </div>
  );
};

export default BookingsPage;
