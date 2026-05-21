import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import  announcementService  from '../services/announcementService';
import api from '../services/api';

const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const normalizedPath = path.replace(/\\/g, '/');
  const uploadPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${encodeURI(uploadPath)}`;
};

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
        {announcement.featuredImage && (
          <img src={getMediaUrl(announcement.featuredImage)} alt={announcement.title} className="announcement-media-image" />
        )}
        {announcement.announcementVideo && (
          <video src={getMediaUrl(announcement.announcementVideo)} controls preload="metadata" className="announcement-media-video" />
        )}
        
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
          max-width: 100%;
          overflow: hidden;
          border-radius: 8px;
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
        .announcement-date { color: rgba(255, 255, 255, 0.72); font-size: 0.85rem; }
        .announcement-detail h1 {
          color: white;
          margin: 1rem 0;
          max-width: 100%;
          overflow-wrap: anywhere;
          word-break: break-word;
          line-height: 1.15;
        }
        .announcement-media-image, .announcement-media-video {
          width: 100%;
          max-height: 420px;
          object-fit: cover;
          border-radius: 12px;
          margin: 1rem 0;
          background: #111;
        }
        .announcement-content {
          max-width: 100%;
          margin: 1.5rem 0;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.78);
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: pre-wrap;
        }
        .announcement-content p {
          max-width: 100%;
          overflow-wrap: anywhere;
          word-break: break-word;
          white-space: pre-wrap;
        }
        .announcement-author {
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.14);
          color: rgba(255, 255, 255, 0.64);
          font-size: 0.85rem;
          overflow-wrap: anywhere;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementDetailPage;
