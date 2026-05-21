import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout = ({ children }) => {
  const { user, logout, isAdmin, isChaplain } = useAuth();
  const navigate = useNavigate();
  const canManageContent = isAdmin || isChaplain;

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
          {isAdmin && <NavLink to="/admin" end>Overview</NavLink>}
          {isAdmin && <NavLink to="/admin/events">Events</NavLink>}
          {canManageContent && <NavLink to="/admin/announcements">Announcements</NavLink>}
          {canManageContent && <NavLink to="/admin/bookings">Bookings</NavLink>}
          {canManageContent && <NavLink to="/admin/sermons">Sermons</NavLink>}
          {isAdmin && <NavLink to="/admin/cells">Cells</NavLink>}
          {isAdmin && <NavLink to="/admin/prayers">Prayers</NavLink>}
          {isAdmin && <NavLink to="/admin/donations">Donations</NavLink>}
          {isAdmin && <NavLink to="/admin/users">Users</NavLink>}
          {isAdmin && <NavLink to="/admin/reports">Reports</NavLink>}
          {isAdmin && <NavLink to="/admin/audit-logs">Audit Logs</NavLink>}
          {isAdmin && <NavLink to="/admin/settings">Settings</NavLink>}
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
          background: #f3f6f8;
          color: #1f2933;
        }
        .admin-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 1.25rem;
          background: #111827;
          color: white;
          border-right: 1px solid #243244;
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
          display: grid;
          gap: 0.25rem;
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
          margin-top: auto;
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
          background: #ffffff;
          border-bottom: 1px solid #dbe3ea;
        }
        .admin-topbar span {
          display: block;
          color: #6b7280;
          font-size: 0.8rem;
        }
        .admin-topbar strong {
          color: #1f2933;
        }
        .admin-topbar-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .admin-topbar-actions a {
          color: #315f72;
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
          color: #1f2933 !important;
          text-shadow: none !important;
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
          background: #ffffff !important;
          color: #1f2933 !important;
          border: 1px solid #dbe3ea !important;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08) !important;
          backdrop-filter: none !important;
        }
        .admin-shell .admin-table {
          color: #1f2933 !important;
        }
        .admin-shell .admin-table th {
          background: #eef4f0 !important;
          color: #1f2933 !important;
          border-bottom: 1px solid #dbe3ea !important;
        }
        .admin-shell .admin-table td {
          color: #374151 !important;
          border-bottom: 1px solid #edf1f4 !important;
        }
        .admin-shell .admin-table tr:hover {
          background: #f7faf8 !important;
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
          color: #374151 !important;
        }
        .admin-shell input,
        .admin-shell textarea,
        .admin-shell select {
          background: #ffffff !important;
          border: 1px solid #cfd8e3 !important;
          color: #1f2933 !important;
        }
        @media (max-width: 900px) {
          .admin-shell {
            grid-template-columns: 1fr;
          }
          .admin-sidebar {
            position: static;
            height: auto;
          }
          .admin-nav {
            grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
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
