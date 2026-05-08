import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sermonService } from '../services/sermonService';

const SermonsPage = () => {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSermons();
  }, []);

  const loadSermons = async () => {
    try {
      const response = await sermonService.getSermons();
      setSermons(response.data?.sermons || []);
    } catch (error) {
      console.error('Error loading sermons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading sermons...</div>;

  return (
    <div className="container">
      <h1 className="page-title">Sermons</h1>
      {sermons.length === 0 ? (
        <p className="no-data">No sermons found.</p>
      ) : (
        <div className="sermons-grid">
          {sermons.map(sermon => (
            <div key={sermon._id} className="sermon-card" onClick={() => navigate(`/sermons/${sermon._id}`)}>
              <div className="sermon-icon">🎙️</div>
              <div className="sermon-content">
                <h3>{sermon.title}</h3>
                <p className="sermon-speaker">{sermon.speaker}</p>
                <p className="sermon-date">{new Date(sermon.date).toLocaleDateString()}</p>
                <p className="sermon-description">{sermon.description?.substring(0, 100)}...</p>
                <div className="sermon-stats">
                  <span>👁️ {sermon.views || 0}</span>
                  <span>❤️ {sermon.likes?.length || 0}</span>
                </div>
                <button className="btn-secondary">Listen Now</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .sermons-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem; }
        .sermon-card { background: rgba(255,255,255,0.95); border-radius: 12px; padding: 1.5rem; transition: transform 0.3s; cursor: pointer; display: flex; gap: 1rem; align-items: center; }
        .sermon-card:hover { transform: translateY(-5px); }
        .sermon-icon { font-size: 3rem; }
        .sermon-content { flex: 1; }
        .sermon-content h3 { color: #333; margin-bottom: 0.5rem; }
        .sermon-speaker, .sermon-date { color: #666; font-size: 0.85rem; margin-bottom: 0.25rem; }
        .sermon-description { color: #888; margin: 0.5rem 0; font-size: 0.85rem; }
        .sermon-stats { display: flex; gap: 1rem; margin: 0.5rem 0; color: #999; font-size: 0.8rem; }
        @media (max-width: 768px) { .sermon-card { flex-direction: column; text-align: center; } }
      `}</style>
    </div>
  );
};

export default SermonsPage;