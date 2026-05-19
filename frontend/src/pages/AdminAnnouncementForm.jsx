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
    announcementVideo: ''
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
        announcementVideo: announcement.announcementVideo || ''
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
          <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
          <input type="text" name="summary" placeholder="Short Summary (optional)" value={formData.summary} onChange={handleChange} />
          <textarea name="content" placeholder="Full Content" rows="6" value={formData.content} onChange={handleChange} required />

          <div className="media-upload-section">
            <label>
              Announcement image
              <input type="file" name="featuredImage" accept="image/*" onChange={handleFileChange} />
            </label>
            {formData.featuredImage && <small>Current image: {formData.featuredImage}</small>}

            <label>
              Announcement video
              <input type="file" name="announcementVideo" accept="video/*" onChange={handleFileChange} />
            </label>
            {formData.announcementVideo && <small>Current video: {formData.announcementVideo}</small>}
          </div>
          
          <div className="form-row">
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="event">Event</option>
              <option value="ministry">Ministry</option>
              <option value="prayer">Prayer</option>
            </select>
            <select name="priority" value={formData.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select name="targetAudience" value={formData.targetAudience} onChange={handleChange}>
              <option value="everyone">Everyone</option>
              <option value="students">Students</option>
              <option value="staff">Staff</option>
              <option value="cell_members">Cell Members</option>
              <option value="ministry_members">Ministry Members</option>
              <option value="leaders">Leaders</option>
            </select>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
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
        .admin-form-container { min-height: 80vh; display: flex; justify-content: center; align-items: center; padding: 2rem; }
        .admin-form-card { background: rgba(255,255,255,0.96); border-radius: 8px; padding: 2rem; max-width: 700px; width: 100%; box-shadow: 0 18px 45px rgba(16,24,40,0.16); border: 1px solid rgba(255,255,255,0.55); overflow: hidden; }
        .admin-form-card h1 { color: #333; margin-bottom: 1.5rem; }
        .admin-form-card input, .admin-form-card textarea, .admin-form-card select { width: 100%; max-width: 100%; min-width: 0; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid rgba(31,41,51,0.16); border-radius: 8px; color: #1f2933; background: rgba(255,255,255,0.84); overflow-wrap: anywhere; }
        .admin-form-card textarea { resize: vertical; line-height: 1.5; }
        .media-upload-section { display: grid; gap: 0.75rem; margin-bottom: 1rem; }
        .media-upload-section label { display: flex; flex-direction: column; gap: 0.4rem; font-weight: 500; color: #333; }
        .media-upload-section input { margin-bottom: 0; overflow: hidden; text-overflow: ellipsis; }
        .media-upload-section small { color: #666; overflow-wrap: anywhere; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .form-row select { flex: 1 1 150px; min-width: 0; }
        .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }
        .btn-primary { background: #2f7d46; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
        .btn-secondary { background: #315f72; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AdminAnnouncementForm;
