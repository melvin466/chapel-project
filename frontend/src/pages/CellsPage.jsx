import React, { useState, useEffect } from 'react';
import  cellService  from '../services/cellService';
import { useAuth } from '../context/AuthContext';

const CellsPage = () => {
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    loadCells();
  }, [zone]);

  const loadCells = async () => {
    try {
      const params = zone ? { zone } : {};
      const response = await cellService.getCells(params);
      setCells(response.data?.cells || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load cell groups.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCell = async (cellId) => {
    if (!isAuthenticated) {
      setError('Please log in to join a cell.');
      return;
    }
    try {
      await cellService.joinCell(cellId);
      setMessage('Your request to join this cell has been sent.');
      setError('');
      loadCells();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to join cell');
    }
  };

  const zones = ['All', 'North', 'South', 'East', 'West', 'Central'];

  if (loading) return <div className="loading">Loading cell groups...</div>;

  return (
    <div className="container">
      <h1 className="page-title">Cell Groups</h1>
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="filters">
        <select value={zone} onChange={(e) => setZone(e.target.value === 'All' ? '' : e.target.value)}>
          {zones.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
      </div>
      
      {cells.length === 0 ? (
        <p className="no-data">No cell groups found.</p>
      ) : (
        <div className="cells-grid">
          {cells.map(cell => (
            <div key={cell._id} className="cell-card">
              <h3>{cell.name}</h3>
              <p className="cell-zone">📍 Zone: {cell.zone}</p>
              <p>🏠 Location: {cell.location}</p>
              <p>📅 Meeting: {cell.meetingDay} at {cell.meetingTime}</p>
              <p>📍 Venue: {cell.meetingVenue}</p>
              <p>👥 Members: {cell.memberCount || 0} / {cell.maxCapacity || 30}</p>
              {cell.leader && <p>👤 Leader: {cell.leader.firstName} {cell.leader.lastName}</p>}
              <button onClick={() => handleJoinCell(cell._id)} className="btn-primary">Request to Join</button>
            </div>
          ))}
        </div>
      )}
      
      <style>{`
        .filters { text-align: center; margin-bottom: 2rem; }
        .filters select { padding: 0.6rem 1rem; border-radius: 8px; border: none; background: rgba(255,255,255,0.9); }
        .cells-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; }
        .cell-card { background: rgba(255,255,255,0.95); border-radius: 12px; padding: 1.5rem; transition: transform 0.3s; }
        .cell-card:hover { transform: translateY(-5px); }
        .cell-card h3 { color: #333; margin-bottom: 0.5rem; }
        .cell-zone { color: #4CAF50; font-weight: bold; margin-bottom: 1rem; }
        .cell-card p { color: #666; margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
};

export default CellsPage;
