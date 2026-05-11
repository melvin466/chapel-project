import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import notificationService from '../services/notificationService';
import prayerService from '../services/prayerService';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [prayers, setPrayers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [eventsRes, prayersRes, notificationsRes] = await Promise.all([
        eventService.getEvents({ limit: 3 }),
        prayerService.getPrayerRequests({ limit: 3 }),
        notificationService.getNotifications(),
      ]);

      setEvents(eventsRes.data?.events || []);
      setPrayers(prayersRes.data?.prayerRequests || []);
      setNotifications(notificationsRes.data?.notifications || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="container member-dashboard">
      <section className="member-dashboard-hero">
        <div>
          <span className="profile-role">Member dashboard</span>
          <h1>Welcome back, {user?.firstName || 'friend'}.</h1>
          <p>Your chapel activity, prayer life, and community links are gathered here.</p>
        </div>
        <button onClick={handleLogout} className="logout-btn member-logout">Logout</button>
      </section>

      <section className="member-stat-grid">
        <Link to="/events" className="member-stat-card">
          <strong>{events.length}</strong>
          <span>Upcoming events</span>
        </Link>
        <Link to="/prayer" className="member-stat-card">
          <strong>{prayers.length}</strong>
          <span>Prayer requests</span>
        </Link>
        <Link to="/notifications" className="member-stat-card">
          <strong>{unreadCount}</strong>
          <span>Unread notifications</span>
        </Link>
      </section>

      <section className="member-actions">
        <Link to="/prayer">Submit Prayer</Link>
        <Link to="/give">Give Online</Link>
        <Link to="/bookings">Book Support</Link>
        <Link to="/profile">Update Profile</Link>
      </section>

      <div className="member-dashboard-grid">
        <section className="member-panel">
          <div className="member-panel-header">
            <h2>Upcoming Events</h2>
            <Link to="/events">View all</Link>
          </div>
          {events.length === 0 ? (
            <p className="member-empty">No upcoming events yet.</p>
          ) : (
            events.map((event) => (
              <Link key={event._id} to={`/events/${event._id}`} className="member-list-item">
                <strong>{event.title}</strong>
                <span>{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'Date to be announced'}</span>
              </Link>
            ))
          )}
        </section>

        <section className="member-panel">
          <div className="member-panel-header">
            <h2>Prayer Requests</h2>
            <Link to="/prayer">Open prayer page</Link>
          </div>
          {prayers.length === 0 ? (
            <p className="member-empty">No prayer requests yet.</p>
          ) : (
            prayers.map((prayer) => (
              <div key={prayer._id} className="member-list-item">
                <strong>{prayer.title}</strong>
                <span>{prayer.status}</span>
                {prayer.adminResponse && <p>{prayer.adminResponse}</p>}
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
