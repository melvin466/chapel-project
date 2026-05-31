import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import announcementService from '../services/announcementService';
import { getMediaUrl } from '../utils/media';

const fallbackImage = 'https://images.pexels.com/photos/208315/pexels-photo-208315.jpeg?auto=compress&cs=tinysrgb&w=1600';

const formatDate = (dateString) => {
  if (!dateString) return 'Date to be announced';
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
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
    } catch (loadError) {
      console.error('Error loading announcement:', loadError);
      setError('Failed to load announcement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading announcement...</div>;
  if (error) return <div className="error-container"><p>{error}</p><button onClick={loadAnnouncement} className="btn-primary">Retry</button></div>;
  if (!announcement) return <div className="container"><p className="member-empty">Announcement not found.</p><button onClick={() => navigate('/announcements')} className="btn-secondary">Back</button></div>;

  const posterName = announcement.createdBy
    ? `${announcement.createdBy.firstName || ''} ${announcement.createdBy.lastName || ''}`.trim()
    : 'Chapel Team';
  const imageUrl = announcement.featuredImage ? getMediaUrl(announcement.featuredImage) : fallbackImage;

  return (
    <div className="container announcement-detail-page">
      <button onClick={() => navigate('/announcements')} className="btn-secondary" style={{ marginBottom: '1rem' }}>
        Back to Announcements
      </button>

      <article className="announcement-detail-rich">
        <section className="announcement-detail-hero">
          <img src={imageUrl} alt="" />
          <div className="announcement-detail-overlay">
            <span>{announcement.type || 'Chapel update'}</span>
            <h1>{announcement.title}</h1>
            <p>{formatDate(announcement.publishDate || announcement.createdAt)} · Posted by {posterName}</p>
          </div>
        </section>

        <div className="announcement-detail-layout">
          <main className="announcement-article">
            <div className="announcement-priority-row">
              <span className={`priority-badge priority-${announcement.priority || 'normal'}`}>
                {announcement.priority || 'normal'}
              </span>
              {announcement.createdBy?.role && <span>{announcement.createdBy.role}</span>}
            </div>

            {announcement.announcementVideo && (
              <video src={getMediaUrl(announcement.announcementVideo)} controls preload="metadata" className="announcement-media-video" />
            )}

            <div className="announcement-content">
              <p>{announcement.content}</p>
            </div>
          </main>

          <aside className="announcement-side">
            <div>
              <span>Published</span>
              <strong>{formatDate(announcement.publishDate || announcement.createdAt)}</strong>
            </div>
            <div>
              <span>Author</span>
              <strong>{posterName}</strong>
              {announcement.createdBy?.role && <p>{announcement.createdBy.role}</p>}
            </div>
            <div>
              <span>Type</span>
              <strong>{announcement.type || 'General'}</strong>
            </div>
          </aside>
        </div>
      </article>

      <style>{`
        .announcement-detail-page { padding-bottom: 3rem; }
        .announcement-detail-rich {
          background: var(--glass-panel);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 8px;
          padding: 1.1rem;
          box-shadow: var(--shadow-deep);
          backdrop-filter: blur(22px) saturate(130%);
        }
        .announcement-detail-hero {
          min-height: 390px;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        .announcement-detail-hero img {
          width: 100%;
          height: 100%;
          min-height: 390px;
          display: block;
          object-fit: cover;
        }
        .announcement-detail-hero::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(10,16,21,0.92), rgba(10,16,21,0.58), rgba(10,16,21,0.2));
        }
        .announcement-detail-overlay {
          position: absolute;
          inset: auto 1.3rem 1.3rem;
          z-index: 1;
          color: white;
        }
        .announcement-detail-overlay span,
        .announcement-side span {
          display: block;
          color: var(--brand-soft);
          font-size: 0.76rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 0.45rem;
        }
        .announcement-detail-overlay h1 {
          max-width: 820px;
          font-size: clamp(2.2rem, 5vw, 4.5rem);
          line-height: 0.98;
          margin-bottom: 0.8rem;
        }
        .announcement-detail-overlay p {
          color: rgba(255,255,255,0.78);
        }
        .announcement-detail-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 1rem;
          align-items: start;
        }
        .announcement-article,
        .announcement-side > div {
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 8px;
          padding: 1rem;
        }
        .announcement-priority-row {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .announcement-priority-row > span {
          border-radius: 999px;
          padding: 0.28rem 0.68rem;
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.72);
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: capitalize;
        }
        .priority-badge.priority-critical,
        .priority-badge.priority-high {
          background: #c2413a;
          color: white;
        }
        .priority-badge.priority-medium {
          background: #d6a650;
          color: #172018;
        }
        .priority-badge.priority-low,
        .priority-badge.priority-normal {
          background: #2f7d46;
          color: white;
        }
        .announcement-media-video {
          width: 100%;
          max-height: 520px;
          border-radius: 8px;
          margin-bottom: 1rem;
          background: #05080a;
        }
        .announcement-content {
          color: rgba(255,255,255,0.82);
          line-height: 1.85;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        .announcement-side {
          display: grid;
          gap: 1rem;
        }
        .announcement-side strong {
          display: block;
          color: white;
          font-size: 1.08rem;
          line-height: 1.25;
        }
        .announcement-side p {
          color: rgba(255,255,255,0.68);
          text-transform: capitalize;
        }
        @media (max-width: 860px) {
          .announcement-detail-layout {
            grid-template-columns: 1fr;
          }
          .announcement-side {
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          }
        }
        @media (max-width: 560px) {
          .announcement-detail-hero,
          .announcement-detail-hero img {
            min-height: 340px;
          }
        }
      `}</style>
    </div>
  );
};

export default AnnouncementDetailPage;
