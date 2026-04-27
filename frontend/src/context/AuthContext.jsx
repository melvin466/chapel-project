import React, { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { announcementService } from '../services/announcementService';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        setUser(response.user);
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real data from backend
      const [eventsRes, announcementsRes] = await Promise.all([
        eventService.getUpcomingEvents(3),
        announcementService.getAnnouncements({ limit: 3 })
      ]);
      
      console.log('Events from backend:', eventsRes);
      console.log('Announcements from backend:', announcementsRes);
      
      setEvents(eventsRes.data?.events || []);
      setAnnouncements(announcementsRes.data?.announcements || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={loadData} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero">
        <h1>Welcome to St. Francis Chapel</h1>
        <p>Makerere University - A place of worship, fellowship, and spiritual growth</p>
        <button onClick={() => navigate('/events')} className="btn-primary">View Events</button>
      </div>

      {/* Events Section */}
      <div className="section">
        <div className="container">
          <h2 className="section-title">Upcoming Events</h2>
          {events.length === 0 ? (
            <p className="no-data">No upcoming events at the moment.</p>
          ) : (
            <div className="events-grid">
              {events.map(event => (
                <div key={event._id} className="event-card" onClick={() => navigate(`/events/${event._id}`)}>
                  <h3>{event.title}</h3>
                  <p>📅 {new Date(event.startDate).toLocaleDateString()}</p>
                  <p>⏰ {event.startTime || 'TBA'}</p>
                  <p>📍 {event.location}</p>
                  <button className="btn-secondary">View Details</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcements Section */}
      <div className="section bg-light">
        <div className="container">
          <h2 className="section-title">Latest Announcements</h2>
          {announcements.length === 0 ? (
            <p className="no-data">No announcements at the moment.</p>
          ) : (
            <div className="announcements-list">
              {announcements.map(announcement => (
                <div key={announcement._id} className="announcement-card" onClick={() => navigate(`/announcements/${announcement._id}`)}>
                  <h3>{announcement.title}</h3>
                  <p className="date">{new Date(announcement.publishDate).toLocaleDateString()}</p>
                  <p>{announcement.content?.substring(0, 150)}...</p>
                  <button className="read-more">Read More →</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;