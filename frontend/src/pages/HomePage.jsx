import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '/HomePage.css'; // Import custom styles for the homepage

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState({ events: true, announcements: true });
  const [error, setError] = useState({ events: null, announcements: null });

  useEffect(() => {
    // Fetch upcoming events
    axios.get('/api/events')
      .then(response => {
        console.log('Events API response:', response.data);
        setEvents(Array.isArray(response.data) ? response.data : []);
        setLoading(prev => ({ ...prev, events: false }));
      })
      .catch(error => {
        console.error('Error fetching events:', error);
        setError(prev => ({ ...prev, events: 'Failed to load events.' }));
        setLoading(prev => ({ ...prev, events: false }));
      });

    // Fetch latest announcements
    axios.get('/api/announcements')
      .then(response => {
        console.log('Announcements API response:', response.data);
        setAnnouncements(Array.isArray(response.data) ? response.data : []);
        setLoading(prev => ({ ...prev, announcements: false }));
      })
      .catch(error => {
        console.error('Error fetching announcements:', error);
        setError(prev => ({ ...prev, announcements: 'Failed to load announcements.' }));
        setLoading(prev => ({ ...prev, announcements: false }));
      });
  }, []);

  // Helper function to format dates
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">Welcome to St. Francis Chapel</h1>
            <p className="hero-subtitle">
              A place of peace, prayer, and community
            </p>
            <div className="hero-buttons">
              <button className="btn-primary">Join Us for Mass</button>
              <button className="btn-secondary">Contact Us</button>
            </div>
          </div>
        </div>
      </section>

      {/* Mass Times Section */}
      <section className="mass-times-section">
        <div className="container">
          <h2 className="section-title">Mass Schedule</h2>
          <div className="mass-times-grid">
            <div className="mass-card">
              <h3>Weekdays</h3>
              <p>Monday - Friday</p>
              <p className="mass-time">7:00 AM & 12:10 PM</p>
            </div>
            <div className="mass-card">
              <h3>Saturday</h3>
              <p>Vigil Mass</p>
              <p className="mass-time">5:00 PM</p>
            </div>
            <div className="mass-card">
              <h3>Sunday</h3>
              <p>Morning & Evening</p>
              <p className="mass-time">8:00 AM, 10:00 AM, 5:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="events-section">
        <div className="container">
          <h2 className="section-title">📅 Upcoming Events</h2>
          {loading.events ? (
            <div className="loading-spinner">Loading events...</div>
          ) : error.events ? (
            <div className="error-message">{error.events}</div>
          ) : events.length > 0 ? (
            <div className="events-grid">
              {events.map(event => (
                <div key={event.id} className="event-card">
                  <div className="event-date-badge">
                    <span className="event-month">{formatDate(event.date).split(' ')[0]}</span>
                    <span className="event-day">{formatDate(event.date).split(' ')[1]?.replace(',', '')}</span>
                  </div>
                  <div className="event-details">
                    <h3 className="event-title">{event.name}</h3>
                    <p className="event-info">🕒 {formatDate(event.date)}</p>
                    <p className="event-info">📍 {event.location}</p>
                    {event.description && <p className="event-description">{event.description}</p>}
                    <button className="event-btn">Learn More →</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No upcoming events at this time. Please check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Announcements Section */}
      <section className="announcements-section">
        <div className="container">
          <h2 className="section-title">📢 Latest Announcements</h2>
          {loading.announcements ? (
            <div className="loading-spinner">Loading announcements...</div>
          ) : error.announcements ? (
            <div className="error-message">{error.announcements}</div>
          ) : announcements.length > 0 ? (
            <div className="announcements-list">
              {announcements.map(announcement => (
                <div key={announcement.id} className="announcement-card">
                  <div className="announcement-header">
                    <h3 className="announcement-title">{announcement.title}</h3>
                    <span className="announcement-date">{formatDate(announcement.date)}</span>
                  </div>
                  <p className="announcement-content">{announcement.content}</p>
                  {announcement.link && (
                    <a href={announcement.link} className="announcement-link">Read more →</a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No announcements available. Stay tuned for updates!</p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="quick-links-section">
        <div className="container">
          <div className="quick-links-grid">
            <div className="quick-link-card">
              <div className="quick-link-icon">🙏</div>
              <h3>Prayer Requests</h3>
              <p>Submit your prayer intentions to our community</p>
              <button className="quick-link-btn">Submit Request</button>
            </div>
            <div className="quick-link-card">
              <div className="quick-link-icon">🤝</div>
              <h3>Volunteer</h3>
              <p>Join our ministry and serve the community</p>
              <button className="quick-link-btn">Get Involved</button>
            </div>
            <div className="quick-link-card">
              <div className="quick-link-icon">💰</div>
              <h3>Donate</h3>
              <p>Support St. Francis Chapel's mission</p>
              <button className="quick-link-btn">Give Today</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>St. Francis Chapel</h3>
              <p>123 Faith Avenue</p>
              <p>City, State 12345</p>
              <p>📞 (555) 123-4567</p>
              <p>✉️ info@stfrancischapel.org</p>
            </div>
            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="/about">About Us</a></li>
                <li><a href="/mass-times">Mass Times</a></li>
                <li><a href="/sacraments">Sacraments</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="#">Facebook</a>
                <a href="#">Instagram</a>
                <a href="#">YouTube</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 St. Francis Chapel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;