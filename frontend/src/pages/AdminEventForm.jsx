import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import  eventService  from '../services/eventService';
const AdminEventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [files, setFiles] = useState({
    featuredImage: null,
    eventVideo: null
  });
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
    isFeatured: false,
    featuredImage: '',
    eventVideo: ''
  });

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    try {
      const response = await eventService.getEventById(id);
      const event = response.data.event;
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
        isFeatured: event.isFeatured || false,
        featuredImage: event.featuredImage || '',
        eventVideo: event.eventVideo || ''
      });
    } catch (error) {
      console.error('Error loading event:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles((currentFiles) => ({
      ...currentFiles,
      [name]: selectedFiles[0] || null
    }));
  };

  const buildPayload = () => {
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value ?? '');
    });
    if (files.featuredImage) payload.append('featuredImage', files.featuredImage);
    if (files.eventVideo) payload.append('eventVideo', files.eventVideo);
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await eventService.updateEvent(id, buildPayload());
        alert('Event updated successfully!');
      } else {
        await eventService.createEvent(buildPayload());
        alert('Event created successfully!');
      }
      navigate('/admin/events');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <div className="admin-form-card">
        <h1>{isEditing ? 'Edit Event' : 'Create New Event'}</h1>
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

          <div className="media-upload-section">
            <label>
              Event image
              <input type="file" name="featuredImage" accept="image/*" onChange={handleFileChange} />
            </label>
            {formData.featuredImage && <small>Current image: {formData.featuredImage}</small>}

            <label>
              Event video
              <input type="file" name="eventVideo" accept="video/*" onChange={handleFileChange} />
            </label>
            {formData.eventVideo && <small>Current video: {formData.eventVideo}</small>}
          </div>

          <div className="form-row">
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="cancelled">Cancelled</option>
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

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/admin/events')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : (isEditing ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .admin-form-container { min-height: 80vh; display: flex; justify-content: center; align-items: center; padding: 2rem; }
        .admin-form-card { background: rgba(255,255,255,0.96); border-radius: 8px; padding: 2rem; max-width: 700px; width: 100%; box-shadow: 0 18px 45px rgba(16,24,40,0.16); border: 1px solid rgba(255,255,255,0.55); }
        .admin-form-card h1 { color: #333; margin-bottom: 1.5rem; }
        .form-row { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
        .form-row input, .form-row select { flex: 1; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; }
        textarea { width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 1rem; }
        .media-upload-section { display: grid; gap: 0.75rem; margin-bottom: 1rem; }
        .media-upload-section label { display: flex; flex-direction: column; gap: 0.4rem; font-weight: 500; color: #333; }
        .media-upload-section input { padding: 0.7rem; border: 1px solid #ddd; border-radius: 8px; }
        .media-upload-section small { color: #666; overflow-wrap: anywhere; }
        .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
        .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
        .btn-primary { background: #2f7d46; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
        .btn-secondary { background: #315f72; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AdminEventForm;
