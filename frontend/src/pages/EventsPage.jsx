import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import eventService from '../services/eventService';
import api from '../services/api';

const eventFallbackImage = 'https://images.pexels.com/photos/267559/pexels-photo-267559.jpeg?auto=compress&cs=tinysrgb&w=900';

const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const normalizedPath = path.replace(/\\/g, '/');
  const uploadPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${encodeURI(uploadPath)}`;
};

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventService.getEvents();
        setEvents(response.data?.events || []);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="events-page">
      <section className="events-hero">
        <div>
          <span>Gather with us</span>
          <h1>Upcoming Events</h1>
          <p>
            From worship services and fellowships to discipleship moments and community gatherings,
            these are the spaces where chapel life becomes shared life.
          </p>
        </div>
        <aside>
          <strong>Plan your week</strong>
          <p>Open an event to see timing, location, registration details, and what to expect when you arrive.</p>
        </aside>
      </section>

      {loading && <p className="member-empty">Loading events...</p>}
      {error && <p className="error-message">{error}</p>}
      {events.length > 0 ? (
        <div className="event-list-grid">
          {events.map((event) => (
            <Link key={event._id} to={`/events/${event._id}`} className="event-item event-item-link">
              <img
                src={event.featuredImage ? getMediaUrl(event.featuredImage) : eventFallbackImage}
                alt=""
                className="event-image"
                loading="lazy"
              />
              <h2>{event.title}</h2>
              <p>{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'Date to be announced'}</p>
              <p>{event.description}</p>
              <span className="event-link-action">View details</span>
            </Link>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="no-data rich-empty">
            <strong>No events are listed right now.</strong>
            <span>New services, fellowships, and chapel gatherings will appear here as they are published.</span>
          </div>
        )
      )}

      <style>{`
        .events-hero {
          min-height: 330px;
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
            linear-gradient(90deg, rgba(10,16,21,0.92), rgba(10,16,21,0.55), rgba(10,16,21,0.86)),
            url('https://images.pexels.com/photos/267559/pexels-photo-267559.jpeg?auto=compress&cs=tinysrgb&w=1600');
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 45px rgba(0,0,0,0.24);
        }
        .events-hero span {
          display: inline-block;
          color: #9bd8aa;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .events-hero h1 {
          font-size: clamp(2.1rem, 5vw, 4rem);
          line-height: 1;
          margin-bottom: 0.8rem;
        }
        .events-hero p {
          max-width: 720px;
          color: rgba(255,255,255,0.78);
        }
        .events-hero aside {
          padding: 1rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(18px);
        }
        .events-hero aside strong {
          display: block;
          color: white;
          margin-bottom: 0.35rem;
        }
        .event-list-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
          gap: 1rem;
        }
        .event-image {
          width: 100%;
          height: 170px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .event-item-link {
          display: flex;
          flex-direction: column;
          color: inherit;
          text-decoration: none;
          min-height: 360px;
        }
        .event-link-action {
          display: inline-block;
          margin-top: auto;
          color: #9bd8aa;
          font-weight: 700;
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
          .events-hero {
            grid-template-columns: 1fr;
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default EventsPage;

