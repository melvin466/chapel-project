import React, { useEffect, useMemo, useState } from 'react';
import '../App.css';
import api from '../services/api';

const bookingTypes = [
  { value: 'counselling', label: 'Counselling' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'baptism', label: 'Baptism' },
  { value: 'facility', label: 'Facility use' },
  { value: 'appointment', label: 'Chaplain appointment' },
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
      <h1>Chapel Bookings</h1>

      <div className="booking-layout">
        <section className="form-card booking-form-card">
          <h2>Make a Booking</h2>
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <select name="bookingType" value={formData.bookingType} onChange={handleChange} required>
              {bookingTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <div className="booking-form-row">
              <input
                type="date"
                name="requestedDate"
                min={today}
                value={formData.requestedDate}
                onChange={handleChange}
                required
              />
              <input
                type="time"
                name="requestedTime"
                value={formData.requestedTime}
                onChange={handleChange}
                required
              />
            </div>

            <input
              type="number"
              name="numberOfPeople"
              min="1"
              value={formData.numberOfPeople}
              onChange={handleChange}
              placeholder="Number of people"
            />

            <textarea
              name="purpose"
              rows="4"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Tell us what you need. For weddings, include preferred ceremony details."
              required
            />

            <textarea
              name="specialRequests"
              rows="3"
              value={formData.specialRequests}
              onChange={handleChange}
              placeholder="Special requests, accessibility needs, or notes for the chapel team"
            />

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
                {(booking.status === 'pending' || booking.status === 'confirmed') && (
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
