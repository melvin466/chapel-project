import React, { useEffect, useMemo, useState, useRef } from 'react';
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

const reviewStatuses = ['pending', 'approved', 'denied', 'completed', 'cancelled'];

const bookingStatusSections = [
  { status: 'pending', title: 'Pending', emptyText: 'No pending bookings.' },
  { status: 'approved', title: 'Approved', emptyText: 'No approved bookings.' },
  { status: 'completed', title: 'Completed', emptyText: 'No completed bookings.' },
  { status: 'denied', title: 'Denied', emptyText: 'No denied bookings.' },
  { status: 'cancelled', title: 'Cancelled', emptyText: 'No cancelled bookings.' },
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

const formatDateTime = (date, time) => {
  if (!date) return 'Date not set';
  const day = new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return time ? `${day} at ${time}` : day;
};

const getBookingEndDate = (booking) => {
  if (booking.endDateTime) {
    const endDate = new Date(booking.endDateTime);
    return Number.isNaN(endDate.getTime()) ? null : endDate;
  }

  if (!booking.requestedDate) return null;

  const requestedDate = new Date(booking.requestedDate);
  if (Number.isNaN(requestedDate.getTime())) return null;

  const datePart = requestedDate.toISOString().split('T')[0];
  if (!booking.requestedTime) return new Date(`${datePart}T23:59:59`);

  const startDate = new Date(`${datePart}T${booking.requestedTime}:00`);
  if (Number.isNaN(startDate.getTime())) return null;

  return new Date(startDate.getTime() + (Number(booking.hours) || 1) * 60 * 60 * 1000);
};

const AdminBookings = () => {
  const { hasAdminPower } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formData, setFormData] = useState(initialForm);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyMessage, setBusyMessage] = useState('');
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

  const staffOptions = useMemo(
    () => staffUsers.filter((user) => ['admin', 'chaplain'].includes(user.role)),
    [staffUsers]
  );

  const activeBookings = useMemo(() => {
    const now = Date.now();
    return bookings.filter((booking) => {
      const endDate = getBookingEndDate(booking);
      return !endDate || endDate.getTime() >= now;
    });
  }, [bookings]);

  const bookingGroups = useMemo(() => (
    bookingStatusSections.map((section) => ({
      ...section,
      bookings: activeBookings.filter((booking) => booking.status === section.status),
    }))
  ), [activeBookings]);

  const displayedBookingGroups = useMemo(() => (
    statusFilter
      ? bookingGroups.filter((section) => section.status === statusFilter)
      : bookingGroups.filter((section) => section.bookings.length > 0)
  ), [bookingGroups, statusFilter]);

  const statusCounts = useMemo(() => (
    bookingStatusSections.reduce((acc, section) => {
      acc[section.status] = activeBookings.filter((booking) => booking.status === section.status).length;
      return acc;
    }, {})
  ), [activeBookings]);

  const loadBookings = async () => {
    const isInitialLoad = initialLoading;
    try {
      if (isInitialLoad) {
        setInitialLoading(true);
      } else {
        setRefreshing(true);
      }
      const response = await bookingService.getManageBookings({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      const loadedBookings = response.data?.bookings || [];
      setBookings(loadedBookings);
      setReviewDrafts((current) => loadedBookings.reduce((acc, booking) => {
        acc[booking._id] = current[booking._id] ?? booking.reviewReason ?? '';
        return acc;
      }, {}));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking requests');
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  const loadStaff = async () => {
    if (!hasAdminPower) return;
    try {
      const response = await userService.getUsers();
      setStaffUsers(response.data?.users || []);
    } catch (err) {
      setStaffUsers([]);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [hasAdminPower]);

  useEffect(() => {
    loadBookings();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    if (message || error) {
      scrollToFeedback();
    }
  }, [message, error]);

  const handleFormChange = (event) => {
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

  const createBooking = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    setBusyMessage('Creating booking request...');
    scrollToFeedback();

    try {
      await bookingService.createBooking(formData);
      setMessage('Booking request created.');
      setFormData(initialForm);
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking request');
    } finally {
      setSubmitting(false);
      setBusyMessage('');
    }
  };

  const updateBooking = async (id, data, successText, busyText = 'Updating booking...') => {
    setError('');
    setMessage('');
    setBusyMessage(busyText);
    scrollToFeedback();

    try {
      await bookingService.updateManagedBooking(id, data);
      setMessage(successText);
      await loadBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking');
    } finally {
      setBusyMessage('');
    }
  };

  const reviewBooking = (booking, status) => {
    const reviewReason = reviewDrafts[booking._id]?.trim();
    if (!reviewReason) {
      setError('Please enter a reason before approving or denying this booking.');
      scrollToFeedback();
      return;
    }

    updateBooking(
      booking._id,
      { status, reviewReason },
      status === 'approved' ? 'Booking approved.' : 'Booking denied.',
      status === 'approved' ? 'Approving booking...' : 'Denying booking...'
    );
  };

  const renderBookingCard = (booking) => (
    <article key={booking._id} className="admin-booking-card">
      <div className="admin-booking-topline">
        <span className={`booking-status status-${booking.status}`}>{booking.status}</span>
        <span>{bookingTypes[booking.bookingType] || booking.bookingType}</span>
      </div>
      {booking.requiresChapel && (
        <div style={{ margin: '-0.4rem 0 0.8rem' }}>
          <span className="booking-chapel-badge" style={{ display: 'inline-block', background: 'rgba(168, 255, 120, 0.15)', color: '#a8ff78', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
            Requires Chapel Space
          </span>
        </div>
      )}

      <h2>{booking.purpose}</h2>

      <div className="admin-booking-meta">
        <span>
          <strong>Requested for</strong>
          {formatDateTime(booking.requestedDate, booking.requestedTime)}
        </span>
        <span>
          <strong>Duration</strong>
          {booking.hours || 1} {booking.hours === 1 ? 'hour' : 'hours'}
        </span>
        <span>
          <strong>Cost</strong>
          {(booking.price || 0).toLocaleString()} UGX
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

      {booking.reviewReason && (
        <div className="admin-booking-notes">
          <strong>Review reason</strong>
          <p>{booking.reviewReason}</p>
        </div>
      )}

      {hasAdminPower && (
        <label className="admin-booking-assign">
          Assigned to
          <select
            value={booking.assignedTo?._id || ''}
            onChange={(event) => updateBooking(
              booking._id,
              { assignedTo: event.target.value },
              'Booking assignment updated.',
              'Updating assignment...'
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

      {!hasAdminPower && booking.assignedTo && (
        <p className="admin-booking-assigned">
          Assigned to {booking.assignedTo.firstName} {booking.assignedTo.lastName}
        </p>
      )}

      <div className="admin-booking-actions">
        <label className="admin-booking-review">
          Decision reason
          <textarea
            rows="3"
            value={reviewDrafts[booking._id] || ''}
            onChange={(event) => setReviewDrafts((current) => ({
              ...current,
              [booking._id]: event.target.value,
            }))}
            placeholder="Reason shown to the member"
          />
        </label>
        <button onClick={() => reviewBooking(booking, 'approved')} disabled={booking.status === 'approved' || Boolean(busyMessage)}>
          Approve
        </button>
        <button onClick={() => updateBooking(booking._id, { status: 'completed' }, 'Booking completed.', 'Completing booking...')} disabled={booking.status === 'completed' || Boolean(busyMessage)}>
          Complete
        </button>
        <button className="btn-cancel-booking" onClick={() => reviewBooking(booking, 'denied')} disabled={booking.status === 'denied' || Boolean(busyMessage)}>
          Deny
        </button>
        {booking.status !== 'pending' && (
          <button className="btn-reopen-booking" onClick={() => updateBooking(booking._id, { status: 'pending' }, 'Booking reopened.', 'Reopening booking...')} disabled={Boolean(busyMessage)}>
            Reopen
          </button>
        )}
      </div>
    </article>
  );

  if (initialLoading) return <div className="loading">Loading booking requests...</div>;

  return (
    <div className="admin-container admin-bookings-page" ref={pageRef}>
      <div className="admin-header">
        <div>
          <span className="profile-role">Chapel office</span>
          <h1>Booking Management</h1>
        </div>
      </div>

      <section className="admin-booking-create">
        <div>
          <span className="profile-role">Admin request</span>
          <h2>Make a Booking</h2>
        </div>
        <form onSubmit={createBooking}>
          <select name="bookingType" value={formData.bookingType} onChange={handleFormChange} required>
            {Object.entries(bookingTypes).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <div className="admin-booking-form-row">
            <input type="date" name="requestedDate" min={today} value={formData.requestedDate} onChange={handleFormChange} required />
            <input type="time" name="requestedTime" value={formData.requestedTime} onChange={handleFormChange} required />
            <input type="number" name="hours" min="1" placeholder="Duration (hours)" value={formData.hours || 1} onChange={handleFormChange} required />
            <input type="number" name="numberOfPeople" min="1" placeholder="People" value={formData.numberOfPeople} onChange={handleFormChange} />
          </div>
          <textarea name="purpose" rows="3" placeholder="Purpose for this booking" value={formData.purpose} onChange={handleFormChange} required />
          <textarea name="specialRequests" rows="2" placeholder="Notes or special requests" value={formData.specialRequests} onChange={handleFormChange} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0.2rem 0 0.8rem' }}>
            <input
              type="checkbox"
              id="adminRequiresChapel"
              name="requiresChapel"
              checked={formData.requiresChapel || false}
              onChange={handleFormChange}
              style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer', margin: 0 }}
            />
            <label htmlFor="adminRequiresChapel" style={{ color: '#cbd5e1', fontWeight: '500', cursor: 'pointer', userSelect: 'none' }}>
              Requires physical Chapel building/hall
            </label>
          </div>
          <button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Booking'}</button>
        </form>
      </section>

      <div className="admin-booking-toolbar">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {reviewStatuses.map((status) => (
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

      <div ref={feedbackRef} style={{ scrollMarginTop: '1rem' }} />
      {busyMessage && (
        <div className="booking-inline-status" role="status" aria-live="polite">
          {busyMessage}
        </div>
      )}
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      {refreshing && <div className="admin-refresh-chip">Refreshing booking list...</div>}

      {activeBookings.length > 0 && (
        <div className="admin-booking-status-summary" aria-label="Booking counts by status">
          {bookingStatusSections.map((section) => (
            <span key={section.status}>
              <strong>{statusCounts[section.status] || 0}</strong>
              {section.title}
            </span>
          ))}
        </div>
      )}

      {activeBookings.length === 0 ? (
        <p className="no-data">No upcoming booking requests found.</p>
      ) : (
        <div className={`admin-booking-groups ${refreshing ? 'is-refreshing' : ''}`}>
          {displayedBookingGroups.map((section) => (
            <section key={section.status} className={`admin-booking-section admin-booking-section-${section.status}`}>
              <div className="admin-booking-section-header">
                <div>
                  <span className="profile-role">{section.title}</span>
                  <h2>{section.title} Bookings</h2>
                </div>
                <span className="admin-booking-section-count">{section.bookings.length}</span>
              </div>

              {section.bookings.length > 0 ? (
                <div className="admin-booking-grid">
                  {section.bookings.map(renderBookingCard)}
                </div>
              ) : (
                <p className="admin-booking-section-empty">{section.emptyText}</p>
              )}
            </section>
          ))}
        </div>
      )}

      <style>{`
        .admin-bookings-page { max-width: 1200px; padding: 0 24px 3rem; margin: 0 auto; }
        .admin-header { display: flex; align-items: center; justify-content: space-between; margin: 1rem 0 1.2rem; }
        .admin-header h1 { color: white; font-size: 2rem; }
        .admin-booking-create {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 1.2rem;
          margin-bottom: 1rem;
        }
        .admin-booking-create h2 { color: white; margin-bottom: 1rem; }
        .admin-booking-create form { display: grid; gap: 0.75rem; }
        .admin-booking-form-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0.75rem; }
        .admin-booking-create button {
          justify-self: start;
          border: 0;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          padding: 0.65rem 0.95rem;
          background: #2f7d46;
        }
        .admin-booking-toolbar { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .booking-inline-status {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          width: 100%;
          margin-bottom: 1rem;
          padding: 0.8rem 0.95rem;
          border-radius: 8px;
          color: #e8f3ec;
          background: rgba(47, 125, 70, 0.22);
          border: 1px solid rgba(155, 216, 170, 0.28);
          font-weight: 700;
        }
        .booking-inline-status::before,
        .admin-refresh-chip::before {
          content: '';
          width: 0.8rem;
          height: 0.8rem;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.32);
          border-top-color: #a8ff78;
          animation: booking-spin 0.8s linear infinite;
          flex: 0 0 auto;
        }
        .admin-refresh-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          min-height: 32px;
          margin: 0 0 1rem;
          padding: 0.35rem 0.6rem;
          border-radius: 999px;
          color: #e8f3ec;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          font-size: 0.78rem;
          font-weight: 800;
        }
        .admin-booking-toolbar select, .admin-booking-assign select, .admin-booking-create input, .admin-booking-create select, .admin-booking-create textarea, .admin-booking-review textarea {
          min-height: 42px;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          color: white;
          padding: 0.65rem 0.8rem;
        }
        .admin-booking-toolbar select option, .admin-booking-assign select option, .admin-booking-create select option, .admin-booking-review textarea {
          background: #1f2933;
          color: white;
        }
        .admin-booking-status-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 0.75rem;
          margin: 0 0 1rem;
        }
        .admin-booking-status-summary span {
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.75rem 0.9rem;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.78);
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-weight: 800;
        }
        .admin-booking-status-summary strong {
          color: white;
          font-size: 1.25rem;
        }
        .admin-booking-groups {
          display: grid;
          gap: 1rem;
        }
        .admin-booking-groups.is-refreshing .admin-booking-card {
          opacity: 0.72;
          transition: opacity 0.2s ease;
        }
        .admin-booking-section {
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.045);
        }
        .admin-booking-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .admin-booking-section-header h2 {
          color: white;
          margin: 0.15rem 0 0;
          font-size: 1.3rem;
        }
        .admin-booking-section-count {
          min-width: 42px;
          min-height: 42px;
          display: inline-grid;
          place-items: center;
          border-radius: 8px;
          color: white;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.14);
          font-weight: 900;
        }
        .admin-booking-section-empty {
          margin: 0;
          padding: 0.9rem;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.72);
          background: rgba(255, 255, 255, 0.05);
          border: 1px dashed rgba(255, 255, 255, 0.14);
        }
        .admin-booking-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(330px, 1fr)); gap: 1rem; }
        .admin-booking-grid.is-refreshing .admin-booking-card {
          opacity: 0.72;
          transition: opacity 0.2s ease;
        }
        .admin-booking-card {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 1.2rem;
          overflow: hidden;
        }
        .admin-booking-topline, .admin-booking-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center; }
        .admin-booking-topline { justify-content: space-between; margin-bottom: 0.8rem; color: rgba(255,255,255,0.76); }
        .admin-booking-card h2 { color: white; font-size: 1.2rem; margin-bottom: 0.9rem; overflow-wrap: anywhere; }
        .admin-booking-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; margin-bottom: 1rem; }
        .admin-booking-meta span, .admin-booking-notes, .admin-booking-assigned {
          color: rgba(255,255,255,0.72);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
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
        .admin-booking-review {
          flex: 1 1 100%;
          display: grid;
          gap: 0.45rem;
          color: white;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .admin-booking-review textarea { resize: vertical; text-transform: none; font-weight: 500; }
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
        @keyframes booking-spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 720px) {
          .admin-booking-form-row { grid-template-columns: 1fr; }
          .admin-booking-meta { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminBookings;
