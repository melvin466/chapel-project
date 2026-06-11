import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import ConfirmDialog from '../components/ConfirmDialog';

const currentYear = new Date().getFullYear();

const AdminEvents = () => {
  const { hasAdminPower } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [calendar, setCalendar] = useState([]);
  const [calendarYear, setCalendarYear] = useState(currentYear);
  const [attendeePanel, setAttendeePanel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadCalendar(calendarYear);
  }, [calendarYear]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const [eventsResponse, statsResponse] = await Promise.all([
        eventService.getManageEvents({ limit: 100 }),
        eventService.getEventStats()
      ]);
      setEvents(eventsResponse.data?.events || []);
      setStats(statsResponse.data || null);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const loadCalendar = async (year) => {
    try {
      const response = await eventService.getEventsByMonth({ year, status: 'published' });
      setCalendar(response.data?.months || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load event calendar');
    }
  };

  const loadAttendees = async (event) => {
    try {
      setAttendeesLoading(true);
      const response = await eventService.getEventAttendees(event._id);
      setAttendeePanel({
        event: { ...event, ...(response.data?.event || {}) },
        attendees: response.data?.attendees || []
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load attendees');
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleCheckIn = async (attendeeId) => {
    if (!attendeePanel?.event?._id) return;
    try {
      await eventService.checkInAttendee(attendeePanel.event._id, attendeeId);
      setMessage('Attendee checked in.');
      setError('');
      await loadEvents();
      await loadAttendees(attendeePanel.event);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to check in attendee');
    }
  };

  const handleExport = async () => {
    try {
      const response = await eventService.exportEvents();
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'events_export.csv';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Events export downloaded.');
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to export events');
    }
  };

  const requestDelete = (event) => {
    if (!hasAdminPower) {
      setError('Admin or chaplain access required to delete events');
      return;
    }
    setDeleteTarget(event);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await eventService.deleteEvent(deleteTarget._id);
      setMessage('Event deleted successfully.');
      setError('');
      setDeleteTarget(null);
      loadEvents();
      loadCalendar(calendarYear);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const checkedInIds = new Set((attendeePanel?.event?.checkedInAttendees || []).map((id) => id.toString()));

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Events</h1>
        <div className="admin-actions">
          <button onClick={handleExport} className="btn-secondary">Export CSV</button>
          <button onClick={() => navigate('/admin/events/create')} className="btn-primary">
            New Event
          </button>
        </div>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {stats && (
        <div className="event-stats-grid">
          <div><strong>{stats.totals?.totalEvents || 0}</strong><span>Total events</span></div>
          <div><strong>{stats.totals?.publishedEvents || 0}</strong><span>Published</span></div>
          <div><strong>{stats.totals?.upcomingEvents || 0}</strong><span>Upcoming</span></div>
          <div><strong>{stats.totals?.totalAttendees || 0}</strong><span>Registrations</span></div>
        </div>
      )}

      <div className="calendar-panel">
        <div className="calendar-header">
          <h2>Published Calendar</h2>
          <input
            type="number"
            min="2000"
            max="2100"
            value={calendarYear}
            onChange={(event) => setCalendarYear(Number(event.target.value))}
          />
        </div>
        {calendar.length === 0 ? (
          <p>No published events for {calendarYear}.</p>
        ) : (
          <div className="calendar-months">
            {calendar.map((month) => (
              <div key={month.month} className="calendar-month">
                <strong>{month.monthName}</strong>
                <span>{month.count} event{month.count === 1 ? '' : 's'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {attendeePanel && (
        <div className="attendee-panel">
          <div className="attendee-panel-header">
            <div>
              <h2>{attendeePanel.event.title} Attendees</h2>
              <p>{attendeePanel.attendees.length} registered</p>
            </div>
            <button type="button" onClick={() => setAttendeePanel(null)} className="btn-secondary">Close</button>
          </div>
          {attendeesLoading ? (
            <p>Loading attendees...</p>
          ) : attendeePanel.attendees.length === 0 ? (
            <p>No attendees registered yet.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {attendeePanel.attendees.map((attendee) => {
                  const isCheckedIn = checkedInIds.has(attendee._id.toString());
                  return (
                    <tr key={attendee._id}>
                      <td>{attendee.firstName} {attendee.lastName}</td>
                      <td>{attendee.email}</td>
                      <td>{attendee.role}</td>
                      <td>{isCheckedIn ? 'Checked in' : 'Registered'}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-edit"
                          disabled={isCheckedIn}
                          onClick={() => handleCheckIn(attendee._id)}
                        >
                          {isCheckedIn ? 'Done' : 'Check in'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Location</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No events found</td></tr>
            ) : (
              events.map((event) => (
                <tr key={event._id}>
                  <td>{event.title}</td>
                  <td>{event.type?.replaceAll('_', ' ')}</td>
                  <td><span className={`status-badge status-${event.status}`}>{event.status}</span></td>
                  <td>{event.startDate ? new Date(event.startDate).toLocaleDateString() : '-'}</td>
                  <td>{event.location || '-'}</td>
                  <td>{event.registeredCount || 0}</td>
                  <td>
                    <button onClick={() => loadAttendees(event)} className="btn-edit">Attendees</button>
                    <button onClick={() => navigate(`/admin/events/edit/${event._id}`)} className="btn-edit">Edit</button>
                    {hasAdminPower && <button onClick={() => requestDelete(event)} className="btn-delete">Delete</button>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .admin-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .admin-header h1 { color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .admin-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .event-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
        .event-stats-grid div, .calendar-panel, .attendee-panel { background: rgba(255,255,255,0.96); border: 1px solid rgba(255,255,255,0.55); border-radius: 8px; padding: 1rem; box-shadow: 0 12px 28px rgba(16,24,40,0.12); }
        .event-stats-grid strong { display: block; color: #1f2937; font-size: 1.7rem; }
        .event-stats-grid span { color: #4b5563; }
        .calendar-panel, .attendee-panel { margin-bottom: 1rem; }
        .calendar-header, .attendee-panel-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .calendar-header h2, .attendee-panel h2 { margin: 0; color: #1f2937; }
        .calendar-header input { max-width: 120px; padding: 0.6rem; border: 1px solid #ddd; border-radius: 8px; }
        .calendar-months { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
        .calendar-month { border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.75rem; }
        .calendar-month strong, .calendar-month span { display: block; }
        .admin-table-container { background: rgba(255,255,255,0.95); border-radius: 8px; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
        .admin-table th { background: #4CAF50; color: white; }
        .admin-table tr:hover { background: #f5f5f5; }
        .btn-primary { background: #4CAF50; color: white; padding: 0.75rem 1.2rem; border: none; border-radius: 8px; cursor: pointer; }
        .btn-secondary { background: #315f72; color: white; padding: 0.75rem 1.2rem; border: none; border-radius: 8px; cursor: pointer; }
        .btn-edit, .btn-delete { padding: 0.3rem 0.8rem; margin: 0.2rem; border: none; border-radius: 4px; cursor: pointer; }
        .btn-edit { background: #2196F3; color: white; }
        .btn-edit:disabled { background: #9ca3af; cursor: not-allowed; }
        .btn-delete { background: #f44336; color: white; }
        .status-badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: #9e9e9e; color: white; }
        .status-published { background: #4CAF50; }
        .status-draft { background: #ff9800; }
        .status-cancelled { background: #f44336; }
        .status-completed { background: #607D8B; }
      `}</style>
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete event"
        message={`Delete "${deleteTarget?.title || 'this event'}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminEvents;
