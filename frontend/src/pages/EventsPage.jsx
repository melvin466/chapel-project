import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import eventService from '../services/eventService';
import api from '../services/api';

const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${api.defaults.baseURL.replace(/\/api\/?$/, '')}${path}`;
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
      <h1>Upcoming Events</h1>
      {loading && <p>Loading events...</p>}
      {error && <p className="error-message">{error}</p>}
      {events.length > 0 ? (
        events.map(event => (
          <Link key={event._id} to={`/events/${event._id}`} className="event-item event-item-link">
            {event.featuredImage && (
              <img src={getMediaUrl(event.featuredImage)} alt={event.title} className="event-image" />
            )}
            <h2>{event.title}</h2>
            <p>{event.startDate ? new Date(event.startDate).toLocaleDateString() : ''}</p>
            <p>{event.description}</p>
            <span className="event-link-action">View details</span>
          </Link>
        ))
      ) : (
        !loading && <p>No events available at the moment.</p>
      )}
      <style>{`
        .event-image {
          width: 100%;
          max-height: 320px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 1rem;
        }
        .event-item-link {
          display: block;
          color: inherit;
          text-decoration: none;
        }
        .event-link-action {
          display: inline-block;
          margin-top: 0.75rem;
          color: #2f7d46;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};

export default EventsPage;
