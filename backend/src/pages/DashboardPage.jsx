import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import prayerService from '../services/prayerService';  // ← FIXED: removed curly braces
import { notificationService } from '../services/notificationService';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [myEvents, setMyEvents] = useState([]);
  const [myPrayers, setMyPrayers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    registeredEvents: 0,
    prayerRequests: 0,
    unreadNotifications: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [eventsRes, prayersRes, notificationsRes] = await Promise.all([
        eventService.getEvents(),
        prayerService.getPrayerRequests(),
        notificationService.getNotifications()
      ]);
      
      const events = eventsRes.data?.events || [];
      const prayers = prayersRes.data?.prayerRequests || [];
      const notifs = notificationsRes.data?.notifications || [];
      
      setMyEvents(events);
      setMyPrayers(prayers);
      setNotifications(notifs);
      
      setStats({
        registeredEvents: events.length,
        prayerRequests: prayers.length,
        unreadNotifications: notifs.filter(n => !n.isRead).length
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1>Welcome back, {user?.firstName}! 👋</h1>
          <p>Here's what's happening in your spiritual journey.</p>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>

        {/* Stats Cards */}
        <div className="dashboard-stats">
          <div className="stat-card" onClick={() => navigate('/my-events')}>
            <h3>{stats.registeredEvents}</h3>
            <p>Events Registered</p>
          </div>
          <div className="stat-card" onClick={() => navigate('/my-prayers')}>
            <h3>{stats.prayerRequests}</h3>
            <p>Prayer Requests</p>
          </div>
          <div className="stat-card" onClick={() => navigate('/notifications')}>
            <h3>{stats.unreadNotifications}</h3>
            <p>Unread Notifications</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button onClick={() => navigate('/events')} className="btn-primary">
              📅 View Events
            </button>
            <button onClick={() => navigate('/prayer')} className="btn-primary">
              🙏 Submit Prayer
            </button>
            <button onClick={() => navigate('/donations')} className="btn-primary">
              💰 Give Offering
            </button>
            <button onClick={() => navigate('/profile')} className="btn-secondary">
              👤 Update Profile
            </button>
          </div>
        </div>

        {/* My Events */}
        {myEvents.length > 0 && (
          <div className="dashboard-section">
            <h2>Your Upcoming Events</h2>
            <div className="events-list">
              {myEvents.slice(0, 3).map(event => (
                <div key={event._id} className="event-item" onClick={() => navigate(`/events/${event._id}`)}>
                  <div className="event-info">
                    <h4>{event.title}</h4>
                    <p>📅 {new Date(event.startDate).toLocaleDateString()}</p>
                    <p>📍 {event.location}</p>
                  </div>
                  <button className="btn-small">View</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Prayers */}
        {myPrayers.length > 0 && (
          <div className="dashboard-section">
            <h2>Your Prayer Requests</h2>
            <div className="prayers-list">
              {myPrayers.slice(0, 3).map(prayer => (
                <div key={prayer._id} className="prayer-item">
                  <h4>{prayer.title}</h4>
                  <p>{prayer.description?.substring(0, 100)}...</p>
                  <span className={`status ${prayer.status}`}>{prayer.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .dashboard-page {
          padding: 2rem 0;
          min-height: 70vh;
        }
        
        .welcome-section {
          text-align: center;
          margin-bottom: 2rem;
        }
        
        .welcome-section h1 {
          font-size: 2rem;
          color: white;
          margin-bottom: 0.5rem;
        }
        
        .welcome-section p {
          color: rgba(255,255,255,0.8);
        }
        
        .btn-logout {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 5px;
          color: white;
          cursor: pointer;
        }
        
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin: 2rem 0;
        }
        
        .stat-card {
          background: rgba(255,255,255,0.95);
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
          cursor: pointer;
          transition: transform 0.3s;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
        }
        
        .stat-card h3 {
          font-size: 2.5rem;
          color: #4CAF50;
          margin-bottom: 0.5rem;
        }
        
        .stat-card p {
          color: #666;
        }
        
        .dashboard-section {
          background: rgba(255,255,255,0.95);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .dashboard-section h2 {
          color: #333;
          margin-bottom: 1rem;
        }
        
        .quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .events-list, .prayers-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .event-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f5f5f5;
          border-radius: 8px;
          cursor: pointer;
        }
        
        .event-item:hover {
          background: #e8f5e9;
        }
        
        .event-info h4 {
          color: #333;
          margin-bottom: 0.25rem;
        }
        
        .event-info p {
          color: #666;
          font-size: 0.85rem;
        }
        
        .btn-small {
          padding: 0.4rem 1rem;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        
        .prayer-item {
          padding: 1rem;
          background: #f5f5f5;
          border-radius: 8px;
        }
        
        .prayer-item h4 {
          color: #333;
          margin-bottom: 0.25rem;
        }
        
        .prayer-item p {
          color: #666;
          font-size: 0.85rem;
        }
        
        .status {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.7rem;
          margin-top: 0.5rem;
        }
        
        .status.active {
          background: #4CAF50;
          color: white;
        }
        
        .status.answered {
          background: #2196F3;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;