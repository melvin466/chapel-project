import React, { useEffect, useMemo, useState } from 'react';
import bookingService from '../services/bookingService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';

const bookingTypes = {
  counselling: 'Counselling',
  wedding: 'Wedding',
  baptism: 'Baptism',
  facility: 'Facility use',
  appointment: 'Chaplain appointment',
};

const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

const formatDateTime = (date, time) => {
  if (!date) return 'Date not set';
  const day = new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return time ? `${day} at ${time}` : day;
};

const AdminBookings = () => {
  const { isAdmin } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const staffOptions = useMemo(
    () => staffUsers.filter((user) => ['admin', 'chaplain'].includes(user.role)),
    [staffUsers]
  );

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getManageBookings({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      setBookings(response.data?.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    if (!isAdmin) return;
    try {
      const response = await userService.getUsers();
      setStaffUsers(response.data?.users || []);
    } catch (err) {
      setStaffUsers([]);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [isAdmin]);

  useEffect(() => {
    loadBookings();
  }, [statusFilter, typeFilter]);

  const updateBooking = async (id, data, successText) => {
    setError('');
    setMessage('');

    try {
      await bookingService.updateManagedBooking(id, data);
      setMessage(successText);
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking');
    }
  };

  if (loading) return <div className="loading">Loading booking requests...</div>;

  return (
    <div className="admin-container admin-bookings-page">
      <div className="admin-header">
        <div>
          <span className="profile-role">Chapel office</span>
          <h1>Booking Management</h1>
        </div>
      </div>

      <div className="admin-booking-toolbar">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">All booking types</option>
          {Object.entries(bookingTypes).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {bookings.length === 0 ? (
        <p className="no-data">No booking requests found.</p>
      ) : (
        <div className="admin-booking-grid">
          {bookings.map((booking) => (
            <article key={booking._id} className="admin-booking-card">
              <div className="admin-booking-topline">
                <span className={`booking-status status-${booking.status}`}>{booking.status}</span>
                <span>{bookingTypes[booking.bookingType] || booking.bookingType}</span>
              </div>

              <h2>{booking.purpose}</h2>

              <div className="admin-booking-meta">
                <span>
                  <strong>Requested for</strong>
                  {formatDateTime(booking.requestedDate, booking.requestedTime)}
                </span>
                <span>
                  <strong>People</strong>
                  {booking.numberOfPeople || 1}
                </span>
                <span>
                  <strong>Member</strong>
                  {booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'Unknown'}
                </span>
                <span>
                  <strong>Contact</strong>
                  {booking.user?.phoneNumber || booking.user?.email || 'Not provided'}
                </span>
              </div>

              {booking.specialRequests && (
                <div className="admin-booking-notes">
                  <strong>Notes</strong>
                  <p>{booking.specialRequests}</p>
                </div>
              )}

              {isAdmin && (
                <label className="admin-booking-assign">
                  Assigned to
                  <select
                    value={booking.assignedTo?._id || ''}
                    onChange={(event) => updateBooking(
                      booking._id,
                      { assignedTo: event.target.value },
                      'Booking assignment updated.'
                    )}
                  >
                    <option value="">Unassigned</option>
                    {staffOptions.map((staff) => (
                      <option key={staff._id} value={staff._id}>
                        {staff.firstName} {staff.lastName} ({staff.role})
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {!isAdmin && booking.assignedTo && (
                <p className="admin-booking-assigned">
                  Assigned to {booking.assignedTo.firstName} {booking.assignedTo.lastName}
                </p>
              )}

              <div className="admin-booking-actions">
                <button onClick={() => updateBooking(booking._id, { status: 'confirmed' }, 'Booking confirmed.')} disabled={booking.status === 'confirmed'}>
                  Confirm
                </button>
                <button onClick={() => updateBooking(booking._id, { status: 'completed' }, 'Booking completed.')} disabled={booking.status === 'completed'}>
                  Complete
                </button>
                <button className="btn-cancel-booking" onClick={() => updateBooking(booking._id, { status: 'cancelled' }, 'Booking cancelled.')} disabled={booking.status === 'cancelled'}>
                  Cancel
                </button>
                {booking.status !== 'pending' && (
                  <button className="btn-reopen-booking" onClick={() => updateBooking(booking._id, { status: 'pending' }, 'Booking reopened.')}>
                    Reopen
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <style>{`
        .admin-bookings-page { max-width: 1200px; padding: 0 24px 3rem; margin: 0 auto; }
        .admin-header { display: flex; align-items: center; justify-content: space-between; margin: 1rem 0 1.2rem; }
        .admin-header h1 { color: white; font-size: 2rem; }
        .admin-booking-toolbar { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .admin-booking-toolbar select, .admin-booking-assign select {
          min-height: 42px;
          border: 1px solid rgba(31,41,51,0.16);
          border-radius: 8px;
          background: rgba(255,255,255,0.86);
          color: #1f2933;
          padding: 0.65rem 0.8rem;
        }
        .admin-booking-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(330px, 1fr)); gap: 1rem; }
        .admin-booking-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08));
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 8px;
          padding: 1.2rem;
          backdrop-filter: blur(22px) saturate(130%);
          box-shadow: 0 18px 45px rgba(0,0,0,0.22);
          overflow: hidden;
        }
        .admin-booking-topline, .admin-booking-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center; }
        .admin-booking-topline { justify-content: space-between; margin-bottom: 0.8rem; color: rgba(255,255,255,0.76); }
        .admin-booking-card h2 { color: white; font-size: 1.2rem; margin-bottom: 0.9rem; overflow-wrap: anywhere; }
        .admin-booking-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; margin-bottom: 1rem; }
        .admin-booking-meta span, .admin-booking-notes, .admin-booking-assigned {
          color: rgba(255,255,255,0.72);
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 0.7rem;
          overflow-wrap: anywhere;
        }
        .admin-booking-meta strong, .admin-booking-notes strong, .admin-booking-assign {
          display: block;
          color: white;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 0.2rem;
        }
        .admin-booking-notes { margin-bottom: 1rem; }
        .admin-booking-notes p { white-space: pre-wrap; }
        .admin-booking-assign { display: grid; gap: 0.45rem; margin-bottom: 1rem; }
        .admin-booking-actions button {
          border: 0;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          padding: 0.55rem 0.85rem;
          background: #2f7d46;
        }
        .admin-booking-actions button:disabled { opacity: 0.45; cursor: not-allowed; }
        .admin-booking-actions .btn-cancel-booking { background: #c2413a; }
        .admin-booking-actions .btn-reopen-booking { background: #8a5a1f; }
        @media (max-width: 720px) {
          .admin-booking-meta { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminBookings;
