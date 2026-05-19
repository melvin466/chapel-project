import React, { useEffect, useState } from 'react';
import sermonService from '../services/sermonService';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyForm = {
  title: '',
  speaker: '',
  date: '',
  serviceType: 'sunday',
  description: '',
  bibleVerses: '',
  tags: '',
  series: '',
  duration: '',
  audioUrl: '',
  videoUrl: '',
};

const emptyFiles = {
  thumbnail: null,
  sermonAudio: null,
  sermonVideo: null,
};

const AdminSermons = () => {
  const { isAdmin } = useAuth();
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [files, setFiles] = useState(emptyFiles);

  useEffect(() => {
    loadSermons();
  }, []);

  const loadSermons = async () => {
    try {
      setLoading(true);
      const response = await sermonService.getManageSermons({ limit: 100 });
      setSermons(response.data?.sermons || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sermons');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData(emptyForm);
    setFiles(emptyFiles);
  };

  const handleEdit = (sermon) => {
    setEditing(sermon);
    setMessage('');
    setError('');
    setFormData({
      title: sermon.title || '',
      speaker: sermon.speaker || '',
      date: sermon.date?.split('T')[0] || '',
      serviceType: sermon.serviceType || 'sunday',
      description: sermon.description || '',
      bibleVerses: sermon.bibleVerses?.join(', ') || '',
      tags: sermon.tags?.join(', ') || '',
      series: sermon.series || '',
      duration: sermon.duration || '',
      audioUrl: sermon.audioUrl || '',
      videoUrl: sermon.videoUrl || '',
    });
    setFiles(emptyFiles);
  };

  const buildPayload = () => {
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => payload.append(key, value ?? ''));
    Object.entries(files).forEach(([key, file]) => {
      if (file) payload.append(key, file);
    });
    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      if (editing) {
        await sermonService.updateSermon(editing._id, buildPayload());
        setMessage('Sermon updated.');
      } else {
        await sermonService.createSermon(buildPayload());
        setMessage('Sermon created.');
      }
      resetForm();
      loadSermons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save sermon');
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (sermon) => {
    if (!isAdmin) return;
    setDeleteTarget(sermon);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await sermonService.deleteSermon(deleteTarget._id);
      setMessage('Sermon deleted.');
      setDeleteTarget(null);
      loadSermons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete sermon');
    }
  };

  if (loading) return <div className="loading">Loading sermons...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Manage Sermons</h1>
        {editing && <button className="btn-secondary" onClick={resetForm}>New Sermon</button>}
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <section className="admin-form">
        <h2>{editing ? 'Edit Sermon' : 'Create Sermon'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input name="title" placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <input name="speaker" placeholder="Speaker" value={formData.speaker} onChange={(e) => setFormData({ ...formData, speaker: e.target.value })} required />
            <input type="date" name="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <textarea name="description" rows="4" placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
          <div className="form-row">
            <select name="serviceType" value={formData.serviceType} onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}>
              <option value="sunday">Sunday</option>
              <option value="wednesday">Wednesday</option>
              <option value="friday">Friday</option>
              <option value="conference">Conference</option>
              <option value="special">Special</option>
            </select>
            <input name="series" placeholder="Series" value={formData.series} onChange={(e) => setFormData({ ...formData, series: e.target.value })} />
            <input type="number" min="0" name="duration" placeholder="Duration in minutes" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
          </div>
          <input name="bibleVerses" placeholder="Bible verses, comma separated" value={formData.bibleVerses} onChange={(e) => setFormData({ ...formData, bibleVerses: e.target.value })} />
          <input name="tags" placeholder="Tags, comma separated" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} />
          <div className="form-row">
            <input name="audioUrl" placeholder="Audio URL (optional if uploading)" value={formData.audioUrl} onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })} />
            <input name="videoUrl" placeholder="Video URL (optional if uploading)" value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} />
          </div>
          <div className="media-upload-section">
            <label>Thumbnail image<input type="file" accept="image/*" onChange={(e) => setFiles({ ...files, thumbnail: e.target.files[0] || null })} /></label>
            <label>Voice/music audio<input type="file" accept="audio/*,.webm" onChange={(e) => setFiles({ ...files, sermonAudio: e.target.files[0] || null })} /></label>
            <label>Sermon video<input type="file" accept="video/*" onChange={(e) => setFiles({ ...files, sermonVideo: e.target.files[0] || null })} /></label>
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update Sermon' : 'Create Sermon'}</button>
        </form>
      </section>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Speaker</th><th>Date</th><th>Media</th><th>Actions</th></tr></thead>
          <tbody>
            {sermons.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center' }}>No sermons found</td></tr>
            ) : sermons.map((sermon) => (
              <tr key={sermon._id}>
                <td>{sermon.title}</td>
                <td>{sermon.speaker}</td>
                <td>{sermon.date ? new Date(sermon.date).toLocaleDateString() : '-'}</td>
                <td>{[sermon.audioUrl && 'Audio', sermon.videoUrl && 'Video', sermon.thumbnail && 'Thumbnail'].filter(Boolean).join(', ') || '-'}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(sermon)}>Edit</button>
                  {isAdmin && <button className="btn-delete" onClick={() => requestDelete(sermon)}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .admin-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .admin-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
        .admin-header h1 { color: white; }
        .admin-form, .admin-table-container { background: rgba(255,255,255,0.96); border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; overflow-x: auto; }
        .admin-form h2 { color: #1f2933; margin-bottom: 1rem; }
        .admin-form form { display: grid; gap: 1rem; }
        .form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .form-row > *, .admin-form input, .admin-form textarea, .admin-form select { flex: 1 1 180px; min-width: 0; width: 100%; padding: 0.8rem; border: 1px solid rgba(31,41,51,0.16); border-radius: 8px; color: #1f2933; background: rgba(255,255,255,0.84); }
        .media-upload-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.75rem; }
        .media-upload-section label { display: grid; gap: 0.4rem; font-weight: 600; color: #1f2933; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 0.9rem; border-bottom: 1px solid #eee; text-align: left; color: #1f2933; }
        .admin-table th { background: #1f2933; color: white; }
        .btn-edit, .btn-delete, .btn-secondary { padding: 0.4rem 0.75rem; margin: 0.15rem; border: 0; border-radius: 6px; cursor: pointer; color: white; }
        .btn-edit { background: #315f72; }
        .btn-delete { background: #c2413a; }
        .btn-secondary { background: #4c5f7a; }
      `}</style>
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete sermon"
        message={`Delete "${deleteTarget?.title || 'this sermon'}"? This cannot be undone.`}
        confirmLabel="Delete"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default AdminSermons;
