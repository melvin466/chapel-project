import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import eventService from '../services/eventService';
import { getMediaUrl } from '../utils/media';

const eventFallbackImage = 'https://kabaraphotography.smugmug.com/2025/n-LrkspB/Makfest-25/Worship-Evening/i-5TQxFz3';

const formatDate = (dateString) => {
  if (!dateString) return 'Date to be announced';
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDay = (dateString) => {
  if (!dateString) return '--';
  return new Date(dateString).toLocaleDateString(undefined, { day: '2-digit' });
};

const getMonth = (dateString) => {
  if (!dateString) return 'To be announced';
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short' });
};

const prettyType = (value = 'event') => value.replace(/_/g, ' ');

const excerpt = (text = '', length = 145) => {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}...`;
};

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('all');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventService.getEvents({ limit: 100 });
        setEvents(response.data?.events || []);
      } catch (fetchError) {
        console.error('Error fetching events:', fetchError);
        setError('Failed to load events.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const featuredEvent = events.find((event) => event.isFeatured) || events[0];
  const eventTypes = useMemo(() => ['all', ...new Set(events.map((event) => event.type).filter(Boolean))], [events]);

  const visibleEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return events.filter((event) => {
      const searchable = [event.title, event.description, event.location, event.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesType = activeType === 'all' || event.type === activeType;
      return matchesQuery && matchesType;
    });
  }, [activeType, events, query]);

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="events-page">
      <section className="events-feature">
        <div className="events-feature-copy">
          <span>Chapel calendar</span>
          <h1>{featuredEvent ? featuredEvent.title : 'Gather with us this week.'}</h1>
          <p>
            {featuredEvent
              ? excerpt(featuredEvent.description, 190)
              : 'Services, fellowships, Bible studies, and community gatherings appear here as they are published.'}
          </p>
          {featuredEvent && (
            <div className="events-feature-actions">
              <Link to={`/events/${featuredEvent._id}`} className="btn-primary">View event</Link>
              <span>{formatDate(featuredEvent.startDate)} · {featuredEvent.location}</span>
            </div>
          )}
        </div>
        <div className="events-feature-card">
          <img src={featuredEvent?.featuredImage ? getMediaUrl(featuredEvent.featuredImage) : eventFallbackImage} alt="" />
          <div className="events-date-tile">
            <span>{getMonth(featuredEvent?.startDate)}</span>
            <strong>{getDay(featuredEvent?.startDate)}</strong>
          </div>
        </div>
      </section>

      <section className="events-library">
        <div className="events-library-heading">
          <div>
            <span>Browse events</span>
            <h2>Find your next step in chapel life.</h2>
          </div>
          <label className="events-search">
            <span className="sr-only">Search events</span>
            <input
              type="search"
              placeholder="Search by event, location, or type..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="events-filter-row" aria-label="Event filters">
          {eventTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={activeType === type ? 'active' : ''}
              onClick={() => setActiveType(type)}
            >
              {type === 'all' ? 'All' : prettyType(type)}
            </button>
          ))}
        </div>

        {error && <p className="error-message">{error}</p>}
        {visibleEvents.length > 0 ? (
          <div className="event-media-grid">
            {visibleEvents.map((event) => (
              <Link key={event._id} to={`/events/${event._id}`} className="event-media-card">
                <div className="event-card-image">
                  <img
                    src={event.featuredImage ? getMediaUrl(event.featuredImage) : eventFallbackImage}
                    alt=""
                    loading="lazy"
                  />
                  <span>{prettyType(event.type)}</span>
                </div>
                <div className="event-card-body">
                  <div className="event-card-date">
                    <span>{getMonth(event.startDate)}</span>
                    <strong>{getDay(event.startDate)}</strong>
                  </div>
                  <div>
                    <h3>{event.title}</h3>
                    <p className="event-card-time">🕐 {formatDate(event.startDate)} · {event.startTime || 'Time TBA'}</p>
                    <p>{excerpt(event.description)}</p>
                    <div className="event-card-meta">
                      <span>📍 Location: <strong>{event.location || 'TBA'}</strong></span>
                      {event.registrationRequired && <span>👥 Capacity: <strong>{event.registeredCount || 0}/{event.capacity || '∞'}</strong></span>}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="no-data rich-empty">
            <strong>No events match that search.</strong>
            <span>Try a location, event type, or a simpler keyword.</span>
          </div>
        )}
      </section>

      <section className="events-next-band">
        <div>
          <span>Before you arrive</span>
          <h2>Plan the simple things, then come present.</h2>
        </div>
        <div className="events-next-grid">
          <div><strong>Check details</strong><span>Open the event for time, venue, capacity, and registration.</span></div>
          <div><strong>Invite someone</strong><span>Chapel life is easier to enter with a friend nearby.</span></div>
          <div><strong>Follow up</strong><span>Use feedback after events to help the team serve better.</span></div>
        </div>
      </section>

      <style>{`
        .events-page {
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
          padding-bottom: 3rem;
          color: white;
        }
        .events-feature {
          min-height: 320px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.78fr);
          gap: 1.1rem;
          align-items: stretch;
          margin: 1rem 0 1.2rem;
        }
        .events-feature-copy,
        .events-feature-card,
        .events-library,
        .events-next-band {
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.2);
          background: var(--glass-panel);
          box-shadow: var(--shadow-deep);
          backdrop-filter: blur(22px) saturate(130%);
          overflow: hidden;
        }
        .events-feature-copy {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          background:
            linear-gradient(135deg, rgba(214,166,80,0.16), rgba(47,125,70,0.16)),
            var(--glass-panel);
        }
        .events-feature-copy > span,
        .events-library-heading span,
        .events-next-band > div > span {
          color: var(--brand-soft);
          display: inline-block;
          font-size: 0.76rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-bottom: 0.55rem;
        }
        .events-feature-copy h1 {
          max-width: 760px;
          font-size: clamp(2.35rem, 5vw, 4.6rem);
          line-height: 0.98;
          margin-bottom: 0.9rem;
        }
        .events-feature-copy p {
          max-width: 680px;
          color: rgba(255,255,255,0.76);
          font-size: 1.05rem;
        }
        .events-feature-actions {
          display: flex;
          gap: 0.9rem;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }
        .events-feature-actions span {
          color: rgba(255,255,255,0.7);
          font-weight: 700;
        }
        .events-feature-card {
          position: relative;
          min-height: 330px;
        }
        .events-feature-card img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }
        .events-feature-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 42%, rgba(10,16,21,0.76));
        }
        .events-date-tile {
          position: absolute;
          left: 1rem;
          bottom: 1rem;
          z-index: 1;
          width: 86px;
          height: 96px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: rgba(255,255,255,0.92);
          color: #172018;
          box-shadow: 0 18px 38px rgba(0,0,0,0.26);
        }
        .events-date-tile span {
          align-self: end;
          color: #2f7d46;
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .events-date-tile strong {
          align-self: start;
          font-size: 2.2rem;
          line-height: 1;
        }
        .events-library {
          padding: 1.2rem;
        }
        .events-library-heading {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
          gap: 1rem;
          align-items: end;
          margin-bottom: 1rem;
        }
        .events-library-heading h2,
        .events-next-band h2 {
          font-size: clamp(1.6rem, 3vw, 2.45rem);
          line-height: 1.05;
        }
        .events-search input {
          min-height: 48px;
          margin: 0;
        }
        .events-filter-row {
          display: flex;
          gap: 0.55rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .events-filter-row button {
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
        .events-filter-row button.active,
        .events-filter-row button:hover {
          color: white;
          border-color: rgba(155,216,170,0.42);
          background: rgba(47,125,70,0.28);
        }
        .event-media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
          gap: 1rem;
        }
        .event-media-card {
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
        .event-media-card:hover {
          transform: translateY(-4px);
          background: rgba(255,255,255,0.12);
        }
        .event-card-image {
          position: relative;
          height: 185px;
          overflow: hidden;
        }
        .event-card-image img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }
        .event-card-image::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 44%, rgba(10,16,21,0.74));
        }
        .event-card-image span {
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
        .event-card-body {
          display: grid;
          grid-template-columns: 64px 1fr;
          gap: 0.85rem;
          padding: 1rem;
        }
        .event-card-date {
          width: 64px;
          height: 76px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          background: rgba(155,216,170,0.16);
          border: 1px solid rgba(155,216,170,0.24);
        }
        .event-card-date span {
          align-self: end;
          color: var(--brand-soft);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
        }
        .event-card-date strong {
          align-self: start;
          font-size: 1.7rem;
          line-height: 1;
        }
        .event-card-body h3 {
          color: white;
          font-size: 1.18rem;
          line-height: 1.12;
          margin-bottom: 0.35rem;
        }
        .event-card-body p {
          color: rgba(255,255,255,0.72);
          line-height: 1.55;
        }
        .event-card-time {
          color: var(--brand-soft) !important;
          font-weight: 900;
          margin-bottom: 0.55rem;
        }
        .event-card-meta {
          display: flex;
          justify-content: space-between;
          gap: 0.7rem;
          flex-wrap: wrap;
          margin-top: 0.8rem;
          color: rgba(255,255,255,0.62);
          font-size: 0.82rem;
          font-weight: 800;
        }
        .events-next-band {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);
          gap: 1rem;
          margin-top: 1.2rem;
          padding: 1.25rem;
        }
        .events-next-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        .events-next-grid div {
          padding: 0.9rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.13);
        }
        .events-next-grid strong,
        .events-next-grid span {
          display: block;
        }
        .events-next-grid span {
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
          .events-feature,
          .events-library-heading,
          .events-next-band,
          .events-next-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 620px) {
          .events-page {
            width: min(100% - 32px, 1200px);
          }
          .events-feature-copy h1 {
            font-size: 2.2rem;
          }
          .event-card-body {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EventsPage;
