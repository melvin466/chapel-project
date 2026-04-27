import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>🕊️ St. Francis Chapel</h3>
            <p>Makerere University</p>
            <p>Kampala, Uganda</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="/events">Events</a>
            <a href="/sermons">Sermons</a>
            <a href="/cells">Cell Groups</a>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>📧 chapel@mak.ac.ug</p>
            <p>📞 +256 700 000000</p>
          </div>
          <div className="footer-section">
            <h4>Service Times</h4>
            <p>Sunday: 9:00 AM</p>
            <p>Wednesday: 5:30 PM</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 St. Francis Chapel. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;