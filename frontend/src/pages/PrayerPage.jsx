import React, { useState, useEffect } from 'react';
import prayerService from '../services/prayerService';

const PrayerPage = () => {
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    urgency: 'normal',
    visibility: 'community',
    isAnonymous: false
  });

  useEffect(() => {
    loadPrayerRequests();
  }, []);

  const loadPrayerRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await prayerService.getPrayerRequests({ limit: 50 });
      setPrayerRequests(response.data?.prayerRequests || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load prayer requests.');
    } finally {
      setLoading(false);
    }
  };

  const handlePray = async (id) => {
    try {
      await prayerService.prayForRequest(id);
      setMessage('Prayer recorded.');
      setError(null);
      loadPrayerRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to record prayer.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await prayerService.createPrayerRequest(formData);
      setMessage('Prayer request submitted.');
      setFormData({ title: '', description: '', category: 'personal', urgency: 'normal', visibility: 'community', isAnonymous: false });
      await loadPrayerRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit prayer request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container prayer-page">
      <section className="prayer-hero">
        <div>
          <span>Pray with the chapel family</span>
          <h1>Prayer Requests</h1>
          <p>
            Share what you are carrying, quietly or openly. The chapel community can stand with you in prayer,
            and the ministry team can respond when a request needs pastoral care.
          </p>
        </div>
        <aside>
          <strong>You are not alone</strong>
          <p>Requests may be posted anonymously, and every prayer added here is a small act of care around someone’s real life.</p>
        </aside>
      </section>

      <section className="prayer-care-grid" aria-label="Prayer care notes">
        <div>
          <strong>Share honestly</strong>
          <span>Write enough for people to pray with understanding.</span>
        </div>
        <div>
          <strong>Choose urgency</strong>
          <span>Mark urgent needs so the chapel team can notice them quickly.</span>
        </div>
        <div>
          <strong>Pray for others</strong>
          <span>Use the pray button to let someone know they are being remembered.</span>
        </div>
      </section>

      {message && <div className="success-message">{message}</div>}
      <div className="two-columns prayer-layout">
        <div className="form-card">
          <div className="prayer-form-heading">
            <span>Request prayer</span>
            <h2>Share a Request</h2>
            <p>Keep it simple, specific, and safe. You can leave your name out if that feels better.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <input name="title" placeholder="Prayer title" value={formData.title} onChange={handleChange} required />
            <textarea name="description" placeholder="What should we pray for?" rows="5" value={formData.description} onChange={handleChange} required />
            <select name="category" value={formData.category} onChange={handleChange}>
              <option value="personal">Personal</option>
              <option value="family">Family</option>
              <option value="health">Health</option>
              <option value="academic">Academic</option>
              <option value="financial">Financial</option>
              <option value="spiritual">Spiritual</option>
              <option value="other">Other</option>
            </select>
            <select name="urgency" value={formData.urgency} onChange={handleChange}>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="critical">Critical</option>
            </select>
            <select name="visibility" value={formData.visibility} onChange={handleChange}>
              <option value="community">Whole chapel community</option>
              <option value="chaplain">Chaplain only</option>
            </select>
            <label className="checkbox-label">
              <input type="checkbox" name="isAnonymous" checked={formData.isAnonymous} onChange={handleChange} />
              Post anonymously
            </label>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
        <div className="elegant-list">
          <div className="prayer-list-heading">
            <span>Community prayers</span>
            <h2>Pray for someone today</h2>
          </div>
          {loading && <p className="member-empty">Loading prayer requests...</p>}
          {error && <p className="error-message">{error}</p>}
          {prayerRequests.length > 0 ? (
            prayerRequests.map(request => (
              <div key={request._id} className="prayer-item">
                <div className="prayer-item-header">
                  <h2>{request.title}</h2>
                  <div className="prayer-badges">
                    <span className={`prayer-urgency urgency-${request.urgency}`}>{request.urgency}</span>
                    <span className="prayer-visibility">{request.visibility === 'chaplain' ? 'Chaplain only' : 'Community'}</span>
                  </div>
                </div>
                <p>{request.description}</p>
                <p className="prayer-meta-line">
                  <strong>Category:</strong> {request.category}
                </p>
                {request.canViewPrayerCount && (
                  <p className="prayer-count-private">
                    {request.prayerCount || 0} {(request.prayerCount || 0) === 1 ? 'person has' : 'people have'} prayed for you
                  </p>
                )}
                {request.status === 'answered' && request.adminResponse && (
                  <div className="prayer-answer">
                    <strong>Admin response</strong>
                    <p>{request.adminResponse}</p>
                  </div>
                )}
                <button
                  onClick={() => handlePray(request._id)}
                  disabled={!request.viewerCanPray || request.viewerHasPrayed}
                >
                  {request.viewerHasPrayed ? 'Prayed' : 'Pray for this'}
                </button>
              </div>
            ))
          ) : (
            !loading && (
              <div className="no-data rich-empty">
                <strong>No prayer requests right now.</strong>
                <span>When someone shares a request, it will appear here for the community to pray with them.</span>
              </div>
            )
          )}
        </div>
      </div>

      <style>{`
        .prayer-hero {
          min-height: 330px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 1.2rem;
          align-items: end;
          margin: 1rem 0 1.2rem;
          padding: 1.5rem;
          border-radius: 8px;
          overflow: hidden;
          color: white;
          background:
            linear-gradient(90deg, rgba(10,16,21,0.92), rgba(10,16,21,0.56), rgba(10,16,21,0.86)),
            url('https://images.pexels.com/photos/8468474/pexels-photo-8468474.jpeg?auto=compress&cs=tinysrgb&w=1600');
          background-size: cover;
          background-position: center;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: 0 18px 45px rgba(0,0,0,0.24);
        }
        .prayer-hero span,
        .prayer-form-heading span,
        .prayer-list-heading span {
          display: inline-block;
          color: #9bd8aa;
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }
        .prayer-hero h1 {
          font-size: clamp(2.1rem, 5vw, 4rem);
          line-height: 1;
          margin-bottom: 0.8rem;
        }
        .prayer-hero p,
        .prayer-form-heading p {
          color: rgba(255,255,255,0.78);
        }
        .prayer-hero aside {
          padding: 1rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(18px);
        }
        .prayer-hero aside strong {
          display: block;
          color: white;
          margin-bottom: 0.35rem;
        }
        .prayer-care-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.85rem;
          margin-bottom: 1.2rem;
        }
        .prayer-care-grid div {
          padding: 1rem;
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.16);
          color: white;
          backdrop-filter: blur(16px);
        }
        .prayer-care-grid strong,
        .prayer-care-grid span {
          display: block;
        }
        .prayer-care-grid span {
          color: rgba(255,255,255,0.72);
          margin-top: 0.25rem;
        }
        .prayer-form-heading,
        .prayer-list-heading {
          margin-bottom: 1rem;
        }
        .prayer-form-heading h2,
        .prayer-list-heading h2 {
          color: white;
          line-height: 1.2;
        }
        .prayer-item-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.8rem;
          margin-bottom: 0.5rem;
        }
        .prayer-badges {
          display: flex;
          justify-content: flex-end;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .prayer-urgency {
          flex: 0 0 auto;
          padding: 0.22rem 0.6rem;
          border-radius: 999px;
          color: white;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: capitalize;
        }
        .prayer-visibility,
        .prayer-count-private {
          border-radius: 999px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.16);
          color: rgba(255,255,255,0.78);
          font-size: 0.78rem;
          font-weight: 800;
          padding: 0.22rem 0.6rem;
        }
        .prayer-count-private {
          display: inline-flex;
          margin: 0.2rem 0 0.85rem;
        }
        .prayer-meta-line {
          color: rgba(255,255,255,0.68) !important;
        }
        .rich-empty {
          display: grid;
          gap: 0.35rem;
        }
        .rich-empty strong {
          color: white;
          font-size: 1.2rem;
        }
        .rich-empty span {
          color: rgba(255,255,255,0.72);
        }
        @media (max-width: 968px) {
          .prayer-hero,
          .prayer-care-grid {
            grid-template-columns: 1fr;
          }
          .prayer-hero {
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default PrayerPage;
