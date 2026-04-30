import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo">🔔 St. Francis Chapel</Link>
        
        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
          {/* Common Links - Everyone sees these */}
          <Link to="/">Home</Link>
          <Link to="/events">Events</Link>
          <Link to="/announcements">Announcements</Link>
          <Link to="/sermons">Sermons</Link>
          <Link to="/cells">Cells</Link>
          <Link to="/prayer">Prayer</Link>
          <Link to="/donations">Give</Link>
          <Link to="/feedback">Feedback</Link>
          
          {isAuthenticated ? (
            <>
              {/* Logged-in User Links */}
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/notifications">Notifications</Link>
              
              {/* ADMIN ONLY - Dropdown Menu */}
              {isAdmin && (
                <div className="admin-dropdown">
                  <button className="dropdown-btn">Admin ▼</button>
                  <div className="dropdown-content">
                    <Link to="/admin">Dashboard</Link>
                    <Link to="/admin/events">📅 Manage Events</Link>
                    <Link to="/admin/announcements">📢 Manage Announcements</Link>
                    <Link to="/admin/prayers">🙏 Manage Prayers</Link>
                    <Link to="/admin/users">👥 Manage Users</Link>
                    <Link to="/admin/settings">⚙️ Settings</Link>
                  </div>
                </div>
              )}
              
              <span className="user-name">👋 {user?.firstName}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              {/* Guest Links */}
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
        
        <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>
      </div>

      <style>{`
        /* Admin Dropdown Styles */
        .admin-dropdown {
          position: relative;
          display: inline-block;
        }
        
        .dropdown-btn {
          background: none;
          border: none;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          padding: 0.5rem;
          transition: color 0.3s;
        }
        
        .dropdown-btn:hover {
          color: #4CAF50;
        }
        
        .dropdown-content {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background: white;
          min-width: 200px;
          box-shadow: 0 8px 16px rgba(0,0,0,0.2);
          border-radius: 8px;
          z-index: 100;
          overflow: hidden;
        }
        
        .admin-dropdown:hover .dropdown-content {
          display: block;
        }
        
        .dropdown-content a {
          color: #333 !important;
          padding: 0.8rem 1rem;
          display: block;
          text-decoration: none;
          transition: background 0.3s;
          border-bottom: 1px solid #eee;
        }
        
        .dropdown-content a:last-child {
          border-bottom: none;
        }
        
        .dropdown-content a:hover {
          background: #f5f5f5;
          color: #4CAF50 !important;
        }
        
        .user-name {
          color: #4CAF50;
          font-weight: 500;
          margin-left: 0.5rem;
        }
        
        .logout-btn {
          background: none;
          border: none;
          color: #f44336;
          cursor: pointer;
          font-size: 1rem;
          margin-left: 0.5rem;
          transition: color 0.3s;
        }
        
        .logout-btn:hover {
          color: #d32f2f;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .dropdown-content {
            position: static;
            box-shadow: none;
            background: rgba(255,255,255,0.1);
            margin-top: 0.5rem;
          }
          
          .dropdown-content a {
            color: white !important;
            padding-left: 2rem;
          }
          
          .dropdown-content a:hover {
            background: rgba(255,255,255,0.2);
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;