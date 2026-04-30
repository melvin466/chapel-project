import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { announcementService } from '../services/announcementService';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const response = await announcementService.getAnnouncements({ limit: 50 });
      setAnnouncements(response.data?.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  if (loading) return <div className="loading">Loading announcements...</div>;

  return (
    <div className="container">
      <h1 className="page-title">Announcements</h1>
      
      {announcements.length === 0 ? (
        <p className="no-data">No announcements found.</p>
      ) : (
        <div className="announcements-list">
          {announcements.map(announcement => (
            <div 
              key={announcement._id} 
              className={`announcement-card ${getPriorityClass(announcement.priority)}`}
              onClick={() => navigate(`/announcements/${announcement._id}`)}
            >
              <div className="announcement-header">
                <span className="announcement-type">{announcement.type || 'General'}</span>
                <span className="announcement-date">
                  {new Date(announcement.publishDate).toLocaleDateString()}
                </span>
              </div>
              <h2>{announcement.title}</h2>
              <p>{announcement.content?.substring(0, 200)}...</p>
              <button className="read-more">Read More →</button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .page-title {
          text-align: center;
          font-size: 2.5rem;
          margin: 2rem 0;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .announcements-list {
          max-width: 800px;
          margin: 0 auto;
          padding-bottom: 3rem;
        }
        .announcement-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1rem;
          transition: transform 0.3s;
          cursor: pointer;
          border-left: 4px solid #4CAF50;
        }
        .announcement-card:hover {
          transform: translateX(10px);
        }
        .priority-critical { border-left-color: #f44336; }
        .priority-high { border-left-color: #ff9800; }
        .priority-medium { border-left-color: #2196F3; }
        .priority-low { border-left-color: #4CAF50; }
        .announcement-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .announcement-type {
          background: #e0e0e0;
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          text-transform: uppercase;
        }
        .announcement-date {
          color: #888;
          font-size: 0.8rem;
        }
        .announcement-card h2 {
          margin-bottom: 0.5rem;
          color: #333;
          font-size: 1.2rem;
        }
        .announcement-card p {
          color: #666;
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        .read-more {
          background: none;
          border: none;
          color: #4CAF50;
          cursor: pointer;
          font-weight: 500;
          transition: color 0.3s;
        }
        .read-more:hover {
          color: #45a049;
        }
        .loading {
          text-align: center;
          padding: 3rem;
          color: white;
          font-size: 1.2rem;
        }
        .no-data {
          text-align: center;
          padding: 3rem;
          color: white;
          background: rgba(0,0,0,0.5);
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementsPage;