import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [eventDetails, setEventDetails] = useState(null);

  useEffect(() => {
    loadEvent();
    axios.get('/api/event-details')
      .then(response => {
        setEventDetails(response.data);
      })
      .catch(error => {
        console.error('Error fetching event details:', error);
      });
  }, [id]);

  const loadEvent = async () => {
    try {
      const response = await eventService.getEventById(id);
      setEvent(response.data.event);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      setRegistering(true);
      await eventService.registerForEvent(id);
      alert('Successfully registered!');
      loadEvent();
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const isRegistered = () => {
    return event?.attendees?.includes(user?._id);
  };

  if (loading) return <div className="loading">Loading event details...</div>;
  if (!event) return <div className="container"><p>Event not found</p></div>;

  return (
    <div className="container">
      <div className="event-detail">
        <h1>{event.title}</h1>
        <div className="event-meta">
          <p>📅 {new Date(event.startDate).toLocaleDateString()}</p>
          <p>⏰ {event.startTime} - {event.endTime}</p>
          <p>📍 {event.location}</p>
        </div>
        
        <div className="event-description">
          <h3>About This Event</h3>
          <p>{event.description}</p>
        </div>

        {event.speakers?.length > 0 && (
          <div className="speakers">
            <h3>Speakers</h3>
            {event.speakers.map((speaker, i) => (
              <div key={i} className="speaker">
                <strong>{speaker.name}</strong> - {speaker.title}
              </div>
            ))}
          </div>
        )}

        {event.registrationRequired && event.status === 'published' && (
          <div className="registration-box">
            <h3>Registration</h3>
            <p>Capacity: {event.registeredCount} / {event.capacity || '∞'}</p>
            {isRegistered() ? (
              <p className="registered">✓ You are registered for this event</p>
            ) : (
              <button onClick={handleRegister} disabled={registering} className="btn-primary">
                {registering ? 'Registering...' : 'Register Now'}
              </button>
            )}
          </div>
        )}

        <button onClick={() => navigate('/events')} className="btn-secondary">← Back to Events</button>
      </div>
      {eventDetails && (
        <div className="event-details">
          <h1>{eventDetails.name}</h1>
          <p>{eventDetails.description}</p>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;