import React, { useState, useEffect } from 'react';
import  announcementService  from '../services/announcementService';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';

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
    targetAudience: 'everyone',
    status: 'published'
  });
  const [mediaFiles, setMediaFiles] = useState({
    featuredImage: null,
    announcementVideo: null
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getManageAnnouncements({ limit: 100 });
      setAnnouncements(response.data?.announcements || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load announcements');
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
    setMessage('');
    setError('');
    try {
      if (editingItem) {
        await announcementService.updateAnnouncement(editingItem._id, buildPayload());
        setMessage('Announcement updated.');
      } else {
        await announcementService.createAnnouncement(buildPayload());
        setMessage('Announcement created.');
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({ title: '', content: '', summary: '', type: 'general', priority: 'medium', targetAudience: 'everyone', status: 'published' });
      setMediaFiles({ featuredImage: null, announcementVideo: null });
      loadAnnouncements();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save announcement');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await announcementService.deleteAnnouncement(deleteTarget._id);
      setMessage('Announcement deleted.');
      setError('');
      setDeleteTarget(null);
      loadAnnouncements();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete announcement');
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
      targetAudience: item.targetAudience || 'everyone',
      status: item.status
    });
    setShowForm(true);
  };

  const getPosterName = (item) => (
    item.createdBy
      ? `${item.createdBy.firstName || ''} ${item.createdBy.lastName || ''}`.trim()
      : 'Chapel Team'
  );

  if (loading) return <div className="loading">Loading announcements...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Announcements</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingItem(null); }} className="btn-primary">
          {showForm ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

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
              <th>Posted By</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No announcements found</td></tr>
            ) : (
              announcements.map(item => (
                <tr key={item._id}>
                  <td>{item.title}</td>
                  <td><span className={`type-badge type-${item.type}`}>{item.type}</span></td>
                  <td><span className={`priority-${item.priority}`}>{item.priority}</span></td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                  <td>
                    {getPosterName(item)}
                    {item.createdBy?.role && <span className="role-chip">{item.createdBy.role}</span>}
                  </td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleEdit(item)} className="btn-edit">Edit</button>
                    {isAdmin && <button onClick={() => setDeleteTarget(item)} className="btn-delete">Delete</button>}
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
        .admin-form { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); padding: 2rem; border-radius: 20px; margin-bottom: 2rem; overflow: hidden; }
        .admin-form h2 { color: white; margin-bottom: 1rem; font-size: 1.25rem; }
        .admin-form form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .form-row > * { flex: 1 1 180px; min-width: 0; }
        .admin-form input, .admin-form textarea, .admin-form select { width: 100%; max-width: 100%; min-width: 0; padding: 0.8rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: white; background: rgba(255,255,255,0.05); overflow-wrap: anywhere; }
        .admin-form input::placeholder, .admin-form textarea::placeholder { color: rgba(255,255,255,0.5); }
        .admin-form select option { background: #1f2933; color: white; }
        .admin-form textarea { resize: vertical; line-height: 1.5; }
        .media-upload-section { display: grid; gap: 0.75rem; }
        .media-upload-section label { display: flex; flex-direction: column; gap: 0.4rem; color: white; font-weight: 500; }
        .media-upload-section input { overflow: hidden; text-overflow: ellipsis; }
        .admin-table-container { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 1rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .admin-table th { background: rgba(255,255,255,0.05); color: white; font-weight: 600; }
        .admin-table tr:hover { background: rgba(255,255,255,0.05); }
        .admin-table td { color: white; overflow-wrap: anywhere; }
        .btn-edit, .btn-delete { padding: 0.35rem 0.75rem; margin: 0.15rem; border: none; border-radius: 6px; cursor: pointer; }
        .btn-edit { background: #315f72; color: white; }
        .btn-delete { background: #c2413a; color: white; }
        .type-badge, .priority-low, .priority-medium, .priority-high, .priority-critical, .status-badge { display: inline-block; padding: 0.25rem 0.55rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; text-transform: capitalize; white-space: nowrap; }
        .type-badge { background: rgba(49,95,114,0.3); color: #a8ff78; }
        .type-urgent, .priority-critical { background: rgba(242,68,56,0.2); color: #ff9999; }
        .priority-high { background: rgba(255,152,0,0.2); color: #ffcc99; }
        .priority-medium { background: rgba(33,150,243,0.2); color: #99ccff; }
        .priority-low { background: rgba(76,175,80,0.2); color: #a8ff78; }
        .status-badge.status-published { background: #e8f3ec; color: #2f7d46; }
        .status-badge.status-draft { background: #f8efe3; color: #8a5a1f; }
        .status-badge.status-archived { background: #edf0f2; color: #62707c; }
        .role-chip { display: inline-block; margin-left: 0.45rem; padding: 0.15rem 0.45rem; border-radius: 999px; background: rgba(155,216,170,0.2); color: #9bd8aa; font-size: 0.72rem; text-transform: capitalize; }
      `}</style>
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete announcement"
        message={`Delete "${deleteTarget?.title || 'this announcement'}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminAnnouncements;
