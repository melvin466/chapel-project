import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import  eventService  from '../services/eventService';
const AdminEventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
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
    setError('');
    try {
      if (isEditing) {
        await eventService.updateEvent(id, buildPayload());
      } else {
        await eventService.createEvent(buildPayload());
      }
      navigate('/admin/events');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <div className="admin-form-card">
        <h1>{isEditing ? 'Edit Event' : 'Create New Event'}</h1>
        {error && <div className="form-message error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label-group">
              <span>Event Title</span>
              <input type="text" name="title" placeholder="Event Title" value={formData.title} onChange={handleChange} required />
            </label>
            <label className="form-label-group">
              <span>Event Type</span>
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
            </label>
          </div>

          <label className="form-label-group textarea-label">
            <span>Description</span>
            <textarea name="description" placeholder="Description" rows="4" value={formData.description} onChange={handleChange} required />
          </label>

          <div className="form-row">
            <label className="form-label-group">
              <span>Start Date</span>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
            </label>
            <label className="form-label-group">
              <span>End Date</span>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
            </label>
          </div>

          <div className="form-row">
            <label className="form-label-group">
              <span>Start Time</span>
              <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
            </label>
            <label className="form-label-group">
              <span>End Time</span>
              <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
            </label>
          </div>

          <div className="form-row">
            <label className="form-label-group">
              <span>Location</span>
              <input type="text" name="location" placeholder="Location" value={formData.location} onChange={handleChange} required />
            </label>
            <label className="form-label-group">
              <span>Capacity (0 = unlimited)</span>
              <input type="number" name="capacity" placeholder="Capacity (0 = unlimited)" value={formData.capacity} onChange={handleChange} />
            </label>
          </div>

          <div className="media-upload-section">
            <div className="form-row">
              <label className="form-label-group">
                <span>Featured Image</span>
                <input type="file" name="featuredImage" accept="image/*" onChange={handleFileChange} />
                {formData.featuredImage && <small className="file-hint">Current image: {formData.featuredImage}</small>}
              </label>
              <label className="form-label-group">
                <span>Event Video (Optional)</span>
                <input type="file" name="eventVideo" accept="video/*" onChange={handleFileChange} />
                {formData.eventVideo && <small className="file-hint">Current video: {formData.eventVideo}</small>}
              </label>
            </div>
          </div>

          <div className="form-row">
            <label className="form-label-group">
              <span>Event Status</span>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <div className="form-label-group">
              <span>Registration & Visibility Settings</span>
              <div className="checkbox-row">
                <label className="checkbox-label">
                  <input type="checkbox" name="registrationRequired" checked={formData.registrationRequired} onChange={handleChange} />
                  <span>Require Registration</span>
                </label>
                <label className="checkbox-label">
                  <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} />
                  <span>Feature this Event</span>
                </label>
              </div>
            </div>
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
        .admin-form-container {
          min-height: 85vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem 1rem;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }
        .admin-form-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 2.5rem;
          max-width: 800px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        .admin-form-card h1 {
          color: #f8fafc;
          font-size: 2.25rem;
          font-weight: 700;
          margin-bottom: 2rem;
          letter-spacing: -0.025em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 1rem;
        }
        .form-message {
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
        }
        .form-message.error {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
        }
        .form-label-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }
        .form-label-group span {
          color: #cbd5e1;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.025em;
          text-transform: uppercase;
        }
        .form-label-group input,
        .form-label-group select,
        .form-label-group textarea {
          padding: 0.85rem 1rem;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.6);
          color: #f8fafc;
          font-size: 1rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }
        .form-label-group input:focus,
        .form-label-group select:focus,
        .form-label-group textarea:focus {
          border-color: #3b82f6;
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }
        .form-label-group select option {
          background: #1e293b;
          color: #f8fafc;
        }
        .textarea-label {
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .media-upload-section {
          background: rgba(15, 23, 42, 0.3);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .file-hint {
          color: #94a3b8;
          font-size: 0.8rem;
          margin-top: 0.25rem;
          overflow-wrap: anywhere;
        }
        .checkbox-row {
          display: flex;
          gap: 1.5rem;
          align-items: center;
          height: 100%;
          min-height: 48px;
        }
        @media (max-width: 480px) {
          .checkbox-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          color: #e2e8f0;
          font-weight: 500;
          font-size: 0.95rem;
          user-select: none;
          transition: color 0.2s;
        }
        .checkbox-label:hover {
          color: #f8fafc;
        }
        .checkbox-label input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          width: 1.25rem;
          height: 1.25rem;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          background: rgba(15, 23, 42, 0.5);
          display: grid;
          place-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .checkbox-label input[type="checkbox"]::before {
          content: "";
          width: 0.65rem;
          height: 0.65rem;
          clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
          transform: scale(0);
          transform-origin: bottom left;
          transition: 120ms transform ease-in-out;
          background-color: white;
        }
        .checkbox-label input[type="checkbox"]:checked {
          background-color: #3b82f6;
          border-color: #3b82f6;
        }
        .checkbox-label input[type="checkbox"]:checked::before {
          transform: scale(1);
        }
        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 1.5rem;
        }
        .btn-primary, .btn-secondary {
          padding: 0.8rem 1.75rem;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.95rem;
        }
        .btn-primary {
          background: #3b82f6;
          color: white;
          border: 1px solid #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }
        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
          border-color: #2563eb;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
          transform: translateY(-1px);
        }
        .btn-primary:active:not(:disabled) {
          transform: translateY(0);
        }
        .btn-primary:disabled {
          background: rgba(59, 130, 246, 0.5);
          border-color: transparent;
          cursor: not-allowed;
          box-shadow: none;
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.08);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #f8fafc;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default AdminEventForm;
