import React, { useEffect, useState } from 'react';
import auditService from '../services/auditService';

const resources = ['User', 'Event', 'Announcement', 'PrayerRequest', 'Booking', 'Donation', 'Setting'];

const actorName = (actor) => {
  if (!actor) return 'System/unknown';
  return `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.email;
};

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [resourceFilter, setResourceFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await auditService.getAuditLogs({
        resource: resourceFilter || undefined,
        action: actionFilter || undefined,
      });
      setLogs(response.data?.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [resourceFilter, actionFilter]);

  const actions = Array.from(new Set(logs.map((log) => log.action))).sort();

  if (loading) return <div className="loading">Loading audit logs...</div>;

  return (
    <div className="admin-container admin-audit-page">
      <div className="admin-header">
        <div>
          <span className="profile-role">Security trail</span>
          <h1>Audit Logs</h1>
        </div>
      </div>

      <div className="audit-toolbar">
        <select value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value)}>
          <option value="">All resources</option>
          {resources.map((resource) => <option key={resource} value={resource}>{resource}</option>)}
        </select>
        <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
          <option value="">All actions</option>
          {actions.map((action) => <option key={action} value={action}>{action}</option>)}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {logs.length === 0 ? (
        <p className="no-data">No audit records found.</p>
      ) : (
        <div className="audit-log-list">
          {logs.map((log) => (
            <article key={log._id} className="audit-log-card">
              <div className="audit-log-topline">
                <span>{log.action}</span>
                <time>{new Date(log.createdAt).toLocaleString()}</time>
              </div>
              <h2>{log.resource}{log.resourceId ? ` #${log.resourceId.slice(-6)}` : ''}</h2>
              <div className="audit-log-meta">
                <span>
                  <strong>Actor</strong>
                  {actorName(log.actor)}
                </span>
                <span>
                  <strong>Role</strong>
                  {log.actorRole || log.actor?.role || 'unknown'}
                </span>
                <span>
                  <strong>IP</strong>
                  {log.ipAddress || 'Not captured'}
                </span>
              </div>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
              )}
            </article>
          ))}
        </div>
      )}

      <style>{`
        .admin-audit-page { max-width: 1200px; padding: 0 24px 3rem; margin: 0 auto; }
        .admin-header { margin: 1rem 0 1.2rem; }
        .admin-header h1 { color: white; font-size: 2rem; }
        .audit-toolbar { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .audit-toolbar select {
          min-height: 42px;
          border: 1px solid rgba(31,41,51,0.16);
          border-radius: 8px;
          background: rgba(255,255,255,0.86);
          color: #1f2933;
          padding: 0.65rem 0.8rem;
        }
        .audit-log-list { display: grid; gap: 0.85rem; }
        .audit-log-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08));
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 8px;
          padding: 1rem;
          backdrop-filter: blur(22px) saturate(130%);
          box-shadow: 0 14px 34px rgba(0,0,0,0.16);
          overflow: hidden;
        }
        .audit-log-topline { display: flex; justify-content: space-between; gap: 1rem; color: #9bd8aa; font-weight: 800; margin-bottom: 0.4rem; }
        .audit-log-topline time { color: rgba(255,255,255,0.66); font-weight: 500; }
        .audit-log-card h2 { color: white; font-size: 1.1rem; margin-bottom: 0.8rem; overflow-wrap: anywhere; }
        .audit-log-meta { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.65rem; }
        .audit-log-meta span {
          color: rgba(255,255,255,0.72);
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 0.65rem;
          overflow-wrap: anywhere;
        }
        .audit-log-meta strong { display: block; color: white; font-size: 0.75rem; text-transform: uppercase; }
        .audit-log-card pre {
          margin-top: 0.85rem;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          color: rgba(255,255,255,0.78);
          background: rgba(0,0,0,0.22);
          border-radius: 8px;
          padding: 0.8rem;
        }
        @media (max-width: 720px) {
          .audit-log-meta { grid-template-columns: 1fr; }
          .audit-log-topline { flex-direction: column; }
        }
      `}</style>
    </div>
  );
};

export default AdminAuditLogs;
