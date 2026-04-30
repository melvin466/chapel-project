import React, { useState, useEffect } from 'react';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'worship_service',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    capacity: 0,
    registrationRequired: false,
    status: 'published',
    isFeatured: false
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvents({ limit: 100 });
      setEvents(response.data?.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
      alert('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await eventService.updateEvent(editingEvent._id, formData);
        alert('Event updated successfully!');
      } else {
        await eventService.createEvent(formData);
        alert('Event created successfully!');
      }
      setShowForm(false);
      setEditingEvent(null);
      resetForm();
      loadEvents();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save event');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'worship_service',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      capacity: 0,
      registrationRequired: false,
      status: 'published',
      isFeatured: false
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(id);
        alert('Event deleted successfully!');
        loadEvents();
      } catch (error) {
        alert('Failed to delete event');
      }
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      type: event.type,
      startDate: event.startDate?.split('T')[0] || '',
      endDate: event.endDate?.split('T')[0] || '',
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      capacity: event.capacity,
      registrationRequired: event.registrationRequired,
      status: event.status,
      isFeatured: event.isFeatured || false
    });
    setShowForm(true);
  };

  const handleFeatureToggle = async (id, currentStatus) => {
    try {
      await eventService.updateEvent(id, { isFeatured: !currentStatus });
      loadEvents();
    } catch (error) {
      alert('Failed to update feature status');
    }
  };

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Events</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingEvent(null); resetForm(); }} className="btn-primary">
          {showForm ? 'Cancel' : '+ Create New Event'}
        </button>
      </div>

      {showForm && (
        <div className="admin-form">
          <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input type="text" name="title" placeholder="Event Title" value={formData.title} onChange={handleChange} required />
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="worship_service">Worship Service</option>
                <option value="fellowship">Fellowship</option>
                <option value="conference">Conference</option>
                <option value="retreat">Retreat</option>
                <option value="prayer_meeting">Prayer Meeting</option>
                <option value="bible_study">Bible Study</option>
                <option value="wedding">Wedding</option>
                <option value="baptism">Baptism</option>
                <option value="seminar">Seminar</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>

            <textarea name="description" placeholder="Description" rows="4" value={formData.description} onChange={handleChange} required />

            <div className="form-row">
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
              <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} required />
              <input type="number" name="capacity" placeholder="Capacity (0 = unlimited)" value={formData.capacity} onChange={handleChange} />
            </div>

            <div className="form-row">
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
              <label className="checkbox-label">
                <input type="checkbox" name="registrationRequired" checked={formData.registrationRequired} onChange={handleChange} />
                Require Registration
              </label>
              <label className="checkbox-label">
                <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} />
                Feature this Event
              </label>
            </div>

            <button type="submit" className="btn-primary">{editingEvent ? 'Update Event' : 'Create Event'}</button>
          </form>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Date</th>
              <th>Location</th>
              <th>Registered</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center' }}>No events found</td></tr>
            ) : (
              events.map(event => (
                <tr key={event._id}>
                  <td>{event.title}</td>
                  <td>{event.type?.replace('_', ' ')}</td>
                  <td>{new Date(event.startDate).toLocaleDateString()}</td>
                  <td>{event.location}</td>
                  <td>{event.registeredCount || 0} / {event.capacity || '∞'}</td>
                  <td><span className={`status-badge status-${event.status}`}>{event.status}</span></td>
                  <td>
                    <button onClick={() => handleFeatureToggle(event._id, event.isFeatured)} className="btn-feature">
                      {event.isFeatured ? '★ Featured' : '☆ Not Featured'}
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(event)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(event._id)} className="btn-delete">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .admin-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .admin-header h1 { color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .admin-form { background: rgba(255,255,255,0.95); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        .admin-form form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .form-row > * { flex: 1; min-width: 150px; }
        .admin-form input, .admin-form textarea, .admin-form select { padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .admin-table-container { background: rgba(255,255,255,0.95); border-radius: 12px; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
        .admin-table th { background: #4CAF50; color: white; }
        .admin-table tr:hover { background: #f5f5f5; }
        .btn-edit, .btn-delete, .btn-feature { padding: 0.3rem 0.8rem; margin: 0 0.2rem; border: none; border-radius: 4px; cursor: pointer; }
        .btn-edit { background: #2196F3; color: white; }
        .btn-delete { background: #f44336; color: white; }
        .btn-feature { background: #ff9800; color: white; }
        .status-badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; }
        .status-published { background: #4CAF50; color: white; }
        .status-draft { background: #ff9800; color: white; }
        .status-cancelled { background: #f44336; color: white; }
        .status-completed { background: #2196F3; color: white; }
        @media (max-width: 768px) { .form-row { flex-direction: column; } }
      `}</style>
    </div>
  );
};

export default AdminEvents;