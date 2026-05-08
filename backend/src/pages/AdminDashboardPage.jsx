import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { donationService } from '../services/donationService';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    events: 0,
    announcements: 0,
    users: 0,
    donations: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      const [eventsRes, donationsRes] = await Promise.all([
        eventService.getEvents(),
        donationService.getDonations()
      ]);
      
      setStats({
        events: eventsRes.data?.events?.length || 0,
        announcements: 0,
        users: 0,
        donations: donationsRes.data?.donations?.length || 0,
        totalAmount: donationsRes.data?.donations?.reduce((sum, d) => sum + d.amount, 0) || 0
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'white' }}>
        <div style={{ width: '50px', height: '50px', border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #4CAF50', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0', minHeight: '70vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', color: 'white', marginBottom: '0.5rem', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)' }}>Welcome back, {user?.firstName}! 👋</p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', margin: '2rem 0' }}>
          <div style={{ background: 'rgba(255,255,255,0.95)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.3s' }} onClick={() => navigate('/admin/events')}>
            <h3 style={{ fontSize: '2rem', color: '#4CAF50', marginBottom: '0.5rem' }}>{stats.events}</h3>
            <p style={{ color: '#666' }}>Total Events</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.95)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.3s' }} onClick={() => navigate('/admin/announcements')}>
            <h3 style={{ fontSize: '2rem', color: '#4CAF50', marginBottom: '0.5rem' }}>{stats.announcements}</h3>
            <p style={{ color: '#666' }}>Announcements</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.95)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.3s' }} onClick={() => navigate('/admin/users')}>
            <h3 style={{ fontSize: '2rem', color: '#4CAF50', marginBottom: '0.5rem' }}>{stats.users}</h3>
            <p style={{ color: '#666' }}>Total Users</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.95)', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.3s' }} onClick={() => navigate('/admin/donations')}>
            <h3 style={{ fontSize: '2rem', color: '#4CAF50', marginBottom: '0.5rem' }}>UGX {stats.totalAmount.toLocaleString()}</h3>
            <p style={{ color: '#666' }}>Total Donations</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#333', marginBottom: '1rem', borderBottom: '2px solid #4CAF50', paddingBottom: '0.5rem' }}>Quick Admin Actions</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <button onClick={() => navigate('/admin/events/create')} style={{ padding: '0.8rem 1.5rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>➕ Create Event</button>
            <button onClick={() => navigate('/admin/announcements/create')} style={{ padding: '0.8rem 1.5rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>📢 Post Announcement</button>
            <button onClick={() => navigate('/admin/users')} style={{ padding: '0.8rem 1.5rem', background: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>👥 Manage Users</button>
            <button onClick={() => navigate('/admin/settings')} style={{ padding: '0.8rem 1.5rem', background: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>⚙️ Settings</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardPage;