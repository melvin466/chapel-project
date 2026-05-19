import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import  eventService  from '../services/eventService';
import userService  from '../services/userService';
import  donationService  from '../services/donationService';

const AdminExport = () => {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState('events');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setMessage('');
    setError('');
    try {
      let data;
      let filename;
      
      switch(exportType) {
        case 'events':
          const eventsRes = await eventService.getEvents({ limit: 1000 });
          data = eventsRes.data?.events || [];
          filename = 'events_export.json';
          break;
        case 'users':
          const usersRes = await userService.getUsers();
          data = usersRes.data?.users || [];
          filename = 'users_export.json';
          break;
        case 'donations':
          const donationsRes = await donationService.getDonations();
          data = donationsRes.data?.donations || [];
          filename = 'donations_export.json';
          break;
        default:
          data = [];
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setMessage('Export completed.');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-container">
      <div className="export-card">
        <h1>📊 Export Data</h1>
        <p>Export your chapel data to JSON format for backup or analysis.</p>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        <div className="export-options">
          <label className="export-option">
            <input type="radio" name="exportType" value="events" checked={exportType === 'events'} onChange={(e) => setExportType(e.target.value)} />
            <span>📅 Events</span>
          </label>
          <label className="export-option">
            <input type="radio" name="exportType" value="users" checked={exportType === 'users'} onChange={(e) => setExportType(e.target.value)} />
            <span>👥 Users</span>
          </label>
          <label className="export-option">
            <input type="radio" name="exportType" value="donations" checked={exportType === 'donations'} onChange={(e) => setExportType(e.target.value)} />
            <span>💰 Donations</span>
          </label>
        </div>
        
        <div className="export-actions">
          <button type="button" onClick={() => navigate('/admin')} className="btn-secondary">Cancel</button>
          <button onClick={handleExport} disabled={exporting} className="btn-primary">
            {exporting ? 'Exporting...' : 'Export Now'}
          </button>
        </div>
      </div>

      <style>{`
        .export-container { min-height: 80vh; display: flex; justify-content: center; align-items: center; padding: 2rem; background: linear-gradient(135deg, #667eea, #764ba2); }
        .export-card { background: linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08)); border-radius: 8px; padding: 2rem; max-width: 500px; width: 100%; text-align: center; border: 1px solid rgba(255,255,255,0.22); backdrop-filter: blur(22px) saturate(130%); }
        .export-card h1 { color: #333; margin-bottom: 1rem; }
        .export-card p { color: #666; margin-bottom: 2rem; }
        .export-options { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
        .export-option { display: flex; align-items: center; gap: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 12px; cursor: pointer; transition: all 0.3s; }
        .export-option:hover { background: #f5f5f5; border-color: #4CAF50; }
        .export-option input { width: 20px; height: 20px; cursor: pointer; }
        .export-option span { font-size: 1.1rem; }
        .export-actions { display: flex; gap: 1rem; justify-content: center; }
        .btn-primary { background: #4CAF50; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
        .btn-secondary { background: #9e9e9e; color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; cursor: pointer; }
      `}</style>
    </div>
  );
};

export default AdminExport;
