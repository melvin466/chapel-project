import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout, isAdmin, isChaplain } = useAuth();
  const navigate = useNavigate();
  const canManageContent = isAdmin || isChaplain;

  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          Chapel
        </Link>

        <button
          className="mobile-toggle"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation"
        >
          {isOpen ? 'Close' : 'Menu'}
        </button>

        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
          <NavLink to="/" onClick={closeMenu}>Home</NavLink>
          <NavLink to="/events" onClick={closeMenu}>Events</NavLink>
          <NavLink to="/announcements" onClick={closeMenu}>Announcements</NavLink>
          <NavLink to="/sermons" onClick={closeMenu}>Sermons</NavLink>

          <div className="nav-dropdown">
            <button className="dropdown-btn">More</button>
            <div className="dropdown-content">
              <NavLink to="/cells" onClick={closeMenu}>Cells</NavLink>
              <NavLink to="/prayer" onClick={closeMenu}>Prayer</NavLink>
              <NavLink to="/give" onClick={closeMenu}>Give</NavLink>
              <NavLink to="/bookings" onClick={closeMenu}>Bookings</NavLink>
            </div>
          </div>

          {isAuthenticated ? (
            <>
              {canManageContent && (
                <div className="nav-dropdown">
                  <button className="dropdown-btn">{isAdmin ? 'Admin' : 'Manage'}</button>
                  <div className="dropdown-content">
                    {isAdmin && <NavLink to="/admin" onClick={closeMenu}>Overview</NavLink>}
                    <NavLink to="/admin/events" onClick={closeMenu}>Events</NavLink>
                    <NavLink to="/admin/announcements" onClick={closeMenu}>Announcements</NavLink>
                    {isAdmin && <NavLink to="/admin/users" onClick={closeMenu}>Users</NavLink>}
                    {isAdmin && <NavLink to="/admin/prayers" onClick={closeMenu}>Prayers</NavLink>}
                    {isAdmin && <NavLink to="/admin/settings" onClick={closeMenu}>Settings</NavLink>}
                  </div>
                </div>
              )}

              <NavLink to="/profile" onClick={closeMenu} className="profile-link">
                {user?.firstName || 'Profile'}
              </NavLink>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <NavLink to="/login" onClick={closeMenu} className="login-link">Login</NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
