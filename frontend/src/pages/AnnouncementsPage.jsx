import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import announcementService from '../services/announcementService';
import api from '../services/api';

const announcementFallbackImage = 'https://images.pexels.com/photos/208315/pexels-photo-208315.jpeg?auto=compress&cs=tinysrgb&w=900';

const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const normalizedPath = path.replace(/\\/g, '/');
  const uploadPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${encodeURI(uploadPath)}`;
};

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
    switch (priority) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  if (loading) return <div className="loading">Loading announcements...</div>;

  return (
    <div className="container">
      <section className="listing-hero announcements-hero">
        <div>
          <span>Chapel notices</span>
          <h1>Announcements</h1>
          <p>
            Stay close to the life of the chapel: service updates, ministry news, prayer notes,
            and the small details that help our community move together.
          </p>
        </div>
        <aside>
          <strong>Keep in step</strong>
          <p>Check here before services, fellowships, and special gatherings so you do not miss important updates.</p>
        </aside>
      </section>

      {announcements.length === 0 ? (
        <div className="no-data rich-empty">
          <strong>No announcements right now.</strong>
          <span>When the chapel team posts new updates, they will appear here.</span>
        </div>
      ) : (
        <div className="announcements-list">
          {announcements.map((announcement) => (
            <div
              key={announcement._id}
              className={`announcement-card ${getPriorityClass(announcement.priority)}`}
              onClick={() => navigate(`/announcements/${announcement._id}`)}
            >
              <img
                src={announcement.featuredImage ? getMediaUrl(announcement.featuredImage) : announcementFallbackImage}
                alt=""
                className="announcement-image"
                loading="lazy"
              />
              <div className="announcement-header">
                <span className="announcement-type">{announcement.type || 'General'}</span>
                <span className="announcement-date">
                  {new Date(announcement.publishDate || announcement.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2>{announcement.title}</h2>
              <p>{announcement.content?.substring(0, 200)}...</p>
              <button className="read-more">Read More</button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .listing-hero {
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
            url('https://images.pexels.com/photos/208315/pexels-photo-208315.jpeg?auto=compress&cs=tinysrgb&w=1600');
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 45px rgba(0,0,0,0.24);
        }
        .listing-hero span {
          display: inline-block;
          color: #9bd8aa;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .listing-hero h1 {
          font-size: clamp(2.1rem, 5vw, 4rem);
          line-height: 1;
          margin-bottom: 0.8rem;
        }
        .listing-hero p {
          max-width: 720px;
          color: rgba(255,255,255,0.78);
        }
        .listing-hero aside {
          padding: 1rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(18px);
        }
        .listing-hero aside strong {
          display: block;
          color: white;
          margin-bottom: 0.35rem;
        }
        .announcements-list {
          width: min(100%, 980px);
          margin: 0 auto;
          padding-bottom: 3rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
          gap: 1rem;
        }
        .announcement-card {
          max-width: 100%;
          overflow: hidden;
          border-radius: 8px;
          padding: 1rem;
          transition: transform 0.3s;
          cursor: pointer;
          border-left: 4px solid #4CAF50;
          min-height: 250px;
          display: flex;
          flex-direction: column;
        }
        .announcement-card:hover {
          transform: translateY(-4px);
        }
        .announcement-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 1rem;
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
          background: rgba(155,216,170,0.16);
          color: #9bd8aa;
          border: 1px solid rgba(155,216,170,0.22);
          padding: 0.2rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
          text-transform: uppercase;
        }
        .announcement-date {
          color: rgba(255,255,255,0.64);
          font-size: 0.8rem;
        }
        .announcement-card h2 {
          margin-bottom: 0.5rem;
          color: white;
          font-size: 1.05rem;
          line-height: 1.25;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .announcement-card p {
          color: rgba(255, 255, 255, 0.74);
          margin-bottom: 1rem;
          line-height: 1.5;
          font-size: 0.92rem;
          overflow-wrap: anywhere;
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .read-more {
          background: none;
          border: none;
          color: #9bd8aa;
          cursor: pointer;
          font-weight: 700;
          transition: color 0.3s;
          margin-top: auto;
          align-self: flex-start;
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
        @media (max-width: 760px) {
          .listing-hero {
            grid-template-columns: 1fr;
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default AnnouncementsPage;

