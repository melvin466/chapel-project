import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import eventService from '../services/eventService';
import notificationService from '../services/notificationService';
import prayerService from '../services/prayerService';
import PageSkeleton from '../components/PageSkeleton';

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Date to be announced';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return <PageSkeleton label="Loading your dashboard" />;
  }

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const nextEvent = events[0];

  return (
    <div className="container member-dashboard">
      <section className="member-dashboard-hero">
        <div>
          <span className="profile-role">Member dashboard</span>
          <h1>Welcome back, {user?.firstName || 'friend'}.</h1>
          <p>Your chapel activity, prayer life, and community links are gathered here.</p>
        </div>
        <div className="member-hero-summary" aria-label="Dashboard highlights">
          <div>
            <span>Next event</span>
            <strong>{nextEvent ? nextEvent.title : 'No event yet'}</strong>
          </div>
          <div>
            <span>Notifications</span>
            <strong>{unreadCount} unread</strong>
          </div>
          <div>
            <span>Role</span>
            <strong>{user?.role || 'member'}</strong>
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn member-logout">Logout</button>
      </section>

      <section className="member-stat-grid">
        <Link to="/events" className="member-stat-card">
          <span className="member-stat-kicker">Calendar</span>
          <strong>{events.length}</strong>
          <span>Upcoming events</span>
          <p>Services, fellowships, and chapel gatherings.</p>
        </Link>
        <Link to="/prayer" className="member-stat-card">
          <span className="member-stat-kicker">Prayer</span>
          <strong>{prayers.length}</strong>
          <span>Prayer requests</span>
          <p>Share requests or stand with someone today.</p>
        </Link>
        <Link to="/notifications" className="member-stat-card">
          <span className="member-stat-kicker">Inbox</span>
          <strong>{unreadCount}</strong>
          <span>Unread notifications</span>
          <p>Fresh updates from the chapel team.</p>
        </Link>
      </section>

      <section className="member-actions">
        <Link to="/prayer">
          <span>Prayer</span>
          <strong>Submit Prayer</strong>
          <p>Ask the community or chaplain to pray with you.</p>
        </Link>
        <Link to="/give">
          <span>Giving</span>
          <strong>Give Online</strong>
          <p>Use mobile money for tithe, offering, or mission gifts.</p>
        </Link>
        <Link to="/bookings">
          <span>Care</span>
          <strong>Book Support</strong>
          <p>Request counselling, appointments, or chapel spaces.</p>
        </Link>
        <Link to="/profile">
          <span>Account</span>
          <strong>Update Profile</strong>
          <p>Keep your contact and chapel details current.</p>
        </Link>
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
                <span>{formatDate(event.startDate)}</span>
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

        <section className="member-panel">
          <div className="member-panel-header">
            <h2>Recent Notifications</h2>
            <Link to="/notifications">Open inbox</Link>
          </div>
          {notifications.length === 0 ? (
            <p className="member-empty">No notifications yet.</p>
          ) : (
            notifications.slice(0, 3).map((notification) => (
              <Link key={notification._id} to="/notifications" className={`member-list-item ${notification.isRead ? '' : 'member-list-item-unread'}`}>
                <strong>{notification.title || 'Chapel update'}</strong>
                <span>{notification.message || notification.content || 'Open notifications for details.'}</span>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
