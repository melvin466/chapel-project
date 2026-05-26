import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { preloadRoute } from '../routePreload';

const AdminLayout = ({ children }) => {
  const { user, logout, isAdmin, isChaplain } = useAuth();
  const navigate = useNavigate();
  const canManageContent = isAdmin || isChaplain;

  const preload = (path) => ({
    onMouseEnter: () => preloadRoute(path),
    onFocus: () => preloadRoute(path),
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to={isAdmin ? '/admin' : '/admin/announcements'} className="admin-brand">
          <span>Chapel</span>
          <strong>Admin Console</strong>
        </Link>

        <nav className="admin-nav" aria-label="Admin navigation">
          {isAdmin && <NavLink to="/admin" end {...preload('/admin')}>Overview</NavLink>}
          {isAdmin && <NavLink to="/admin/events" {...preload('/admin/events')}>Events</NavLink>}
          {canManageContent && <NavLink to="/admin/announcements" {...preload('/admin/announcements')}>Announcements</NavLink>}
          {canManageContent && <NavLink to="/admin/bookings" {...preload('/admin/bookings')}>Bookings</NavLink>}
          {canManageContent && <NavLink to="/admin/sermons" {...preload('/admin/sermons')}>Sermons</NavLink>}
          {isAdmin && <NavLink to="/admin/cells" {...preload('/admin/cells')}>Cells</NavLink>}
          {isAdmin && <NavLink to="/admin/prayers" {...preload('/admin/prayers')}>Prayers</NavLink>}
          {isAdmin && <NavLink to="/admin/donations" {...preload('/admin/donations')}>Donations</NavLink>}
          {isAdmin && <NavLink to="/admin/users" {...preload('/admin/users')}>Users</NavLink>}
          {isAdmin && <NavLink to="/admin/reports" {...preload('/admin/reports')}>Reports</NavLink>}
          {isAdmin && <NavLink to="/admin/audit-logs" {...preload('/admin/audit-logs')}>Audit Logs</NavLink>}
          {isAdmin && <NavLink to="/admin/settings" {...preload('/admin/settings')}>Settings</NavLink>}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/">View site</Link>
          <button type="button" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span>Signed in as</span>
            <strong>{user?.firstName || 'Admin'} {user?.lastName || ''}</strong>
          </div>
          <div className="admin-topbar-actions">
            <Link to="/notifications">Notifications</Link>
            <Link to="/profile">Profile</Link>
          </div>
        </header>

        <div className="admin-page-frame">
          {children}
        </div>
      </section>

      <style>{`
        .admin-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          background:
            linear-gradient(180deg, rgba(16, 22, 28, 0.7), rgba(16, 22, 28, 0.92)),
            url('https://images.pexels.com/photos/2570062/pexels-photo-2570062.jpeg?auto=compress&cs=tinysrgb&w=1600');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          color: white;
        }
        .admin-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          height: 100dvh;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 1.25rem;
          background: #111827;
          color: white;
          border-right: 1px solid #243244;
          overflow: hidden;
        }
        .admin-brand {
          display: grid;
          gap: 0.15rem;
          color: white;
          text-decoration: none;
          padding: 0.35rem 0.25rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .admin-brand span {
          color: #9bd8aa;
          font-size: 0.82rem;
          font-weight: 800;
          text-transform: uppercase;
        }
        .admin-brand strong {
          font-size: 1.2rem;
        }
        .admin-nav {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding-right: 0.25rem;
          display: grid;
          align-content: start;
          gap: 0.25rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(155,216,170,0.55) rgba(255,255,255,0.08);
        }
        .admin-nav::-webkit-scrollbar {
          width: 8px;
        }
        .admin-nav::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.08);
          border-radius: 999px;
        }
        .admin-nav::-webkit-scrollbar-thumb {
          background: rgba(155,216,170,0.55);
          border-radius: 999px;
        }
        .admin-nav a,
        .admin-sidebar-footer a,
        .admin-sidebar-footer button {
          min-height: 40px;
          display: flex;
          align-items: center;
          padding: 0.65rem 0.75rem;
          border-radius: 8px;
          color: rgba(255,255,255,0.78);
          text-decoration: none;
          background: transparent;
          border: 0;
          font: inherit;
          cursor: pointer;
        }
        .admin-nav a:hover,
        .admin-nav a.active,
        .admin-sidebar-footer a:hover,
        .admin-sidebar-footer button:hover {
          background: rgba(47, 125, 70, 0.22);
          color: white;
        }
        .admin-sidebar-footer {
          flex: 0 0 auto;
          display: grid;
          gap: 0.25rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.12);
        }
        .admin-workspace {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .admin-topbar {
          min-height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.9rem 1.5rem;
          background: linear-gradient(145deg, rgba(18, 26, 33, 0.82), rgba(18, 26, 33, 0.58));
          border-bottom: 1px solid rgba(255,255,255,0.14);
          backdrop-filter: blur(18px) saturate(130%);
        }
        .admin-topbar span {
          display: block;
          color: rgba(255,255,255,0.68);
          font-size: 0.8rem;
        }
        .admin-topbar strong {
          color: white;
        }
        .admin-topbar-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .admin-topbar-actions a {
          color: #9bd8aa;
          font-weight: 700;
          text-decoration: none;
        }
        .admin-page-frame {
          min-width: 0;
          flex: 1;
          padding: 1.5rem;
        }
        .admin-shell .admin-container,
        .admin-shell .admin-form-container,
        .admin-shell .export-container {
          max-width: none !important;
          min-height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
        }
        .admin-shell .admin-header h1,
        .admin-shell .admin-container h1,
        .admin-shell .admin-container h2,
        .admin-shell .admin-form-card h1,
        .admin-shell .export-card h1,
        .admin-shell .settings-panel h2 {
          color: white !important;
          text-shadow: 0 2px 18px rgba(0,0,0,0.32) !important;
        }
        .admin-shell .admin-table-container,
        .admin-shell .admin-form-card,
        .admin-shell .export-card,
        .admin-shell .settings-panel,
        .admin-shell .event-stats-grid div,
        .admin-shell .calendar-panel,
        .admin-shell .attendee-panel,
        .admin-shell .announcement-form,
        .admin-shell .admin-form {
          background: linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08)) !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.22) !important;
          box-shadow: 0 18px 45px rgba(0,0,0,0.22) !important;
          backdrop-filter: blur(22px) saturate(130%) !important;
        }
        .admin-shell .admin-table {
          color: white !important;
        }
        .admin-shell .admin-table th {
          background: rgba(13,18,23,0.68) !important;
          color: white !important;
          border-bottom: 1px solid rgba(255,255,255,0.12) !important;
        }
        .admin-shell .admin-table td {
          color: rgba(255,255,255,0.82) !important;
          border-bottom: 1px solid rgba(255,255,255,0.1) !important;
        }
        .admin-shell .admin-table tr:hover {
          background: rgba(255,255,255,0.08) !important;
        }
        .admin-shell label,
        .admin-shell p,
        .admin-shell span {
          text-shadow: none !important;
        }
        .admin-shell .admin-form-card label,
        .admin-shell .export-card p,
        .admin-shell .export-card span,
        .admin-shell .settings-panel label,
        .admin-shell .announcement-form label,
        .admin-shell .admin-form label {
          color: rgba(255,255,255,0.78) !important;
        }
        .admin-shell input,
        .admin-shell textarea,
        .admin-shell select {
          background: rgba(255,255,255,0.08) !important;
          border: 1px solid rgba(255,255,255,0.22) !important;
          color: white !important;
          color-scheme: dark;
        }
        .admin-shell select option {
          background: #111827 !important;
          color: white !important;
        }
        @media (max-width: 900px) {
          .admin-shell {
            grid-template-columns: 1fr;
          }
          .admin-sidebar {
            position: static;
            height: auto;
            overflow: visible;
          }
          .admin-nav {
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
            overflow: visible;
            padding-right: 0;
          }
          .admin-sidebar-footer {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
