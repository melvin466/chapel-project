import React, { useState, useEffect } from 'react';
import prayerService from '../services/prayerService';

const AdminPrayerRequests = () => {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrayers();
  }, []);

  const loadPrayers = async () => {
    try {
      const response = await prayerService.getPrayerRequests();
      setPrayers(response.data?.prayerRequests || []);
    } catch (error) {
      console.error('Error loading prayers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await prayerService.updatePrayerStatus(id, status);
      alert(`Prayer request marked as ${status}`);
      loadPrayers();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this prayer request?')) {
      try {
        await prayerService.deletePrayerRequest(id);
        alert('Prayer request deleted');
        loadPrayers();
      } catch (error) {
        alert('Failed to delete');
      }
    }
  };

  if (loading) return <div className="loading">Loading prayer requests...</div>;

  return (
    <div className="admin-container">
      <h1>Manage Prayer Requests</h1>
      
      {prayers.length === 0 ? (
        <p>No prayer requests found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Urgency</th>
              <th>Status</th>
              <th>Prayers</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prayers.map(prayer => (
              <tr key={prayer._id}>
                <td>{prayer.title}</td>
                <td>
                  <span className={`urgency-${prayer.urgency}`}>
                    {prayer.urgency}
                  </span>
                </td>
                <td>
                  <span className={`status-${prayer.status}`}>
                    {prayer.status}
                  </span>
                </td>
                <td>{prayer.prayerCount || 0}</td>
                <td>{new Date(prayer.createdAt).toLocaleDateString()}</td>
                <td>
                  {prayer.status === 'active' && (
                    <button 
                      onClick={() => handleStatusUpdate(prayer._id, 'answered')} 
                      className="btn-answer"
                    >
                      Mark Answered
                    </button>
                  )}
                  {prayer.status === 'answered' && (
                    <button 
                      onClick={() => handleStatusUpdate(prayer._id, 'active')} 
                      className="btn-reopen"
                    >
                      Reopen
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(prayer._id)} 
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style>{`
        .admin-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
        .admin-container h1 { color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); margin-bottom: 2rem; }
        .admin-table { width: 100%; background: rgba(255,255,255,0.95); border-radius: 12px; overflow: hidden; }
        .admin-table th, .admin-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #eee; }
        .admin-table th { background: #4CAF50; color: white; }
        .admin-table tr:hover { background: #f5f5f5; }
        .urgency-critical { color: #f44336; font-weight: bold; }
        .urgency-urgent { color: #ff9800; font-weight: bold; }
        .urgency-normal { color: #4CAF50; }
        .status-active { color: #2196F3; }
        .status-answered { color: #4CAF50; }
        .btn-answer { background: #4CAF50; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem; }
        .btn-reopen { background: #ff9800; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem; }
        .btn-delete { background: #f44336; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AdminPrayerRequests;