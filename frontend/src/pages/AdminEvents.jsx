import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminEvents = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getManageEvents({ limit: 100 });
      setEvents(response.data?.events || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (event) => {
    if (!isAdmin) {
      setError('Only admins can delete events');
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
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete event');
    }
  };

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Events</h1>
        <button onClick={() => navigate('/admin/events/create')} className="btn-primary">
          New Event
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No events found</td></tr>
            ) : (
              events.map((event) => (
                <tr key={event._id}>
                  <td>{event.title}</td>
                  <td>{event.type?.replaceAll('_', ' ')}</td>
                  <td><span className={`status-badge status-${event.status}`}>{event.status}</span></td>
                  <td>{event.startDate ? new Date(event.startDate).toLocaleDateString() : '-'}</td>
                  <td>{event.location || '-'}</td>
                  <td>
                    <button onClick={() => navigate(`/admin/events/edit/${event._id}`)} className="btn-edit">Edit</button>
                    {isAdmin && <button onClick={() => requestDelete(event)} className="btn-delete">Delete</button>}
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
        .admin-table-container { background: rgba(255,255,255,0.95); border-radius: 12px; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
        .admin-table th { background: #4CAF50; color: white; }
        .admin-table tr:hover { background: #f5f5f5; }
        .btn-primary { background: #4CAF50; color: white; padding: 0.75rem 1.2rem; border: none; border-radius: 8px; cursor: pointer; }
        .btn-edit, .btn-delete { padding: 0.3rem 0.8rem; margin: 0 0.2rem; border: none; border-radius: 4px; cursor: pointer; }
        .btn-edit { background: #2196F3; color: white; }
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
