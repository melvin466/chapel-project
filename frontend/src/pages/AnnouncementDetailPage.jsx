import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { announcementService } from '../services/announcementService';

const AnnouncementDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnnouncement();
  }, [id]);

  const loadAnnouncement = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await announcementService.getAnnouncementById(id);
      setAnnouncement(response.data.announcement);
    } catch (error) {
      console.error('Error loading announcement:', error);
      setError('Failed to load announcement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading announcement...</div>;
  if (error) return <div className="error-container"><p>{error}</p><button onClick={loadAnnouncement} className="btn-primary">Retry</button></div>;
  if (!announcement) return <div className="container"><p>Announcement not found</p><button onClick={() => navigate('/announcements')} className="btn-secondary">Back</button></div>;

  return (
    <div className="container">
      <button onClick={() => navigate('/announcements')} className="btn-secondary" style={{ marginBottom: '1rem' }}>
        ← Back to Announcements
      </button>
      
      <div className="announcement-detail">
        <div className="announcement-header">
          <span className={`priority-badge priority-${announcement.priority || 'normal'}`}>
            {announcement.priority || 'Normal'}
          </span>
          <span className="announcement-date">
            {new Date(announcement.publishDate).toLocaleDateString()}
          </span>
        </div>
        
        <h1>{announcement.title}</h1>
        
        <div className="announcement-content">
          <p>{announcement.content}</p>
        </div>
        
        {announcement.createdBy && (
          <div className="announcement-author">
            <p>Posted by: {announcement.createdBy.firstName} {announcement.createdBy.lastName}</p>
          </div>
        )}
      </div>

      <style>{`
        .announcement-detail {
          background: rgba(255,255,255,0.95);
          border-radius: 16px;
          padding: 2rem;
          margin: 1rem 0;
        }
        .announcement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .priority-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: bold;
        }
        .priority-high, .priority-critical { background: #f44336; color: white; }
        .priority-medium { background: #ff9800; color: white; }
        .priority-low { background: #4CAF50; color: white; }
        .announcement-date { color: #888; font-size: 0.85rem; }
        .announcement-detail h1 { color: #333; margin: 1rem 0; }
        .announcement-content { margin: 1.5rem 0; line-height: 1.8; color: #444; }
        .announcement-author { padding-top: 1rem; border-top: 1px solid #eee; color: #999; font-size: 0.85rem; }
      `}</style>
    </div>
  );
};

export default AnnouncementDetailPage;