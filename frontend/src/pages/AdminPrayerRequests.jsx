import React, { useEffect, useState } from 'react';
import prayerService from '../services/prayerService';

const AdminPrayerRequests = () => {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState({});

  useEffect(() => {
    loadPrayers();
  }, []);

  const loadPrayers = async () => {
    try {
      setLoading(true);
      const response = await prayerService.getPrayerRequests({ limit: 100 });
      const prayerRequests = response.data?.prayerRequests || [];
      setPrayers(prayerRequests);
      setResponses(
        prayerRequests.reduce((acc, prayer) => {
          acc[prayer._id] = prayer.adminResponse || '';
          return acc;
        }, {})
      );
    } catch (error) {
      console.error('Error loading prayers:', error);
      alert(error.response?.data?.message || 'Failed to load prayer requests');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (id, value) => {
    setResponses((current) => ({ ...current, [id]: value }));
  };

  const handleAnswer = async (id) => {
    const responseText = responses[id]?.trim();
    if (!responseText) {
      alert('Please write an answer before marking this request as answered.');
      return;
    }

    try {
      await prayerService.updatePrayerStatus(id, 'answered', responseText);
      alert('Prayer request answered.');
      loadPrayers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to answer prayer request');
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await prayerService.updatePrayerStatus(id, status);
      alert(`Prayer request marked as ${status}`);
      loadPrayers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this prayer request?')) {
      try {
        await prayerService.deletePrayerRequest(id);
        alert('Prayer request deleted');
        loadPrayers();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete prayer request');
      }
    }
  };

  if (loading) return <div className="loading">Loading prayer requests...</div>;

  return (
    <div className="admin-container admin-prayers-page">
      <div className="admin-header">
        <div>
          <span className="profile-role">Admin prayer desk</span>
          <h1>Prayer Requests</h1>
        </div>
      </div>

      {prayers.length === 0 ? (
        <p className="no-data">No prayer requests found.</p>
      ) : (
        <div className="admin-prayer-grid">
          {prayers.map((prayer) => (
            <article key={prayer._id} className="admin-prayer-card">
              <div className="admin-prayer-topline">
                <span className={`urgency urgency-${prayer.urgency}`}>{prayer.urgency}</span>
                <span className={`status-badge status-${prayer.status}`}>{prayer.status}</span>
              </div>

              <h2>{prayer.title}</h2>
              <p className="admin-prayer-description">{prayer.description}</p>

              <div className="admin-prayer-meta">
                <span>
                  <strong>From</strong>
                  {prayer.isAnonymous ? 'Anonymous' : `${prayer.requestedBy?.firstName || ''} ${prayer.requestedBy?.lastName || ''}`.trim() || 'Member'}
                </span>
                <span>
                  <strong>Category</strong>
                  {prayer.category}
                </span>
                <span>
                  <strong>Date</strong>
                  {new Date(prayer.createdAt).toLocaleDateString()}
                </span>
              </div>

              {prayer.status === 'answered' && prayer.adminResponse && (
                <div className="admin-answer-preview">
                  <strong>Admin response</strong>
                  <p>{prayer.adminResponse}</p>
                  {prayer.answeredBy && (
                    <span>Answered by {prayer.answeredBy.firstName} {prayer.answeredBy.lastName}</span>
                  )}
                </div>
              )}

              {prayer.status !== 'closed' && (
                <label className="admin-response-box">
                  Answer
                  <textarea
                    rows="4"
                    placeholder="Write a pastoral/admin response..."
                    value={responses[prayer._id] || ''}
                    onChange={(e) => handleResponseChange(prayer._id, e.target.value)}
                  />
                </label>
              )}

              <div className="admin-prayer-actions">
                <button onClick={() => handleAnswer(prayer._id)} className="btn-answer">
                  Send Answer
                </button>
                {prayer.status === 'answered' ? (
                  <button onClick={() => handleStatusUpdate(prayer._id, 'active')} className="btn-reopen">
                    Reopen
                  </button>
                ) : (
                  <button onClick={() => handleStatusUpdate(prayer._id, 'closed')} className="btn-secondary">
                    Close
                  </button>
                )}
                <button onClick={() => handleDelete(prayer._id)} className="btn-delete">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <style>{`
        .admin-prayers-page { max-width: 1200px; }
        .admin-prayer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }
        .admin-prayer-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08));
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 8px;
          padding: 1.2rem;
          backdrop-filter: blur(22px) saturate(130%);
          box-shadow: 0 18px 45px rgba(0,0,0,0.22);
          overflow: hidden;
        }
        .admin-prayer-topline, .admin-prayer-actions, .admin-prayer-meta { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .admin-prayer-topline { justify-content: space-between; align-items: center; margin-bottom: 0.8rem; }
        .admin-prayer-card h2 { color: white; font-size: 1.25rem; margin-bottom: 0.55rem; overflow-wrap: anywhere; }
        .admin-prayer-description { color: rgba(255,255,255,0.76); line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
        .admin-prayer-meta { margin: 1rem 0; }
        .admin-prayer-meta span {
          flex: 1 1 120px;
          color: rgba(255,255,255,0.72);
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 0.7rem;
          overflow-wrap: anywhere;
        }
        .admin-prayer-meta strong { display: block; color: white; font-size: 0.78rem; text-transform: uppercase; margin-bottom: 0.2rem; }
        .admin-answer-preview {
          margin: 1rem 0;
          padding: 0.85rem;
          border-radius: 8px;
          background: rgba(47,125,70,0.18);
          border: 1px solid rgba(155,216,170,0.22);
          color: rgba(255,255,255,0.78);
        }
        .admin-answer-preview strong { display: block; color: #9bd8aa; margin-bottom: 0.35rem; }
        .admin-answer-preview p { white-space: pre-wrap; overflow-wrap: anywhere; }
        .admin-answer-preview span { color: rgba(255,255,255,0.58); font-size: 0.85rem; }
        .admin-response-box { display: grid; gap: 0.45rem; color: rgba(255,255,255,0.78); font-weight: 700; margin: 1rem 0; }
        .admin-response-box textarea {
          width: 100%;
          resize: vertical;
          min-height: 110px;
          border-radius: 8px;
          border: 1px solid rgba(31,41,51,0.16);
          background: rgba(255,255,255,0.84);
          color: #1f2933;
          padding: 0.8rem;
          line-height: 1.5;
        }
        .admin-prayer-actions { margin-top: 1rem; }
        .admin-prayer-actions button { border: 0; border-radius: 8px; color: white; cursor: pointer; padding: 0.55rem 0.85rem; }
        .btn-answer { background: #2f7d46; }
        .btn-reopen { background: #8a5a1f; }
        .btn-delete { background: #c2413a; }
        .status-active { background: rgba(49,95,114,0.85); color: white; }
        .status-answered { background: rgba(47,125,70,0.9); color: white; }
        .status-closed { background: rgba(98,112,124,0.9); color: white; }
      `}</style>
    </div>
  );
};

export default AdminPrayerRequests;
