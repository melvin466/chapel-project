import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EventsPage = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios.get('/api/events')
      .then(response => {
        setEvents(response.data);
      })
      .catch(error => {
        console.error('Error fetching events:', error);
      });
  }, []);

  return (
    <div>
      <h1>Events</h1>
      {events.map(event => (
        <div key={event.id}>
          <h2>{event.name}</h2>
          <p>{event.date}</p>
        </div>
      ))}
    </div>
  );
};

export default EventsPage;