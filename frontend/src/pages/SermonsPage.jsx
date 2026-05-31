import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import sermonService from '../services/sermonService';
import { getMediaUrl } from '../utils/media';

const fallbackSermonImage = 'https://images.pexels.com/photos/8468474/pexels-photo-8468474.jpeg?auto=compress&cs=tinysrgb&w=1200';

const getPosterName = (sermon) => (
  sermon.createdBy
    ? `${sermon.createdBy.firstName || ''} ${sermon.createdBy.lastName || ''}`.trim()
    : sermon.speaker
);

const getSermonImage = (sermon) => (
  sermon.thumbnail ? getMediaUrl(sermon.thumbnail) : fallbackSermonImage
);

const getMediaLabel = (sermon) => {
  if (sermon.videoUrl && sermon.audioUrl) return 'Watch or listen';
  if (sermon.videoUrl) return 'Watch';
  if (sermon.audioUrl) return 'Listen';
  return 'Read notes';
};

const formatDate = (dateString) => {
  if (!dateString) return 'Date to be announced';
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const excerpt = (value = '', length = 150) => {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trim()}...`;
};

const SermonsPage = () => {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('latest');

  useEffect(() => {
    loadSermons();
  }, []);

  const loadSermons = async () => {
    try {
      const response = await sermonService.getSermons({ limit: 100 });
      setSermons(response.data?.sermons || []);
    } catch (error) {
      console.error('Error loading sermons:', error);
    } finally {
      setLoading(false);
    }
  };

  const latestSermon = sermons[0];

  const filterOptions = useMemo(() => {
    const serviceTypes = [...new Set(sermons.map((sermon) => sermon.serviceType).filter(Boolean))];
    const series = [...new Set(sermons.map((sermon) => sermon.series).filter(Boolean))];
    return [
      { id: 'latest', label: 'Latest' },
      { id: 'video', label: 'Video' },
      { id: 'audio', label: 'Audio' },
      ...serviceTypes.slice(0, 3).map((item) => ({ id: `service:${item}`, label: item })),
      ...series.slice(0, 3).map((item) => ({ id: `series:${item}`, label: item })),
    ];
  }, [sermons]);

  const visibleSermons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sermons.filter((sermon) => {
      const searchText = [
        sermon.title,
        sermon.speaker,
        sermon.description,
        sermon.series,
        sermon.serviceType,
        ...(sermon.tags || []),
        ...(sermon.bibleVerses || []),
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
      const matchesFilter = activeFilter === 'latest'
        || (activeFilter === 'video' && Boolean(sermon.videoUrl))
        || (activeFilter === 'audio' && Boolean(sermon.audioUrl))
        || (activeFilter.startsWith('service:') && sermon.serviceType === activeFilter.replace('service:', ''))
        || (activeFilter.startsWith('series:') && sermon.series === activeFilter.replace('series:', ''));

      return matchesQuery && matchesFilter;
    });
  }, [activeFilter, query, sermons]);

  if (loading) return <div className="loading">Loading sermons...</div>;

  return (
    <div className="sermons-page">
      <section className="sermons-feature">
        <div className="sermons-feature-copy">
          <span>Latest message</span>
          <h1>{latestSermon ? latestSermon.title : 'Sermons that travel with you.'}</h1>
          <p>
            {latestSermon
              ? excerpt(latestSermon.description, 190)
              : 'Watch, listen, search, and revisit chapel teaching throughout the week.'}
          </p>
          {latestSermon && (
            <div className="sermons-feature-actions">
              <Link to={`/sermons/${latestSermon._id}`} className="btn-primary">{getMediaLabel(latestSermon)}</Link>
              <span>{getPosterName(latestSermon)} · {formatDate(latestSermon.date)}</span>
            </div>
          )}
        </div>
        <div className="sermons-feature-media">
          <img src={latestSermon ? getSermonImage(latestSermon) : fallbackSermonImage} alt="" />
          <div className="sermons-play-badge" aria-hidden="true">
            <span />
          </div>
        </div>
      </section>

      <section className="sermons-library-shell">
        <div className="sermons-library-heading">
          <div>
            <span>Media library</span>
            <h2>Find a message for your current season.</h2>
          </div>
          <label className="sermons-search">
            <span className="sr-only">Search sermons</span>
            <input
              type="search"
              placeholder="Search by title, speaker, scripture, topic..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="sermons-filter-row" aria-label="Sermon filters">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={activeFilter === option.id ? 'active' : ''}
              onClick={() => setActiveFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {visibleSermons.length === 0 ? (
          <div className="no-data rich-empty">
            <strong>No sermons match that search.</strong>
            <span>Try a speaker, scripture, series, or a simpler keyword.</span>
          </div>
        ) : (
          <div className="sermons-media-grid">
            {visibleSermons.map((sermon) => (
              <Link key={sermon._id} className="sermon-media-card" to={`/sermons/${sermon._id}`}>
                <div className="sermon-media-image">
                  <img src={getSermonImage(sermon)} alt="" loading="lazy" />
                  <span>{getMediaLabel(sermon)}</span>
                </div>
                <div className="sermon-media-content">
                  <div className="sermon-media-meta">
                    <span>{sermon.series || sermon.serviceType || 'Message'}</span>
                    <span>{formatDate(sermon.date)}</span>
                  </div>
                  <h3>{sermon.title}</h3>
                  <p className="sermon-speaker">{getPosterName(sermon) || 'Chapel Team'}</p>
                  <p>{excerpt(sermon.description, 120)}</p>
                  <div className="sermon-media-stats">
                    <span>{sermon.views || 0} views</span>
                    <span>{sermon.likes?.length || 0} likes</span>
                    {sermon.duration && <span>{sermon.duration} min</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="sermons-practice-band">
        <div>
          <span>Practice it</span>
          <h2>Do not let Sunday stay on Sunday.</h2>
          <p>Use a sermon for personal reflection, prayer, or discussion with your cell group during the week.</p>
        </div>
        <div className="sermons-practice-grid">
          <div><strong>Listen</strong><span>Replay messages while commuting or studying.</span></div>
          <div><strong>Reflect</strong><span>Return to the Bible verses and key themes.</span></div>
          <div><strong>Discuss</strong><span>Bring a message into cell group conversation.</span></div>
        </div>
      </section>

      <style>{`
        .sermons-page {
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
          padding-bottom: 3rem;
          color: white;
        }
        .sermons-feature {
          min-height: 250px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.82fr);
          gap: 1.1rem;
          align-items: stretch;
          margin: 1rem 0 1.2rem;
        }
        .sermons-feature-copy,
        .sermons-feature-media,
        .sermons-library-shell,
        .sermons-practice-band {
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: var(--glass-panel);
          box-shadow: var(--shadow-deep);
          backdrop-filter: blur(22px) saturate(130%);
          overflow: hidden;
        }
        .sermons-feature-copy {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          background:
            linear-gradient(135deg, rgba(47,125,70,0.22), rgba(255,255,255,0.08)),
            var(--glass-panel);
        }
        .sermons-feature-copy > span,
        .sermons-library-heading span,
        .sermons-practice-band > div > span {
          color: var(--brand-soft);
          font-size: 0.76rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 0.55rem;
          display: inline-block;
        }
        .sermons-feature-copy h1 {
          max-width: 760px;
          font-size: clamp(1.8rem, 3.5vw, 2.5rem);
          line-height: 1.15;
          margin-bottom: 0.7rem;
        }
        .sermons-feature-copy p {
          max-width: 680px;
          color: rgba(255,255,255,0.76);
          font-size: 1.05rem;
        }
        .sermons-feature-actions {
          display: flex;
          gap: 0.9rem;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }
        .sermons-feature-actions span {
          color: rgba(255,255,255,0.7);
          font-weight: 700;
        }
        .sermons-feature-media {
          position: relative;
          min-height: 250px;
        }
        .sermons-feature-media img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }
        .sermons-feature-media::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 44%, rgba(10,16,21,0.74));
        }
        .sermons-play-badge {
          position: absolute;
          left: 1rem;
          bottom: 1rem;
          z-index: 1;
          width: 68px;
          height: 68px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255,255,255,0.92);
          box-shadow: 0 18px 38px rgba(0,0,0,0.26);
        }
        .sermons-play-badge span {
          width: 0;
          height: 0;
          border-top: 13px solid transparent;
          border-bottom: 13px solid transparent;
          border-left: 20px solid #2f7d46;
          transform: translateX(3px);
        }
        .sermons-library-shell {
          padding: 1.2rem;
        }
        .sermons-library-heading {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
          gap: 1rem;
          align-items: end;
          margin-bottom: 1rem;
        }
        .sermons-library-heading h2,
        .sermons-practice-band h2 {
          font-size: clamp(1.6rem, 3vw, 2.45rem);
          line-height: 1.05;
        }
        .sermons-search input {
          min-height: 48px;
          margin: 0;
        }
        .sermons-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          margin-bottom: 1rem;
        }
        .sermons-filter-row button {
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
        .sermons-filter-row button.active,
        .sermons-filter-row button:hover {
          color: white;
          border-color: rgba(155,216,170,0.42);
          background: rgba(47,125,70,0.28);
        }
        .sermons-media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
          gap: 1rem;
        }
        .sermon-media-card {
          min-height: 420px;
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
        .sermon-media-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.12);
        }
        .sermon-media-image {
          position: relative;
          height: 180px;
          overflow: hidden;
        }
        .sermon-media-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }
        .sermon-media-image::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 42%, rgba(10,16,21,0.76));
        }
        .sermon-media-image span {
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
        }
        .sermon-media-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 1rem;
        }
        .sermon-media-meta,
        .sermon-media-stats {
          display: flex;
          justify-content: space-between;
          gap: 0.7rem;
          flex-wrap: wrap;
          color: rgba(255,255,255,0.62);
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: capitalize;
        }
        .sermon-media-content h3 {
          margin: 0.65rem 0 0.35rem;
          color: white;
          line-height: 1.12;
          font-size: 1.18rem;
        }
        .sermon-media-content p {
          color: rgba(255,255,255,0.72);
          line-height: 1.55;
        }
        .sermon-media-content .sermon-speaker {
          color: var(--brand-soft);
          font-weight: 900;
          margin-bottom: 0.55rem;
        }
        .sermon-media-stats {
          margin-top: auto;
          padding-top: 1rem;
        }
        .sermons-practice-band {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
          gap: 1rem;
          margin-top: 1.2rem;
          padding: 1.25rem;
        }
        .sermons-practice-band p,
        .sermons-practice-grid span {
          color: rgba(255,255,255,0.72);
        }
        .sermons-practice-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        .sermons-practice-grid div {
          padding: 0.9rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.13);
        }
        .sermons-practice-grid strong,
        .sermons-practice-grid span {
          display: block;
        }
        .sermons-practice-grid strong {
          margin-bottom: 0.25rem;
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
          .sermons-feature,
          .sermons-library-heading,
          .sermons-practice-band,
          .sermons-practice-grid {
            grid-template-columns: 1fr;
          }
          .sermons-feature {
            min-height: auto;
          }
        }
        @media (max-width: 620px) {
          .sermons-page {
            width: min(100% - 32px, 1200px);
          }
          .sermons-feature-copy h1 {
            font-size: 2.2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SermonsPage;
