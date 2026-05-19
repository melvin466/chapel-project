import React, { useEffect, useMemo, useState } from 'react';
import donationService from '../services/donationService';

const donationTypes = {
  tithe: 'Tithe',
  offering: 'Offering',
  pledge: 'Pledge',
  building: 'Building Fund',
  missions: 'Missions',
  benevolence: 'Benevolence',
};

const statuses = ['pending', 'completed', 'failed', 'refunded'];
const paymentMethods = ['mobile_money', 'bank_transfer', 'cash', 'credit_card'];

const formatMoney = (amount, currency = 'UGX') => (
  `${currency} ${Number(amount || 0).toLocaleString()}`
);

const donorName = (donation) => {
  if (donation.isAnonymous) return 'Anonymous donor';
  if (donation.donor) return `${donation.donor.firstName || ''} ${donation.donor.lastName || ''}`.trim() || donation.donor.email;
  return donation.donorName || donation.donorEmail || 'Guest donor';
};

const AdminDonations = () => {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [receiptDrafts, setReceiptDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const visibleTotal = useMemo(
    () => donations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0),
    [donations]
  );

  const loadDonations = async () => {
    try {
      setLoading(true);
      const [listResponse, statsResponse] = await Promise.all([
        donationService.getManageDonations({
          status: statusFilter || undefined,
          type: typeFilter || undefined,
          paymentMethod: methodFilter || undefined,
        }),
        donationService.getDonationStats(),
      ]);

      const list = listResponse.data?.donations || [];
      setDonations(list);
      setStats(statsResponse.data || null);
      setReceiptDrafts(list.reduce((acc, donation) => {
        acc[donation._id] = donation.receiptNumber || '';
        return acc;
      }, {}));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, [statusFilter, typeFilter, methodFilter]);

  const updateDonation = async (id, data, successText) => {
    setError('');
    setMessage('');

    try {
      await donationService.updateManagedDonation(id, data);
      setMessage(successText);
      await loadDonations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update donation');
    }
  };

  const saveReceipt = (donation) => {
    const receiptNumber = receiptDrafts[donation._id]?.trim();
    updateDonation(
      donation._id,
      { receiptNumber, receiptSent: Boolean(receiptNumber) },
      receiptNumber ? 'Receipt details saved.' : 'Receipt cleared.'
    );
  };

  if (loading) return <div className="loading">Loading donations...</div>;

  return (
    <div className="admin-container admin-donations-page">
      <div className="admin-header">
        <div>
          <span className="profile-role">Finance desk</span>
          <h1>Donation Management</h1>
        </div>
      </div>

      <div className="admin-donation-summary">
        <div>
          <strong>{formatMoney(stats?.totalAmount || 0)}</strong>
          <span>Completed total</span>
        </div>
        <div>
          <strong>{stats?.totalCount || 0}</strong>
          <span>Completed gifts</span>
        </div>
        <div>
          <strong>{formatMoney(visibleTotal)}</strong>
          <span>Filtered total</span>
        </div>
        <div>
          <strong>{donations.length}</strong>
          <span>Shown records</span>
        </div>
      </div>

      <div className="admin-donation-toolbar">
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="">All types</option>
          {Object.entries(donationTypes).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)}>
          <option value="">All methods</option>
          {paymentMethods.map((method) => <option key={method} value={method}>{method.replace('_', ' ')}</option>)}
        </select>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      {donations.length === 0 ? (
        <p className="no-data">No donations found.</p>
      ) : (
        <div className="admin-donation-grid">
          {donations.map((donation) => (
            <article key={donation._id} className="admin-donation-card">
              <div className="admin-donation-topline">
                <span className={`donation-status status-${donation.status}`}>{donation.status}</span>
                <span>{donationTypes[donation.donationType] || donation.donationType}</span>
              </div>

              <h2>{formatMoney(donation.amount, donation.currency)}</h2>

              <div className="admin-donation-meta">
                <span>
                  <strong>Donor</strong>
                  {donorName(donation)}
                </span>
                <span>
                  <strong>Contact</strong>
                  {donation.donor?.phoneNumber || donation.phoneNumber || donation.donorEmail || donation.donor?.email || 'Not provided'}
                </span>
                <span>
                  <strong>Method</strong>
                  {donation.paymentMethod?.replace('_', ' ')}
                </span>
                <span>
                  <strong>Reference</strong>
                  {donation.transactionId || 'Not recorded'}
                </span>
                <span>
                  <strong>Date</strong>
                  {new Date(donation.createdAt).toLocaleString()}
                </span>
                <span>
                  <strong>Receipt</strong>
                  {donation.receiptSent ? 'Sent/recorded' : 'Not sent'}
                </span>
              </div>

              {donation.message && (
                <div className="admin-donation-note">
                  <strong>Message</strong>
                  <p>{donation.message}</p>
                </div>
              )}

              <label className="admin-receipt-field">
                Receipt number
                <div>
                  <input
                    value={receiptDrafts[donation._id] || ''}
                    onChange={(event) => setReceiptDrafts((current) => ({
                      ...current,
                      [donation._id]: event.target.value,
                    }))}
                    placeholder="e.g. RCP-2026-001"
                  />
                  <button type="button" onClick={() => saveReceipt(donation)}>Save</button>
                </div>
              </label>

              <div className="admin-donation-actions">
                <button onClick={() => updateDonation(donation._id, { status: 'completed' }, 'Donation marked completed.')} disabled={donation.status === 'completed'}>
                  Complete
                </button>
                <button className="btn-failed" onClick={() => updateDonation(donation._id, { status: 'failed' }, 'Donation marked failed.')} disabled={donation.status === 'failed'}>
                  Failed
                </button>
                <button className="btn-refund" onClick={() => updateDonation(donation._id, { status: 'refunded' }, 'Donation marked refunded.')} disabled={donation.status === 'refunded'}>
                  Refunded
                </button>
                {donation.status !== 'pending' && (
                  <button className="btn-pending" onClick={() => updateDonation(donation._id, { status: 'pending' }, 'Donation moved to pending.')}>
                    Pending
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <style>{`
        .admin-donations-page { max-width: 1200px; padding: 0 24px 3rem; margin: 0 auto; }
        .admin-header { display: flex; align-items: center; justify-content: space-between; margin: 1rem 0 1.2rem; }
        .admin-header h1 { color: white; font-size: 2rem; }
        .admin-donation-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.8rem; margin-bottom: 1rem; }
        .admin-donation-summary div {
          background: linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08));
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 8px;
          padding: 1rem;
          color: white;
          box-shadow: 0 14px 34px rgba(0,0,0,0.16);
        }
        .admin-donation-summary strong { display: block; font-size: 1.35rem; color: #9bd8aa; }
        .admin-donation-summary span { color: rgba(255,255,255,0.72); }
        .admin-donation-toolbar { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .admin-donation-toolbar select, .admin-receipt-field input {
          min-height: 42px;
          border: 1px solid rgba(31,41,51,0.16);
          border-radius: 8px;
          background: rgba(255,255,255,0.86);
          color: #1f2933;
          padding: 0.65rem 0.8rem;
        }
        .admin-donation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1rem; }
        .admin-donation-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08));
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: 8px;
          padding: 1.2rem;
          backdrop-filter: blur(22px) saturate(130%);
          box-shadow: 0 18px 45px rgba(0,0,0,0.22);
          overflow: hidden;
        }
        .admin-donation-topline, .admin-donation-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center; }
        .admin-donation-topline { justify-content: space-between; margin-bottom: 0.8rem; color: rgba(255,255,255,0.76); }
        .admin-donation-card h2 { color: white; font-size: 1.4rem; margin-bottom: 0.9rem; overflow-wrap: anywhere; }
        .donation-status { border-radius: 999px; padding: 0.25rem 0.65rem; color: white; font-size: 0.75rem; font-weight: 700; text-transform: capitalize; }
        .status-pending { background: #8a6d1f; }
        .status-completed { background: #2f7d46; }
        .status-failed { background: #c2413a; }
        .status-refunded { background: #315f72; }
        .admin-donation-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; margin-bottom: 1rem; }
        .admin-donation-meta span, .admin-donation-note {
          color: rgba(255,255,255,0.72);
          background: rgba(255,255,255,0.09);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 0.7rem;
          overflow-wrap: anywhere;
        }
        .admin-donation-meta strong, .admin-donation-note strong, .admin-receipt-field {
          display: block;
          color: white;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 0.2rem;
        }
        .admin-donation-note { margin-bottom: 1rem; }
        .admin-donation-note p { white-space: pre-wrap; }
        .admin-receipt-field { margin-bottom: 1rem; }
        .admin-receipt-field div { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; margin-top: 0.45rem; }
        .admin-receipt-field button, .admin-donation-actions button {
          border: 0;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          padding: 0.55rem 0.85rem;
          background: #2f7d46;
        }
        .admin-donation-actions button:disabled { opacity: 0.45; cursor: not-allowed; }
        .admin-donation-actions .btn-failed { background: #c2413a; }
        .admin-donation-actions .btn-refund { background: #315f72; }
        .admin-donation-actions .btn-pending { background: #8a5a1f; }
        @media (max-width: 820px) {
          .admin-donation-summary, .admin-donation-meta { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminDonations;
