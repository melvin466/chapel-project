import React, { useState, useEffect } from 'react';
import { announcementService } from '../services/announcementService';

const AdminAnnouncements = () => {
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

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getAnnouncements({ limit: 100 });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await announcementService.updateAnnouncement(editingItem._id, formData);
        alert('Announcement updated!');
      } else {
        await announcementService.createAnnouncement(formData);
        alert('Announcement created!');
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({ title: '', content: '', summary: '', type: 'general', priority: 'medium', status: 'published' });
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
          {showForm ? 'Cancel' : '+ New Announcement'}
        </button>
      </div>

      {showForm && (
        <div className="admin-form">
          <h2>{editingItem ? 'Edit Announcement' : 'Create Announcement'}</h2>
          <form onSubmit={handleSubmit}>
            <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
            <textarea name="summary" placeholder="Short Summary (optional)" rows="2" value={formData.summary} onChange={handleChange} />
            <textarea name="content" placeholder="Full Content" rows="6" value={formData.content} onChange={handleChange} required />
            
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
                    <button onClick={() => handleDelete(item._id)} className="btn-delete">Delete</button>
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
        .admin-form { background: rgba(255,255,255,0.95); padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        .admin-form form { display: flex; flex-direction: column; gap: 1rem; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .form-row > * { flex: 1; min-width: 150px; }
        .admin-form input, .admin-form textarea, .admin-form select { padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px; }
        .admin-table-container { background: rgba(255,255,255,0.95); border-radius: 12px; overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
        .admin-table th { background: #4CAF50; color: white; }
        .admin-table tr:hover { background: #f5f5f5; }
        .btn-edit, .btn-delete { padding: 0.3rem 0.8rem; margin: 0 0.2rem; border: none; border-radius: 4px; cursor: pointer; }
        .btn-edit { background: #2196F3; color: white; }
        .btn-delete { background: #f44336; color: white; }
        .type-badge, .priority-low, .priority-medium, .priority-high, .priority-critical { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; }
        .type-urgent, .priority-critical { background: #f44336; color: white; }
        .priority-high { background: #ff9800; color: white; }
        .priority-medium { background: #2196F3; color: white; }
        .priority-low { background: #4CAF50; color: white; }
        .status-badge.status-published { background: #4CAF50; color: white; }
        .status-badge.status-draft { background: #ff9800; color: white; }
        .status-badge.status-archived { background: #9e9e9e; color: white; }
      `}</style>
    </div>
  );
};

export default AdminAnnouncements;