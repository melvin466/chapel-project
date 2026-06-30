import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import announcementService from '../services/announcementService';
import { getMediaUrl } from '../utils/media';
import { getRotatedImage } from '../utils/imageRotation';
import '../styles/searchBar.css';

const announcementFallbackImage = 'https://photos.smugmug.com/2025/n-LrkspB/Makfest-25/Worship-Evening/i-GwB63b7/0/MSp79rm3QMPHDsvTsSHg4BdJFbpxvbHdN98xqXCJP/M/IMGW4103-M.jpg';

const formatDate = (dateString) => {
  if (!dateString) return 'Date to be announced';
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const excerpt = (text = '', length = 150) => {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}...`;
};

const getPosterName = (announcement) => (
  announcement.createdBy
    ? `${announcement.createdBy.firstName || ''} ${announcement.createdBy.lastName || ''}`.trim()
    : 'Chapel Team'
);

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('all');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const response = await announcementService.getAnnouncements({ limit: 100 });
      setAnnouncements(response.data?.announcements || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const featuredAnnouncement = announcements.find((item) => ['critical', 'high'].includes(item.priority)) || announcements[0];
  const typeOptions = useMemo(() => ['all', ...new Set(announcements.map((item) => item.type).filter(Boolean))], [announcements]);

  const visibleAnnouncements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return announcements.filter((announcement) => {
      const searchable = [
        announcement.title,
        announcement.content,
        announcement.summary,
        announcement.type,
        announcement.priority,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesType = activeType === 'all' || announcement.type === activeType;
      return matchesQuery && matchesType;
    });
  }, [activeType, announcements, query]);

  if (loading) return <div className="loading">Loading announcements...</div>;

  return (
    <div className="announcements-page">
      <section className="announcements-feature">
        <div className="announcements-feature-copy">
          <span>Latest chapel update</span>
          <h1>{featuredAnnouncement ? featuredAnnouncement.title : 'Stay close to chapel life.'}</h1>
          <p>
            {featuredAnnouncement
              ? excerpt(featuredAnnouncement.summary || featuredAnnouncement.content, 190)
              : 'Service changes, ministry updates, pastoral notes, and community notices appear here.'}
          </p>
          {featuredAnnouncement && (
            <div className="announcements-feature-actions">
              <Link to={`/announcements/${featuredAnnouncement._id}`} className="btn-primary">Read update</Link>
              <span>{formatDate(featuredAnnouncement.publishDate || featuredAnnouncement.createdAt)} · {featuredAnnouncement.type || 'General'}</span>
            </div>
          )}
        </div>
        <div className="announcements-feature-media">
          <img
            src={getRotatedImage(featuredAnnouncement?.featuredImage ? getMediaUrl(featuredAnnouncement.featuredImage) : null)}
            alt=""
          />
          <span>{featuredAnnouncement?.priority || 'Update'}</span>
        </div>
      </section>

      <section className="announcements-library">
        <div className="announcements-library-heading">
          <div>
            <span>Notice board</span>
            <h2>Everything the chapel team needs you to know.</h2>
          </div>
          <label className="announcements-search">
            <span className="sr-only">Search announcements</span>
            <input
              type="search"
              placeholder="🔍 Search notices, ministry updates, or keywords..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search announcements"
            />
          </label>
        </div>

        <div className="announcements-filter-row" aria-label="Announcement filters">
          {typeOptions.map((type) => (
            <button
              key={type}
              type="button"
              className={activeType === type ? 'active' : ''}
              onClick={() => setActiveType(type)}
            >
              {type === 'all' ? 'All' : type}
            </button>
          ))}
        </div>

        {visibleAnnouncements.length === 0 ? (
          <div className="no-data rich-empty">
            <strong>No announcements match that search.</strong>
            <span>Try a simpler keyword, ministry name, or notice type.</span>
          </div>
        ) : (
          <div className="announcement-media-grid">
            {visibleAnnouncements.map((announcement) => (
              <Link key={announcement._id} to={`/announcements/${announcement._id}`} className="announcement-media-card">
                <div className="announcement-media-image">
                  <img
                    src={getRotatedImage(announcement.featuredImage ? getMediaUrl(announcement.featuredImage) : null)}
                    alt=""
                    loading="lazy"
                  />
                  <span>{announcement.priority || 'normal'}</span>
                </div>
                <div className="announcement-media-content">
                  <div className="announcement-media-meta">
                    <span>{announcement.type || 'General'}</span>
                    <span>{formatDate(announcement.publishDate || announcement.createdAt)}</span>
                  </div>
                  <h3>{announcement.title}</h3>
                  <p className="announcement-poster">By: {getPosterName(announcement)}</p>
                  <p>{excerpt(announcement.summary || announcement.content)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="announcements-guide-band">
        <div>
          <span>How to use this page</span>
          <h2>Read the details before services, groups, and special gatherings.</h2>
        </div>
        <div className="announcements-guide-grid">
          <div><strong>Urgent</strong><span>Time-sensitive changes and critical notices.</span></div>
          <div><strong>Ministry</strong><span>Updates from teams, fellowships, and service groups.</span></div>
          <div><strong>Pastoral</strong><span>Guidance, prayer notes, and care-related messages.</span></div>
        </div>
      </section>

      <style>{`
        .announcements-page {
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
          padding-bottom: 3rem;
          color: white;
        }
        .announcements-feature {
          min-height: 220px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.78fr);
          gap: 1.1rem;
          align-items: stretch;
          margin: 1rem 0 1.2rem;
        }
        .announcements-feature-copy,
        .announcements-feature-media,
        .announcements-library,
        .announcements-guide-band {
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: var(--glass-panel);
          box-shadow: var(--shadow-deep);
          backdrop-filter: blur(22px) saturate(130%);
          overflow: hidden;
        }
        .announcements-feature-copy {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          background:
            linear-gradient(135deg, rgba(49,95,114,0.24), rgba(47,125,70,0.14)),
            var(--glass-panel);
        }
        .announcements-feature-copy > span,
        .announcements-library-heading span,
        .announcements-guide-band > div > span {
          color: var(--brand-soft);
          display: inline-block;
          font-size: 0.76rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 0.55rem;
        }
        .announcements-feature-copy h1 {
          max-width: 760px;
          font-size: clamp(1.5rem, 2.4vw, 2rem);
          line-height: 1.15;
          margin-bottom: 0.7rem;
        }
        .announcements-feature-copy p {
          max-width: 680px;
          color: rgba(255,255,255,0.76);
          font-size: 1.05rem;
        }
        .announcements-feature-actions {
          display: flex;
          gap: 0.9rem;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }
        .announcements-feature-actions span {
          color: rgba(255,255,255,0.7);
          font-weight: 700;
        }
        .announcements-feature-media {
          position: relative;
          height: 250px;
        }
        .announcements-feature-media img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }
        .announcements-feature-media::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 42%, rgba(10,16,21,0.76));
        }
        .announcements-feature-media span {
          position: absolute;
          left: 1rem;
          bottom: 1rem;
          z-index: 1;
          padding: 0.4rem 0.75rem;
          border-radius: 999px;
          color: #1f2933;
          background: rgba(255,255,255,0.92);
          text-transform: capitalize;
          font-weight: 900;
        }
        .announcements-library {
          padding: 1.2rem;
        }
        .announcements-library-heading {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
          gap: 1rem;
          align-items: end;
          margin-bottom: 1rem;
        }
        .announcements-library-heading h2,
        .announcements-guide-band h2 {
          font-size: clamp(1.6rem, 3vw, 2.45rem);
          line-height: 1.05;
        }
        .announcements-search input {
          min-height: 48px;
          margin: 0;
        }
        .announcements-filter-row {
          display: flex;
          gap: 0.55rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .announcements-filter-row button {
          min-height: 38px;
          border-radius: 999px;
          padding: 0.45rem 0.8rem;
          border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.8);
          background: rgba(255,255,255,0.08);
          cursor: pointer;
          text-transform: capitalize;
          font-weight: 800;
        }
        .announcements-filter-row button.active,
        .announcements-filter-row button:hover {
          color: white;
          border-color: rgba(155,216,170,0.42);
          background: rgba(47,125,70,0.28);
        }
        .announcement-media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
          gap: 1rem;
        }
        .announcement-media-card {
          display: flex;
          flex-direction: column;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          transition: transform 0.2s ease, background 0.2s ease;
        }
        .announcement-media-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.12);
        }
        .announcement-media-image {
          position: relative;
          height: 150px;
          overflow: hidden;
        }
        .announcement-media-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }
        .announcement-media-image::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 42%, rgba(10,16,21,0.76));
        }
        .announcement-media-image span {
          position: absolute;
          left: 0.8rem;
          bottom: 0.8rem;
          z-index: 1;
          padding: 0.32rem 0.62rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.92);
          color: #1f2933;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: capitalize;
        }
        .announcement-media-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 1rem;
        }
        .announcement-media-meta {
          display: flex;
          justify-content: space-between;
          gap: 0.7rem;
          flex-wrap: wrap;
          color: rgba(255,255,255,0.62);
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: capitalize;
        }
        .announcement-media-content h3 {
          color: white;
          font-size: 1.18rem;
          line-height: 1.12;
          margin: 0.65rem 0 0.35rem;
        }
        .announcement-media-content p {
          color: rgba(255,255,255,0.72);
          line-height: 1.55;
        }
        .announcement-media-content .announcement-poster {
          color: var(--brand-soft);
          font-weight: 900;
          margin-bottom: 0.55rem;
        }
        .announcements-guide-band {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
          gap: 1rem;
          margin-top: 1.2rem;
          padding: 1.25rem;
        }
        .announcements-guide-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        .announcements-guide-grid div {
          padding: 0.9rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.13);
        }
        .announcements-guide-grid strong,
        .announcements-guide-grid span {
          display: block;
        }
        .announcements-guide-grid span {
          color: rgba(255,255,255,0.72);
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
          .announcements-feature,
          .announcements-library-heading,
          .announcements-guide-band,
          .announcements-guide-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 620px) {
          .announcements-page {
            width: min(100% - 32px, 1200px);
          }
          .announcements-feature-copy h1 {
            font-size: 2.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AnnouncementsPage;
