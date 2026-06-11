import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { preloadProps } from '../routePreload';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const { user, isAuthenticated, logout, isChaplain, hasAdminPower } = useAuth();
  const navigate = useNavigate();
  const managementLabel = isChaplain ? 'Chaplain' : 'Admin';

  React.useEffect(() => {
    if (!isOpen) return;

    const preventDefault = (e) => {
      // Allow scrolling inside .nav-links
      if (e.target.closest('.nav-links')) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    // Prevent body touch scroll leakage on mobile
    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.body.classList.add('menu-open');

    return () => {
      document.removeEventListener('touchmove', preventDefault);
      document.body.classList.remove('menu-open');
    };
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    setOpenDropdown(null);
  };

  const toggleMenu = () => {
    setIsOpen((current) => !current);
    setOpenDropdown(null);
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown((current) => (current === dropdown ? null : dropdown));
  };

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
          onClick={toggleMenu}
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
        >
          {isOpen ? 'Close' : 'Menu'}
        </button>

        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
          <NavLink to="/" onClick={closeMenu} {...preloadProps('/')}>Home</NavLink>
          <NavLink to="/events" onClick={closeMenu} {...preloadProps('/events')}>Events</NavLink>
          <NavLink to="/announcements" onClick={closeMenu} {...preloadProps('/announcements')}>Announcements</NavLink>
          <NavLink to="/sermons" onClick={closeMenu} {...preloadProps('/sermons')}>Sermons</NavLink>

          <div className={`nav-dropdown ${openDropdown === 'more' ? 'open' : ''}`}>
            <button
              type="button"
              className="dropdown-btn"
              onClick={() => toggleDropdown('more')}
              aria-haspopup="true"
              aria-expanded={openDropdown === 'more'}
              aria-controls="more-menu"
            >
              More
            </button>
            <div className="dropdown-content" id="more-menu">
              <NavLink to="/cells" onClick={closeMenu} {...preloadProps('/cells')}>Cells</NavLink>
              <NavLink to="/prayer" onClick={closeMenu} {...preloadProps('/prayer')}>Prayer</NavLink>
              <NavLink to="/give" onClick={closeMenu} {...preloadProps('/give')}>Give</NavLink>
              <NavLink to="/bookings" onClick={closeMenu} {...preloadProps('/bookings')}>Bookings</NavLink>
            </div>
          </div>

          {isAuthenticated ? (
            <>
              {hasAdminPower && (
                <div className={`nav-dropdown ${openDropdown === 'admin' ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="dropdown-btn"
                    onClick={() => toggleDropdown('admin')}
                    aria-haspopup="true"
                    aria-expanded={openDropdown === 'admin'}
                    aria-controls="admin-menu"
                  >
                    {managementLabel}
                  </button>
                  <div className="dropdown-content" id="admin-menu">
                    <NavLink to="/admin" onClick={closeMenu} {...preloadProps('/admin')}>Overview</NavLink>
                    <NavLink to="/admin/events" onClick={closeMenu} {...preloadProps('/admin/events')}>Events</NavLink>
                    <NavLink to="/admin/announcements" onClick={closeMenu} {...preloadProps('/admin/announcements')}>Announcements</NavLink>
                    <NavLink to="/admin/bookings" onClick={closeMenu} {...preloadProps('/admin/bookings')}>Bookings</NavLink>
                    <NavLink to="/admin/users" onClick={closeMenu} {...preloadProps('/admin/users')}>Users</NavLink>
                    <NavLink to="/admin/prayers" onClick={closeMenu} {...preloadProps('/admin/prayers')}>Prayers</NavLink>
                    <NavLink to="/admin/donations" onClick={closeMenu} {...preloadProps('/admin/donations')}>Donations</NavLink>
                    <NavLink to="/admin/audit-logs" onClick={closeMenu} {...preloadProps('/admin/audit-logs')}>Audit Logs</NavLink>
                    <NavLink to="/admin/settings" onClick={closeMenu} {...preloadProps('/admin/settings')}>Settings</NavLink>
                  </div>
                </div>
              )}

              <NavLink to="/profile" onClick={closeMenu} className="profile-link" {...preloadProps('/profile')}>
                {user?.firstName || 'Profile'}
              </NavLink>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <NavLink to="/login" onClick={closeMenu} className="login-link" {...preloadProps('/login')}>Login</NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
