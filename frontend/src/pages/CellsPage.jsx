import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import cellService from '../services/cellService';
import { useAuth } from '../context/AuthContext';
import '../styles/searchBar.css';

const zones = ['All', 'North', 'South', 'East', 'West', 'Central'];

const CellsPage = () => {
  const navigate = useNavigate();
  const [cells, setCells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [joinedCellId, setJoinedCellId] = useState('');
  const [pendingCellId, setPendingCellId] = useState('');
  const { user, isAuthenticated, hasAdminPower, refreshUser } = useAuth();

  const currentCellId = (joinedCellId || user?.cellId?._id || user?.cellId || '').toString();

  useEffect(() => {
    loadCells();
  }, [zone]);

  useEffect(() => {
    setJoinedCellId(user?.cellId?._id || user?.cellId || '');
  }, [user]);

  const loadCells = async () => {
    try {
      setLoading(true);
      const params = zone ? { zone } : {};
      const response = await cellService.getCells(params);
      setCells(response.data?.cells || []);
      setJoinedCellId(response.data?.viewer?.cellId || '');
      setPendingCellId(response.data?.viewer?.pendingCellId || '');
      setError('');
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Failed to load cell groups.');
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
      setMessage(response.message || (hasAdminPower ? 'You joined this cell.' : 'Your request to join this cell has been sent.'));

      if (response.data?.joinedDirectly || hasAdminPower) {
        setJoinedCellId(response.data?.cellId || cellId);
        await refreshUser?.();
      } else {
        setPendingCellId(cellId);
      }

      setError('');
      loadCells();
    } catch (joinError) {
      setError(joinError.response?.data?.message || 'Failed to join cell');
    }
  };

  const visibleCells = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return cells.filter((cell) => {
      const searchable = [
        cell.name,
        cell.description,
        cell.location,
        cell.zone,
        cell.meetingVenue,
        cell.meetingDay,
        `${cell.leader?.firstName || ''} ${cell.leader?.lastName || ''}`,
      ].filter(Boolean).join(' ').toLowerCase();
      return !normalizedQuery || searchable.includes(normalizedQuery);
    });
  }, [cells, query]);

  const featuredCell = cells[0];

  if (loading) return <div className="loading">Loading cell groups...</div>;

  return (
    <div className="cells-page">
      <section className="cells-feature">
        <div className="cells-feature-copy">
          <span>Find your people</span>
          <h1>{featuredCell ? featuredCell.name : 'Cell groups make chapel feel personal.'}</h1>
          <p>
            Smaller groups create space for Bible study, prayer, friendship, accountability, and steady care during the week.
          </p>
          {featuredCell && (
            <div className="cells-feature-actions">
              <button type="button" className="btn-primary" onClick={() => handleJoinCell(featuredCell._id)}>
                Request to Join
              </button>
              <span>{featuredCell.zone || 'Zone'} · {featuredCell.meetingDay || 'Day to be announced'} · {featuredCell.location || 'Location to be announced'}</span>
            </div>
          )}
        </div>
        <div className="cells-feature-panel">
          <span>How cell groups work</span>
          <div><strong>Meet weekly</strong><p>Share scripture, prayer, and real life with a smaller group.</p></div>
          <div><strong>Request to join</strong><p>A chapel leader reviews requests and helps place you well.</p></div>
          <div><strong>Grow steadily</strong><p>Stay connected beyond Sunday and serve alongside others.</p></div>
        </div>
      </section>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <section className="cells-library">
        <div className="cells-library-heading">
          <div>
            <span>Browse groups</span>
            <h2>Search by zone, leader, meeting day, or location.</h2>
          </div>
          <label className="cells-search">
            <span className="sr-only">Search cell groups</span>
            <input
              type="search"
              placeholder="🔍 Search groups..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search cell groups"
            />
          </label>
        </div>

        <div className="cells-filter-row" aria-label="Cell zone filters">
          {zones.map((item) => (
            <button
              key={item}
              type="button"
              className={(zone || 'All') === item ? 'active' : ''}
              onClick={() => setZone(item === 'All' ? '' : item)}
            >
              {item}
            </button>
          ))}
        </div>

        {visibleCells.length === 0 ? (
          <div className="no-data rich-empty">
            <strong>No cell groups found.</strong>
            <span>Try a different zone, meeting day, leader, or location.</span>
          </div>
        ) : (
          <div className="cells-media-grid">
            {visibleCells.map((cell) => {
              const isCurrentCell = cell.viewerStatus === 'member' || (currentCellId && currentCellId === cell._id.toString());
              const hasOtherCell = currentCellId && !isCurrentCell;
              const isPending = cell.viewerStatus === 'pending' || pendingCellId?.toString() === cell._id.toString();
              const buttonLabel = isCurrentCell
                ? 'Already a Member'
                : hasOtherCell
                  ? 'Already in a Cell'
                  : isPending
                    ? 'Request Sent'
                    : hasAdminPower
                      ? 'Join Cell'
                      : 'Request to Join';

              return (
                <article key={cell._id} className="cell-media-card" onClick={() => navigate(`/cells/${cell._id}`)}>
                  <div className="cell-card-topline">
                    <span>{cell.zone || 'Zone'}</span>
                    <span>{cell.memberCount || 0}/{cell.maxCapacity || 30}</span>
                  </div>
                  <h3>{cell.name}</h3>
                  <p>{cell.description || `Gather at ${cell.meetingVenue || cell.location || 'a chapel location'} for fellowship, prayer, and growth.`}</p>
                  <div className="cell-card-details">
                    <div><strong>When</strong><span>{cell.meetingDay || 'Day TBA'} · {cell.meetingTime || 'Time TBA'}</span></div>
                    <div><strong>Where</strong><span>{cell.location || cell.meetingVenue || 'Location TBA'}</span></div>
                    <div><strong>Leader</strong><span>{`${cell.leader?.firstName || ''} ${cell.leader?.lastName || ''}`.trim() || 'Leader TBA'}</span></div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleJoinCell(cell._id); }}
                    className="cell-join-button"
                    disabled={Boolean(isCurrentCell || hasOtherCell || isPending)}
                  >
                    {buttonLabel}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <style>{`
        .cells-page {
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
          padding-bottom: 3rem;
          color: white;
        }
        .cells-feature {
          min-height: 320px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.74fr);
          gap: 1.1rem;
          align-items: stretch;
          margin: 1rem 0 1.2rem;
        }
        .cells-feature-copy,
        .cells-feature-panel,
        .cells-library {
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: var(--glass-panel);
          box-shadow: var(--shadow-deep);
          backdrop-filter: blur(22px) saturate(130%);
          overflow: hidden;
        }
        .cells-feature-copy {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          background:
            linear-gradient(135deg, rgba(47,125,70,0.16), rgba(49,95,114,0.12)),
            var(--glass-panel);
        }
        .cells-feature-copy > span,
        .cells-feature-panel > span,
        .cells-library-heading span {
          color: var(--brand-soft);
          display: inline-block;
          font-size: 0.76rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 0.55rem;
        }
        .cells-feature-copy h1 {
          max-width: 760px;
          font-size: clamp(2.35rem, 5vw, 4.6rem);
          line-height: 0.98;
          margin-bottom: 0.9rem;
        }
        .cells-feature-copy p {
          max-width: 680px;
          color: rgba(255,255,255,0.78);
          font-size: 1.05rem;
        }
        .cells-feature-actions {
          display: flex;
          gap: 0.9rem;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }
        .cells-feature-actions span {
          color: rgba(255,255,255,0.72);
          font-weight: 700;
        }
        .cells-feature-panel {
          display: grid;
          align-content: end;
          gap: 0.75rem;
          padding: 1.2rem;
        }
        .cells-feature-panel div {
          padding: 0.9rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.13);
        }
        .cells-feature-panel strong,
        .cells-feature-panel p {
          display: block;
        }
        .cells-feature-panel p {
          color: rgba(255,255,255,0.72);
        }
        .cells-library {
          padding: 1.2rem;
        }
        .cells-library-heading {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
          gap: 1rem;
          align-items: end;
          margin-bottom: 1rem;
        }
        .cells-library-heading h2 {
          font-size: clamp(1.6rem, 3vw, 2.45rem);
          line-height: 1.05;
        }
        .cells-search input {
          min-height: 48px;
          margin: 0;
        }
        .cells-filter-row {
          display: flex;
          gap: 0.55rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .cells-filter-row button {
          min-height: 38px;
          border-radius: 999px;
          padding: 0.45rem 0.8rem;
          border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.08);
          cursor: pointer;
          font-weight: 800;
        }
        .cells-filter-row button.active,
        .cells-filter-row button:hover {
          color: white;
          border-color: rgba(155,216,170,0.42);
          background: rgba(47,125,70,0.28);
        }
        .cells-media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 290px), 1fr));
          gap: 1rem;
        }
        .cell-media-card {
          display: flex;
          flex-direction: column;
          padding: 1rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          transition: transform 0.2s ease, background 0.2s ease;
          cursor: pointer;
        }
        @media (max-width: 768px) {
          .cell-media-card {
            min-height: 300px;
          }
        }
        .cell-media-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.12);
        }
        .cell-card-topline {
          display: flex;
          justify-content: space-between;
          gap: 0.7rem;
          margin-bottom: 0.9rem;
        }
        .cell-card-topline span {
          padding: 0.28rem 0.62rem;
          border-radius: 999px;
          background: rgba(155,216,170,0.14);
          border: 1px solid rgba(155,216,170,0.22);
          color: var(--brand-soft);
          font-size: 0.76rem;
          font-weight: 900;
        }
        .cell-media-card h3 {
          color: white;
          font-size: 1.32rem;
          line-height: 1.1;
          margin-bottom: 0.65rem;
        }
        .cell-media-card > p {
          color: rgba(255,255,255,0.72);
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        .cell-card-details {
          display: grid;
          gap: 0.6rem;
          margin-top: auto;
          margin-bottom: 1rem;
        }
        .cell-card-details div {
          padding: 0.7rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.11);
        }
        .cell-card-details strong,
        .cell-card-details span {
          display: block;
        }
        .cell-card-details strong {
          color: white;
          font-size: 0.78rem;
          text-transform: uppercase;
        }
        .cell-card-details span {
          color: rgba(255,255,255,0.7);
        }
        .cell-join-button {
          min-height: 42px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.18);
          color: white;
          background: linear-gradient(135deg, var(--brand), var(--brand-strong));
          cursor: pointer;
          font-weight: 900;
        }
        .cell-join-button:disabled {
          cursor: not-allowed;
          opacity: 0.62;
          background: rgba(255,255,255,0.12);
        }
        .rich-empty {
          display: grid;
          gap: 0.35rem;
        }
        .rich-empty strong {
          color: white;
          font-size: 1.2rem;
        }
        .rich-empty span {
          color: rgba(255,255,255,0.72);
        }
        @media (max-width: 860px) {
          .cells-feature,
          .cells-library-heading {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 620px) {
          .cells-page {
            width: min(100% - 32px, 1200px);
          }
          .cells-feature-copy h1 {
            font-size: 2.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CellsPage;
