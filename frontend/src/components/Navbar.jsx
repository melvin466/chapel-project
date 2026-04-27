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
        <Link to="/" className="logo">🕊️ St. Francis Chapel</Link>
        
        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
          <Link to="/">Home</Link>
          <Link to="/events">Events</Link>
          <Link to="/announcements">Announcements</Link>
          <Link to="/sermons">Sermons</Link>
          <Link to="/cells">Cells</Link>
          <Link to="/prayer">Prayer</Link>
          <Link to="/donations">Give</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/notifications">Notifications</Link>
              {isAdmin && <Link to="/admin">Admin</Link>}
              <button onClick={handleLogout} className="logout-btn">Logout</button>
              <span className="user-name">👤 {user?.firstName}</span>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
        
        <button className="mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
          ☰
        </button>
      </div>
    </nav>
  );
};

export default Navbar;