import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import  announcementService  from '../services/announcementService';

const AdminAnnouncementForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    type: 'general',
    priority: 'medium',
    status: 'published'
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
        status: announcement.status
      });
    } catch (error) {
      console.error('Error loading announcement:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await announcementService.updateAnnouncement(id, formData);
        alert('Announcement updated successfully!');
      } else {
        await announcementService.createAnnouncement(formData);
        alert('Announcement created successfully!');
      }
      navigate('/admin/announcements');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <div className="admin-form-card">
        <h1>{isEditing ? 'Edit Announcement' : 'Create New Announcement'}</h1>
        <form onSubmit={handleSubmit}>
          <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
          <input type="text" name="summary" placeholder="Short Summary (optional)" value={formData.summary} onChange={handleChange} />
          <textarea name="content" placeholder="Full Content" rows="6" value={formData.content} onChange={handleChange} required />
          
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
        .admin-form-container { min-height: 80vh; display: flex; justify-content: center; align-items: center; padding: 2rem; background: linear-gradient(135deg, #667eea, #764ba2); }
        .admin-form-card { background: white; border-radius: 24px; padding: 2rem; max-width: 700px; width: 100%; }
        .admin-form-card h1 { color: #333; margin-bottom: 1.5rem; }
        .admin-form-card input, .admin-form-card textarea, .admin-form-card select { width: 100%; padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #ddd; border-radius: 8px; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .form-row select { flex: 1; }
        .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }
        .btn-primary { background: #4CAF50; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
        .btn-secondary { background: #9e9e9e; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AdminAnnouncementForm;