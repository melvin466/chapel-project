import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-cta">
          <div>
            <span className="footer-kicker">Chapel Management System</span>
            <h2>Stay connected with chapel life.</h2>
            <p>Follow events, announcements, prayer requests, giving, and community updates in one place.</p>
          </div>
          <div className="footer-cta-actions">
            <Link to="/announcements" className="footer-action primary">Latest Updates</Link>
            <Link to="/give" className="footer-action">Give Online</Link>
          </div>
        </div>

        <div className="footer-content">
          <div className="footer-section footer-brand">
            <h3>Chapel System</h3>
            <p>Serving the chapel community through worship, fellowship, prayer, and care.</p>
            <div className="footer-contact-list">
              <span>Kampala, Uganda</span>
              <a href="mailto:chapel@example.org">chapel@example.org</a>
              <a href="tel:+256789030837">+256 789 030 837</a>
            </div>
          </div>

          <div className="footer-section">
            <h4>Explore</h4>
            <Link to="/events">Events</Link>
            <Link to="/announcements">Announcements</Link>
            <Link to="/sermons">Sermons</Link>
            <Link to="/bible">Bible</Link>
            <Link to="/cells">Cell Groups</Link>
          </div>

          <div className="footer-section">
            <h4>Community</h4>
            <Link to="/prayer">Prayer Requests</Link>
            <Link to="/bookings">Bookings</Link>
            <Link to="/feedback">Feedback</Link>
            <Link to="/profile">My Profile</Link>
          </div>

          <div className="footer-section">
            <h4>Service Times</h4>
            <div className="footer-schedule">
              <span><strong>Sunday</strong> 8:00 AM, 10:00 AM, 5:00 PM</span>
              <span><strong>Weekdays</strong> 7:00 AM, 12:10 PM</span>
              <span><strong>Wednesday</strong> 5:30 PM fellowship</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {year} Chapel Management System. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/login">Login</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/admin">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
