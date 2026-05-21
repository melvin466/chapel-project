import React, { useEffect, useState } from 'react';
import cellService from '../services/cellService';
import { useAuth } from '../context/AuthContext';

const CellsPage = () => {
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [joinedCellId, setJoinedCellId] = useState('');
  const [pendingCellId, setPendingCellId] = useState('');
  const { user, isAuthenticated, isAdmin, refreshUser } = useAuth();

  const currentCellId = joinedCellId || user?.cellId?._id || user?.cellId || '';

  useEffect(() => {
    loadCells();
  }, [zone]);

  useEffect(() => {
    setJoinedCellId(user?.cellId?._id || user?.cellId || '');
  }, [user]);

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
      const response = await cellService.joinCell(cellId);
      setMessage(response.message || (isAdmin ? 'You joined this cell.' : 'Your request to join this cell has been sent.'));

      if (response.data?.joinedDirectly || isAdmin) {
        setJoinedCellId(response.data?.cellId || cellId);
        await refreshUser?.();
      } else {
        setPendingCellId(cellId);
      }

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
      <section className="listing-hero cells-hero">
        <div>
          <span>Cell ministry</span>
          <h1>Cell Groups</h1>
          <p>
            Find the chapel cell group that will help you grow spiritually, connect in prayer, and build fellowship in a smaller church family.
          </p>
        </div>
        <aside>
          <strong>Live in fellowship</strong>
          <p>Each cell is a place for Bible study, ministry care, and regular encouragement as we walk together in faith.</p>
        </aside>
      </section>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="filters">
        <select value={zone} onChange={(e) => setZone(e.target.value === 'All' ? '' : e.target.value)}>
          {zones.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {cells.length === 0 ? (
        <div className="no-data rich-empty">
          <strong>No cell groups found.</strong>
          <span>New cell groups can be added by chapel leaders, and existing groups will appear here when available.</span>
        </div>
      ) : (
        <div className="announcements-list cells-list">
          {cells.map((cell) => {
            const isCurrentCell = currentCellId && currentCellId.toString() === cell._id.toString();
            const hasOtherCell = currentCellId && !isCurrentCell;
            const isPending = pendingCellId === cell._id;
            const buttonLabel = isCurrentCell
              ? 'Already a Member'
              : hasOtherCell
                ? 'Already in a Cell'
                : isPending
                  ? 'Request Sent'
                  : isAdmin
                    ? 'Join Cell'
                    : 'Request to Join';

            return (
              <div key={cell._id} className={`announcement-card cell-announcement-card`}>
                <div className="announcement-header">
                  <span className="announcement-type">{cell.zone || 'Zone'}</span>
                  <span className="announcement-date">{cell.meetingDay} · {cell.meetingTime}</span>
                </div>
                <h2>{cell.name}</h2>
                <p>{cell.description || `Gather at ${cell.meetingVenue} in ${cell.location}. Leader: ${cell.leader?.firstName || ''} ${cell.leader?.lastName || ''}.`}</p>
                <div className="cell-details">
                  <span>{cell.location}</span>
                  <span>{cell.memberCount || 0}/{cell.maxCapacity || 30} members</span>
                </div>
                <button
                  onClick={() => handleJoinCell(cell._id)}
                  className="read-more"
                  disabled={Boolean(isCurrentCell || hasOtherCell || isPending)}
                >
                  {buttonLabel}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .cells-hero {
          min-height: 300px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 1.2rem;
          align-items: end;
          margin: 1rem 0 1.4rem;
          padding: 1.5rem;
          border-radius: 8px;
          overflow: hidden;
          color: white;
          background:
            linear-gradient(90deg, rgba(10,16,21,0.92), rgba(10,16,21,0.58), rgba(10,16,21,0.86)),
            url('https://images.pexels.com/photos/58200/pexels-photo-58200.jpeg?auto=compress&cs=tinysrgb&w=1600');
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 45px rgba(0,0,0,0.24);
        }
        .cells-hero span {
          display: inline-block;
          color: #9bd8aa;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .cells-hero h1 {
          font-size: clamp(2.1rem, 5vw, 4rem);
          line-height: 1;
          margin-bottom: 0.8rem;
        }
        .cells-hero p { max-width: 720px; color: rgba(255,255,255,0.78); }
        .cells-hero aside {
          padding: 1rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(18px);
        }
        .cells-hero aside strong { display: block; color: white; margin-bottom: 0.35rem; }
        .filters { text-align: center; margin-bottom: 2rem; }
        .filters select { padding: 0.75rem 1rem; border-radius: 999px; border: none; background: rgba(255,255,255,0.9); min-width: 180px; }
        .announcements-list, .cells-list { width: min(100%, 980px); margin: 0 auto; padding-bottom: 3rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 1rem; }
        .cell-announcement-card { border-left-color: #6b8e23; }
        .cell-announcement-card h2 { margin-bottom: 0.75rem; color: white; font-size: 1.15rem; line-height: 1.3; }
        .cell-announcement-card p { color: rgba(255,255,255,0.8); margin-bottom: 1rem; line-height: 1.6; font-size: 0.95rem; }
        .cell-details { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; color: rgba(255,255,255,0.72); font-size: 0.9rem; margin-bottom: 1rem; }
        .read-more { background: none; border: 1px solid rgba(255,255,255,0.28); color: #9bd8aa; cursor: pointer; font-weight: 700; transition: all 0.3s; padding: 0.65rem 1rem; border-radius: 999px; margin-top: auto; min-width: 150px; }
        .read-more:disabled { opacity: 0.65; cursor: not-allowed; border-color: rgba(255,255,255,0.15); }
        .cell-announcement-card { background: rgba(10,16,21,0.92); border-radius: 8px; padding: 1.15rem; transition: transform 0.3s; cursor: default; border-left: 4px solid #4CAF50; min-height: 280px; display: flex; flex-direction: column; }
        .cell-announcement-card:hover { transform: translateY(-4px); }
      `}</style>
    </div>
  );
};

export default CellsPage;
