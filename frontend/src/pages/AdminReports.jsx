import React, { useEffect, useState } from 'react';
import reportService from '../services/reportService';

const reportTypes = [
  { id: 'events', name: 'Events', description: 'Event schedule, status, registration and check-in totals.' },
  { id: 'attendance', name: 'Attendance', description: 'Registered attendees and check-in status per event.' },
  { id: 'bookings', name: 'Bookings', description: 'Booking requests, decisions, assignments and review reasons.' },
  { id: 'donations', name: 'Donations', description: 'Donation totals, payment status, receipts and donor details.' },
  { id: 'users', name: 'Users', description: 'Member list with roles, active status and verification state.' },
];

const typeOptions = {
  events: [
    ['worship_service', 'Worship Service'],
    ['fellowship', 'Fellowship'],
    ['conference', 'Conference'],
    ['retreat', 'Retreat'],
    ['prayer_meeting', 'Prayer Meeting'],
    ['bible_study', 'Bible Study'],
    ['wedding', 'Wedding'],
    ['baptism', 'Baptism'],
    ['seminar', 'Seminar'],
    ['workshop', 'Workshop'],
    ['crusade', 'Crusade'],
    ['other', 'Other'],
  ],
  bookings: [
    ['counselling', 'Counselling'],
    ['wedding', 'Wedding'],
    ['baptism', 'Baptism'],
    ['facility', 'Facility'],
    ['appointment', 'Appointment'],
  ],
  donations: [
    ['tithe', 'Tithe'],
    ['offering', 'Offering'],
    ['pledge', 'Pledge'],
    ['building', 'Building Fund'],
    ['missions', 'Missions'],
    ['benevolence', 'Benevolence'],
  ],
};

const statusOptions = {
  events: ['draft', 'published', 'cancelled', 'completed'],
  attendance: ['draft', 'published', 'cancelled', 'completed'],
  bookings: ['pending', 'approved', 'denied', 'cancelled', 'completed'],
  donations: ['pending', 'completed', 'failed', 'refunded'],
};

const roleOptions = ['member', 'chaplain', 'admin', 'student_leader'];

const formatMoney = (value) => `UGX ${Number(value || 0).toLocaleString()}`;

const downloadBlob = (response, fallbackName) => {
  const disposition = response.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] || fallbackName;
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const AdminReports = () => {
  const [summary, setSummary] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    type: '',
    role: '',
    paymentMethod: '',
    isActive: '',
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSummary();
  }, []);

  const activeParams = () => Object.entries(filters).reduce((params, [key, value]) => {
    if (value !== '') params[key] = value;
    return params;
  }, {});

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await reportService.getSummary(activeParams());
      setSummary(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const resetFilters = async () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      type: '',
      role: '',
      paymentMethod: '',
      isActive: '',
    });
    try {
      setLoading(true);
      const response = await reportService.getSummary();
      setSummary(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      setExporting(type);
      setError('');
      const response = await reportService.exportReport(type, activeParams());
      downloadBlob(response, `${type}_report.csv`);
      setMessage(`${reportTypes.find((item) => item.id === type)?.name || 'Report'} downloaded.`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to export report');
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="admin-reports-page">
      <div className="reports-header">
        <div>
          <span className="reports-kicker">Admin reports</span>
          <h1>Reports</h1>
          <p>Generate CSV reports for attendance, bookings, donations, events, and members.</p>
        </div>
      </div>

      <section className="reports-filter-panel">
        <div className="filter-grid">
          <label>
            Start date
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
          </label>
          <label>
            End date
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
          </label>
          <label>
            Status
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All statuses</option>
              {[...new Set(Object.values(statusOptions).flat())].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select name="type" value={filters.type} onChange={handleFilterChange}>
              <option value="">All types</option>
              {[...typeOptions.events, ...typeOptions.bookings, ...typeOptions.donations].map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Role
            <select name="role" value={filters.role} onChange={handleFilterChange}>
              <option value="">All roles</option>
              {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </label>
          <label>
            Payment method
            <select name="paymentMethod" value={filters.paymentMethod} onChange={handleFilterChange}>
              <option value="">All methods</option>
              <option value="mobile_money">Mobile money</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit card</option>
            </select>
          </label>
        </div>
        <div className="filter-actions">
          <button type="button" onClick={loadSummary} disabled={loading} className="btn-primary">
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
          <button type="button" onClick={resetFilters} className="btn-secondary">Reset</button>
        </div>
      </section>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {summary && (
        <>
          <section className="reports-summary-grid">
            <div>
              <strong>{summary.events.total}</strong>
              <span>Events</span>
            </div>
            <div>
              <strong>{summary.attendance.checkedIn} / {summary.attendance.registered}</strong>
              <span>Checked in</span>
            </div>
            <div>
              <strong>{summary.attendance.checkInRate}%</strong>
              <span>Attendance rate</span>
            </div>
            <div>
              <strong>{summary.bookings.total}</strong>
              <span>Bookings</span>
            </div>
            <div>
              <strong>{formatMoney(summary.donations.completedAmount)}</strong>
              <span>Completed giving</span>
            </div>
            <div>
              <strong>{summary.users.total}</strong>
              <span>Users</span>
            </div>
          </section>

          <section className="reports-download-grid">
            {reportTypes.map((report) => (
              <article key={report.id} className="report-card">
                <div>
                  <h2>{report.name}</h2>
                  <p>{report.description}</p>
                </div>
                <button type="button" onClick={() => handleExport(report.id)} disabled={Boolean(exporting)}>
                  {exporting === report.id ? 'Downloading...' : 'Download CSV'}
                </button>
              </article>
            ))}
          </section>
        </>
      )}

      <style>{`
        .admin-reports-page { display: grid; gap: 1rem; }
        .reports-header, .reports-filter-panel, .report-card, .reports-summary-grid div {
          background: #fff;
          border: 1px solid #dbe3ea;
          border-radius: 8px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        }
        .reports-header { padding: 1.25rem; }
        .reports-kicker { color: #2f7d46; font-weight: 800; text-transform: uppercase; font-size: 0.78rem; }
        .reports-header h1 { margin: 0.2rem 0; color: #1f2933; }
        .reports-header p, .report-card p { color: #5b6673; }
        .reports-filter-panel { padding: 1rem; }
        .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0.85rem; }
        .filter-grid label { display: grid; gap: 0.35rem; color: #374151; font-weight: 700; }
        .filter-grid input, .filter-grid select {
          min-height: 42px;
          border: 1px solid #cfd8e3;
          border-radius: 8px;
          padding: 0.65rem 0.75rem;
          background: #fff;
          color: #1f2933;
        }
        .filter-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem; }
        .reports-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem; }
        .reports-summary-grid div { padding: 1rem; }
        .reports-summary-grid strong { display: block; color: #1f2933; font-size: 1.45rem; line-height: 1.1; margin-bottom: 0.35rem; }
        .reports-summary-grid span { color: #5b6673; }
        .reports-download-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
        .report-card { display: grid; gap: 1rem; padding: 1rem; align-content: space-between; }
        .report-card h2 { margin-bottom: 0.35rem; color: #1f2933; font-size: 1.15rem; }
        .report-card button {
          justify-self: start;
          border: 0;
          border-radius: 8px;
          padding: 0.65rem 0.9rem;
          color: #fff;
          background: #2f7d46;
          cursor: pointer;
        }
        .report-card button:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default AdminReports;
