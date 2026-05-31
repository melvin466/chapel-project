import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import  announcementService  from '../services/announcementService';

const AdminAnnouncementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState({
    featuredImage: null,
    announcementVideo: null
  });
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    type: 'general',
    priority: 'medium',
    targetAudience: 'everyone',
    status: 'published',
    featuredImage: '',
    announcementVideo: '',
    expiryDate: ''
  });

  useEffect(() => {
    if (id) {
      setIsEditing(true);
      loadAnnouncement();
    }
  }, [id]);

  const loadAnnouncement = async () => {
    try {
      const response = await announcementService.getAnnouncementById(id);
      const announcement = response.data.announcement;
      setFormData({
        title: announcement.title,
        content: announcement.content,
        summary: announcement.summary || '',
        type: announcement.type,
        priority: announcement.priority,
        targetAudience: announcement.targetAudience || 'everyone',
        status: announcement.status,
        featuredImage: announcement.featuredImage || '',
        announcementVideo: announcement.announcementVideo || '',
        expiryDate: announcement.expiryDate ? announcement.expiryDate.split('T')[0] : ''
      });
    } catch (error) {
      console.error('Error loading announcement:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    if (files.announcementVideo) payload.append('announcementVideo', files.announcementVideo);
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isEditing) {
        await announcementService.updateAnnouncement(id, buildPayload());
      } else {
        await announcementService.createAnnouncement(buildPayload());
      }
      navigate('/admin/announcements');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <div className="admin-form-card">
        <h1>{isEditing ? 'Edit Announcement' : 'Create New Announcement'}</h1>
        {error && <div className="form-message error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="form-label-group">
            <span>Announcement Title</span>
            <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
          </label>

          <label className="form-label-group">
            <span>Short Summary (Optional)</span>
            <input type="text" name="summary" placeholder="Short Summary" value={formData.summary} onChange={handleChange} />
          </label>

          <label className="form-label-group">
            <span>Full Content</span>
            <textarea name="content" placeholder="Full Content" rows="6" value={formData.content} onChange={handleChange} required />
          </label>

          <div className="media-upload-section">
            <div className="form-row">
              <label className="form-label-group">
                <span>Announcement Image</span>
                <input type="file" name="featuredImage" accept="image/*" onChange={handleFileChange} />
                {formData.featuredImage && <small>Current image: {formData.featuredImage}</small>}
              </label>

              <label className="form-label-group">
                <span>Announcement Video</span>
                <input type="file" name="announcementVideo" accept="video/*" onChange={handleFileChange} />
                {formData.announcementVideo && <small>Current video: {formData.announcementVideo}</small>}
              </label>
            </div>
          </div>
          
          <div className="form-row">
            <label className="form-label-group">
              <span>Announcement Type</span>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
                <option value="ministry">Ministry</option>
                <option value="prayer">Prayer</option>
              </select>
            </label>
            
            <label className="form-label-group">
              <span>Priority</span>
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="form-label-group">
              <span>Target Audience</span>
              <select name="targetAudience" value={formData.targetAudience} onChange={handleChange}>
                <option value="everyone">Everyone</option>
                <option value="students">Students</option>
                <option value="staff">Staff</option>
                <option value="cell_members">Cell Members</option>
                <option value="ministry_members">Ministry Members</option>
                <option value="leaders">Leaders</option>
              </select>
            </label>

            <label className="form-label-group">
              <span>Status</span>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="form-label-group">
              <span>Expiry Date (Optional)</span>
              <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} />
            </label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/admin/announcements')} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
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
          margin-bottom: 1.5rem;
        }
        .form-label-group span {
          color: #cbd5e1;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.025em;
          text-transform: uppercase;
        }
        .admin-form-card input,
        .admin-form-card select,
        .admin-form-card textarea {
          padding: 0.85rem 1rem;
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.6);
          color: #f8fafc;
          font-size: 1rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          width: 100%;
          box-sizing: border-box;
        }
        .admin-form-card input:focus,
        .admin-form-card select:focus,
        .admin-form-card textarea:focus {
          border-color: #3b82f6;
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }
        .admin-form-card select option {
          background: #1e293b;
          color: #f8fafc;
        }
        .media-upload-section {
          background: rgba(15, 23, 42, 0.3);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .media-upload-section label {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-weight: 500;
          color: #cbd5e1;
        }
        .media-upload-section small {
          color: #94a3b8;
          font-size: 0.8rem;
          margin-top: 0.25rem;
          overflow-wrap: anywhere;
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

export default AdminAnnouncementForm;
