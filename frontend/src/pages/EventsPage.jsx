import React, { useState, useEffect } from 'react';
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
        const response = await api.get('/events');
        setEvents(response.data.data.events);
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
          <div key={event._id} className="event-item">
            {event.featuredImage && (
              <img src={getMediaUrl(event.featuredImage)} alt={event.title} className="event-image" />
            )}
            <h2>{event.title}</h2>
            <p>{event.startDate ? new Date(event.startDate).toLocaleDateString() : ''}</p>
            <p>{event.description}</p>
          </div>
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
      `}</style>
    </div>
  );
};

export default EventsPage;
