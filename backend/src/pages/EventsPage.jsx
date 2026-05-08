import React, { useState, useEffect } from 'react';
import api from '../services/api';

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
          <div key={event.id} className="event-item">
            <h2>{event.name}</h2>
            <p>{event.date}</p>
            <p>{event.description}</p>
          </div>
        ))
      ) : (
        !loading && <p>No events available at the moment.</p>
      )}
    </div>
  );
};

export default EventsPage;