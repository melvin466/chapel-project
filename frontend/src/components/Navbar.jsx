import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { preloadRoute } from '../routePreload';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout, isAdmin, isChaplain } = useAuth();
  const navigate = useNavigate();
  const canManageContent = isAdmin || isChaplain;

  const closeMenu = () => setIsOpen(false);

  const preload = (path) => ({
    onMouseEnter: () => preloadRoute(path),
    onFocus: () => preloadRoute(path),
  });

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
          <NavLink to="/" onClick={closeMenu} {...preload('/')}>Home</NavLink>
          <NavLink to="/events" onClick={closeMenu} {...preload('/events')}>Events</NavLink>
          <NavLink to="/announcements" onClick={closeMenu} {...preload('/announcements')}>Announcements</NavLink>
          <NavLink to="/sermons" onClick={closeMenu} {...preload('/sermons')}>Sermons</NavLink>

          <div className="nav-dropdown">
            <button className="dropdown-btn">More</button>
            <div className="dropdown-content">
              <NavLink to="/cells" onClick={closeMenu} {...preload('/cells')}>Cells</NavLink>
              <NavLink to="/prayer" onClick={closeMenu} {...preload('/prayer')}>Prayer</NavLink>
              <NavLink to="/give" onClick={closeMenu} {...preload('/give')}>Give</NavLink>
              <NavLink to="/bookings" onClick={closeMenu} {...preload('/bookings')}>Bookings</NavLink>
            </div>
          </div>

          {isAuthenticated ? (
            <>
              {canManageContent && (
                <div className="nav-dropdown">
                  <button className="dropdown-btn">{isAdmin ? 'Admin' : 'Manage'}</button>
                  <div className="dropdown-content">
                    {isAdmin && <NavLink to="/admin" onClick={closeMenu} {...preload('/admin')}>Overview</NavLink>}
                    <NavLink to="/admin/events" onClick={closeMenu} {...preload('/admin/events')}>Events</NavLink>
                    <NavLink to="/admin/announcements" onClick={closeMenu} {...preload('/admin/announcements')}>Announcements</NavLink>
                    <NavLink to="/admin/bookings" onClick={closeMenu} {...preload('/admin/bookings')}>Bookings</NavLink>
                    {isAdmin && <NavLink to="/admin/users" onClick={closeMenu} {...preload('/admin/users')}>Users</NavLink>}
                    {isAdmin && <NavLink to="/admin/prayers" onClick={closeMenu} {...preload('/admin/prayers')}>Prayers</NavLink>}
                    {isAdmin && <NavLink to="/admin/donations" onClick={closeMenu} {...preload('/admin/donations')}>Donations</NavLink>}
                    {isAdmin && <NavLink to="/admin/audit-logs" onClick={closeMenu} {...preload('/admin/audit-logs')}>Audit Logs</NavLink>}
                    {isAdmin && <NavLink to="/admin/settings" onClick={closeMenu} {...preload('/admin/settings')}>Settings</NavLink>}
                  </div>
                </div>
              )}

              <NavLink to="/profile" onClick={closeMenu} className="profile-link" {...preload('/profile')}>
                {user?.firstName || 'Profile'}
              </NavLink>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <NavLink to="/login" onClick={closeMenu} className="login-link" {...preload('/login')}>Login</NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
