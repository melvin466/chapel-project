import React, { useState, useEffect } from 'react';
import  announcementService  from '../services/announcementService';
import { useAuth } from '../context/AuthContext';

const AdminAnnouncements = () => {
  const { isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    type: 'general',
    priority: 'medium',
    status: 'published'
  });
  const [mediaFiles, setMediaFiles] = useState({
    featuredImage: null,
    announcementVideo: null
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getManageAnnouncements({ limit: 100 });
      setAnnouncements(response.data?.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      alert('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMediaChange = (e) => {
    const { name, files } = e.target;
    setMediaFiles((currentFiles) => ({
      ...currentFiles,
      [name]: files[0] || null
    }));
  };

  const buildPayload = () => {
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value ?? '');
    });
    if (mediaFiles.featuredImage) payload.append('featuredImage', mediaFiles.featuredImage);
    if (mediaFiles.announcementVideo) payload.append('announcementVideo', mediaFiles.announcementVideo);
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await announcementService.updateAnnouncement(editingItem._id, buildPayload());
        alert('Announcement updated!');
      } else {
        await announcementService.createAnnouncement(buildPayload());
        alert('Announcement created!');
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({ title: '', content: '', summary: '', type: 'general', priority: 'medium', status: 'published' });
      setMediaFiles({ featuredImage: null, announcementVideo: null });
      loadAnnouncements();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save announcement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this announcement?')) {
      try {
        await announcementService.deleteAnnouncement(id);
        alert('Announcement deleted!');
        loadAnnouncements();
      } catch (error) {
        alert('Failed to delete announcement');
      }
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      content: item.content,
      summary: item.summary || '',
      type: item.type,
      priority: item.priority,
      status: item.status
    });
    setShowForm(true);
  };

  if (loading) return <div className="loading">Loading announcements...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Announcements</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingItem(null); }} className="btn-primary">
          {showForm ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {showForm && (
        <div className="admin-form">
          <h2>{editingItem ? 'Edit Announcement' : 'Create Announcement'}</h2>
          <form onSubmit={handleSubmit}>
            <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
            <textarea name="summary" placeholder="Short Summary (optional)" rows="2" value={formData.summary} onChange={handleChange} />
            <textarea name="content" placeholder="Full Content" rows="6" value={formData.content} onChange={handleChange} required />

            <div className="media-upload-section">
              <label>
                Announcement image
                <input type="file" name="featuredImage" accept="image/*" onChange={handleMediaChange} />
              </label>
              <label>
                Announcement video
                <input type="file" name="announcementVideo" accept="video/*" onChange={handleMediaChange} />
              </label>
            </div>
            
            <div className="form-row">
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
                <option value="ministry">Ministry</option>
                <option value="prayer">Prayer</option>
                <option value="administrative">Administrative</option>
              </select>
              
              <select name="priority" value={formData.priority} onChange={handleChange}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical</option>
              </select>
              
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <button type="submit" className="btn-primary">{editingItem ? 'Update' : 'Create'}</button>
          </form>
        </div>
      )}

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No announcements found</td></tr>
            ) : (
              announcements.map(item => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td><span className={`type-badge type-${item.type}`}>{item.type}</span></td>
                  <td><span className={`priority-${item.priority}`}>{item.priority}</span></td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleEdit(item)} className="btn-edit">Edit</button>
                    {isAdmin && <button onClick={() => handleDelete(item._id)} className="btn-delete">Delete</button>}
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
        .admin-header h1 { color: white; text-shadow: 0 2px 18px rgba(0,0,0,0.28); }
        .admin-form { background: rgba(255,255,255,0.96); padding: 2rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 18px 45px rgba(16,24,40,0.16); border: 1px solid rgba(255,255,255,0.55); overflow: hidden; }
        .admin-form h2 { color: #1f2933; margin-bottom: 1rem; font-size: 1.25rem; }
        .admin-form form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .form-row > * { flex: 1 1 180px; min-width: 0; }
        .admin-form input, .admin-form textarea, .admin-form select { width: 100%; max-width: 100%; min-width: 0; padding: 0.8rem; border: 1px solid rgba(31,41,51,0.16); border-radius: 8px; color: #1f2933; background: white; overflow-wrap: anywhere; }
        .admin-form textarea { resize: vertical; line-height: 1.5; }
        .media-upload-section { display: grid; gap: 0.75rem; }
        .media-upload-section label { display: flex; flex-direction: column; gap: 0.4rem; color: #333; font-weight: 500; }
        .media-upload-section input { overflow: hidden; text-overflow: ellipsis; }
        .admin-table-container { background: rgba(255,255,255,0.96); border-radius: 8px; overflow-x: auto; box-shadow: 0 18px 45px rgba(16,24,40,0.12); }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
        .admin-table th { background: #1f2933; color: white; font-weight: 600; }
        .admin-table tr:hover { background: #f5f5f5; }
        .admin-table td { color: #1f2933; overflow-wrap: anywhere; }
        .btn-edit, .btn-delete { padding: 0.35rem 0.75rem; margin: 0.15rem; border: none; border-radius: 6px; cursor: pointer; }
        .btn-edit { background: #315f72; color: white; }
        .btn-delete { background: #c2413a; color: white; }
        .type-badge, .priority-low, .priority-medium, .priority-high, .priority-critical, .status-badge { display: inline-block; padding: 0.25rem 0.55rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; text-transform: capitalize; white-space: nowrap; }
        .type-badge { background: #edf2f0; color: #315f72; }
        .type-urgent, .priority-critical { background: #f8e8e7; color: #9f2f29; }
        .priority-high { background: #f8efe3; color: #8a5a1f; }
        .priority-medium { background: #e8f0f3; color: #315f72; }
        .priority-low { background: #e8f3ec; color: #2f7d46; }
        .status-badge.status-published { background: #e8f3ec; color: #2f7d46; }
        .status-badge.status-draft { background: #f8efe3; color: #8a5a1f; }
        .status-badge.status-archived { background: #edf0f2; color: #62707c; }
      `}</style>
    </div>
  );
};

export default AdminAnnouncements;
