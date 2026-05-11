import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import  eventService  from '../services/eventService';
import  announcementService  from '../services/announcementService';
import userService from '../services/userService';
import  donationService  from '../services/donationService';
import prayerService from '../services/prayerService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, Filler, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, Filler, PointElement, LineElement);

const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    events: { total: 0, published: 0, draft: 0, upcoming: 0, past: 0, monthly: [] },
    users: { total: 0, admins: 0, members: 0, chaplains: 0, newThisMonth: 0, recent: [] },
    prayers: { total: 0, active: 0, answered: 0, urgent: 0, recent: [] },
    donations: { total: 0, amount: 0, monthlyAmount: [], recent: [] },
    announcements: { total: 0, published: 0, draft: 0, recent: [] },
    revenueData: { labels: [], amounts: [] }
  });

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [eventsRes, usersRes, prayersRes, donationsRes, announcementsRes] = await Promise.all([
        eventService.getEvents({ limit: 100 }),
        userService.getUsers(),
        prayerService.getPrayerRequests(),
        donationService.getDonations(),
        announcementService.getAnnouncements({ limit: 100 })
      ]);

      const events = eventsRes.data?.events || [];
      const users = usersRes.data?.users || [];
      const prayers = prayersRes.data?.prayerRequests || [];
      const donations = donationsRes.data?.donations || [];
      const announcements = announcementsRes.data?.announcements || [];

      const now = new Date();
      const upcomingEvents = events.filter(e => new Date(e.startDate) > now && e.status === 'published');
      const pastEvents = events.filter(e => new Date(e.endDate) < now);
      
      // Monthly event data for chart
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), events: 0 };
      }).reverse();
      
      events.forEach(event => {
        const eventDate = new Date(event.startDate);
        const monthKey = eventDate.toLocaleString('default', { month: 'short' });
        const monthData = last6Months.find(m => m.month === monthKey);
        if (monthData) monthData.events++;
      });

      // Monthly donation data
      const monthlyDonations = last6Months.map(m => {
        const monthDonations = donations.filter(d => {
          const dDate = new Date(d.createdAt);
          return dDate.toLocaleString('default', { month: 'short' }) === m.month;
        });
        return monthDonations.reduce((sum, d) => sum + (d.amount || 0), 0);
      });

      setData({
        events: {
          total: events.length,
          published: events.filter(e => e.status === 'published').length,
          draft: events.filter(e => e.status === 'draft').length,
          upcoming: upcomingEvents.length,
          past: pastEvents.length,
          monthly: last6Months
        },
        users: {
          total: users.length,
          admins: users.filter(u => u.role === 'admin').length,
          members: users.filter(u => u.role === 'member').length,
          chaplains: users.filter(u => u.role === 'chaplain').length,
          newThisMonth: users.filter(u => new Date(u.createdAt).getMonth() === new Date().getMonth()).length,
          recent: users.slice(0, 6)
        },
        prayers: {
          total: prayers.length,
          active: prayers.filter(p => p.status === 'active').length,
          answered: prayers.filter(p => p.status === 'answered').length,
          urgent: prayers.filter(p => p.urgency === 'urgent' || p.urgency === 'critical').length,
          recent: prayers.slice(0, 6)
        },
        donations: {
          total: donations.length,
          amount: donations.reduce((sum, d) => sum + (d.amount || 0), 0),
          monthlyAmount: monthlyDonations,
          recent: donations.slice(0, 6)
        },
        announcements: {
          total: announcements.length,
          published: announcements.filter(a => a.status === 'published').length,
          draft: announcements.filter(a => a.status === 'draft').length,
          recent: announcements.slice(0, 5)
        },
        revenueData: {
          labels: last6Months.map(m => `${m.month}`),
          amounts: monthlyDonations
        }
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#fff', font: { size: 11 } } } }
  };

  const eventsChartData = {
    labels: ['Published', 'Draft', 'Upcoming', 'Past'],
    datasets: [{
      data: [data.events.published, data.events.draft, data.events.upcoming, data.events.past],
      backgroundColor: ['#4CAF50', '#FF9800', '#2196F3', '#9E9E9E'],
      borderRadius: 10
    }]
  };

  const revenueChartData = {
    labels: data.revenueData.labels,
    datasets: [{
      label: 'Donations (UGX)',
      data: data.revenueData.amounts,
      backgroundColor: 'rgba(76, 175, 80, 0.5)',
      borderColor: '#4CAF50',
      borderWidth: 2,
      fill: true,
      tension: 0.4
    }]
  };

  const statsCards = [
    { title: 'Total Events', value: data.events.total, icon: 'EV', color: '#2f7d46', change: '+12%', path: '/admin/events' },
    { title: 'Total Users', value: data.users.total, icon: 'US', color: '#315f72', change: `+${data.users.newThisMonth} this month`, path: '/admin/users' },
    { title: 'Prayer Requests', value: data.prayers.total, icon: 'PR', color: '#8a5a1f', change: `${data.prayers.active} active`, path: '/admin/prayers' },
    { title: 'Donations', value: `UGX ${(data.donations.amount / 1000000).toFixed(1)}M`, icon: 'DN', color: '#7a4665', change: `${data.donations.total} gifts`, path: '/admin/donations' },
    { title: 'Announcements', value: data.announcements.total, icon: 'AN', color: '#4c5f7a', change: `${data.announcements.published} published`, path: '/admin/announcements' },
    { title: 'Answered Prayers', value: data.prayers.answered, icon: 'OK', color: '#31706d', change: `${((data.prayers.answered / (data.prayers.total || 1)) * 100).toFixed(0)}% rate`, path: '/admin/prayers' }
  ];

  const quickActions = [
    { name: 'Create Event', icon: 'New', color: '#2f7d46', path: '/admin/events/create', desc: 'Add new service or event' },
    { name: 'Post Announcement', icon: 'Post', color: '#315f72', path: '/admin/announcements/create', desc: 'Share news with community' },
    { name: 'Add User', icon: 'User', color: '#4c5f7a', path: '/admin/users/create', desc: 'Register new member' },
    { name: 'Review Prayers', icon: 'Care', color: '#8a5a1f', path: '/admin/prayers', desc: 'Respond to requests' },
    { name: 'Export Data', icon: 'CSV', color: '#31706d', path: '/admin/export', desc: 'Download reports' },
    { name: 'Settings', icon: 'Set', color: '#607D8B', path: '/admin/settings', desc: 'Configure system' }
  ];

  if (loading) {
    return (
      <div className="admin-loader">
        <div className="loader-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${!sidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">CMS</span>
            {sidebarOpen && <span className="logo-text">Chapel Admin</span>}
          </div>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? 'Hide' : 'Show'}
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <span className="nav-icon">OV</span>
            {sidebarOpen && <span>Overview</span>}
          </button>
          <button className={`nav-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => navigate('/admin/events')}>
            <span className="nav-icon">EV</span>
            {sidebarOpen && <span>Events</span>}
          </button>
          <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => navigate('/admin/users')}>
            <span className="nav-icon">US</span>
            {sidebarOpen && <span>Users</span>}
          </button>
          <button className={`nav-item ${activeTab === 'prayers' ? 'active' : ''}`} onClick={() => navigate('/admin/prayers')}>
            <span className="nav-icon">PR</span>
            {sidebarOpen && <span>Prayers</span>}
          </button>
          <button className={`nav-item ${activeTab === 'donations' ? 'active' : ''}`} onClick={() => navigate('/admin/donations')}>
            <span className="nav-icon">DN</span>
            {sidebarOpen && <span>Donations</span>}
          </button>
          <button className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => navigate('/admin/announcements')}>
            <span className="nav-icon">AN</span>
            {sidebarOpen && <span>Announcements</span>}
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => navigate('/admin/settings')}>
            <span className="nav-icon">ST</span>
            {sidebarOpen && <span>Settings</span>}
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
            {sidebarOpen && (
              <div className="user-details">
                <span className="user-name">{user?.firstName} {user?.lastName}</span>
                <span className="user-role">Administrator</span>
              </div>
            )}
          </div>
          <button onClick={logout} className="logout-btn">
            <span className="nav-icon">OUT</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="main-header">
          <h1>Dashboard</h1>
          <div className="header-actions">
            <div className="date-display">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {statsCards.map((card, i) => (
            <div key={i} className="stat-card" onClick={() => navigate(card.path)}>
              <div className="stat-icon" style={{ backgroundColor: `${card.color}20`, color: card.color }}>{card.icon}</div>
              <div className="stat-content">
                <h3>{card.value}</h3>
                <p>{card.title}</p>
                <span className="stat-change">{card.change}</span>
              </div>
              <div className="stat-arrow">View</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          <div className="chart-card">
            <h3>Events Overview</h3>
            <div className="chart-container">
              <Pie data={eventsChartData} options={chartOptions} />
            </div>
          </div>
          <div className="chart-card">
            <h3>Revenue Trend (Last 6 Months)</h3>
            <div className="chart-container">
              <Line data={revenueChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            {quickActions.map((action, i) => (
              <button key={i} className="action-btn" style={{ borderLeftColor: action.color }} onClick={() => navigate(action.path)}>
                <span className="action-icon">{action.icon}</span>
                <div className="action-text">
                  <strong>{action.name}</strong>
                  <small>{action.desc}</small>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-grid">
          <div className="recent-card">
            <div className="card-header"><h3>Recent Events</h3><button onClick={() => navigate('/admin/events')}>View All</button></div>
            {data.events.monthly.slice(-5).map((item, i) => (
              <div key={i} className="activity-item"><span className="dot green"></span><span>{item.month}: {item.events} events</span></div>
            ))}
          </div>
          <div className="recent-card">
            <div className="card-header"><h3>Recent Prayers</h3><button onClick={() => navigate('/admin/prayers')}>View All</button></div>
            {data.prayers.recent.map((prayer, i) => (
              <div key={i} className="activity-item"><span className="dot orange"></span><span>{prayer.title}</span><small>{prayer.status}</small></div>
            ))}
          </div>
          <div className="recent-card">
            <div className="card-header"><h3>New Users</h3><button onClick={() => navigate('/admin/users')}>View All</button></div>
            {data.users.recent.map((user, i) => (
              <div key={i} className="activity-item"><span className="dot blue"></span><span>{user.firstName} {user.lastName}</span><small>{user.role}</small></div>
            ))}
          </div>
        </div>
      </main>

      <style jsx>{`
        .admin-wrapper { display: flex; min-height: 100vh; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); }
        
        /* Sidebar */
        .admin-sidebar {
          width: 280px;
          background: rgba(15, 12, 41, 0.95);
          backdrop-filter: blur(10px);
          transition: width 0.3s;
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        .admin-sidebar.collapsed { width: 80px; }
        .sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .logo { display: flex; align-items: center; gap: 0.5rem; color: white; font-size: 1.2rem; font-weight: bold; }
        .toggle-btn { background: none; border: none; color: white; cursor: pointer; font-size: 1rem; }
        .sidebar-nav { flex: 1; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .nav-item { display: flex; align-items: center; gap: 1rem; padding: 0.8rem 1rem; background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; border-radius: 12px; transition: all 0.3s; width: 100%; }
        .nav-item:hover, .nav-item.active { background: rgba(255,255,255,0.1); color: white; }
        .sidebar-footer { padding: 1rem; border-top: 1px solid rgba(255,255,255,0.1); }
        .user-info { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 1rem; }
        .user-avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
        .user-details { display: flex; flex-direction: column; }
        .user-name { color: white; font-weight: 500; }
        .user-role { color: rgba(255,255,255,0.5); font-size: 0.7rem; }
        .logout-btn { display: flex; align-items: center; gap: 1rem; width: 100%; padding: 0.8rem 1rem; background: rgba(244,67,54,0.2); border: none; border-radius: 12px; color: #f44336; cursor: pointer; }
        
        /* Main Content */
        .admin-main { flex: 1; padding: 1.5rem; overflow-y: auto; }
        .main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .main-header h1 { color: white; font-size: 1.8rem; }
        .date-display { background: rgba(255,255,255,0.1); padding: 0.5rem 1rem; border-radius: 50px; color: white; font-size: 0.85rem; }
        
        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .stat-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 1.2rem; display: flex; align-items: center; gap: 1rem; cursor: pointer; transition: all 0.3s; border: 1px solid rgba(255,255,255,0.1); }
        .stat-card:hover { transform: translateY(-5px); background: rgba(255,255,255,0.15); }
        .stat-icon { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .stat-content { flex: 1; }
        .stat-content h3 { font-size: 1.8rem; color: white; margin-bottom: 0.2rem; }
        .stat-content p { color: rgba(255,255,255,0.6); font-size: 0.8rem; margin-bottom: 0.3rem; }
        .stat-change { font-size: 0.7rem; color: #a8ff78; }
        .stat-arrow { color: rgba(255,255,255,0.3); font-size: 1.2rem; transition: transform 0.3s; }
        .stat-card:hover .stat-arrow { transform: translateX(5px); color: white; }
        
        /* Charts */
        .charts-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .chart-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 1.5rem; }
        .chart-card h3 { color: white; margin-bottom: 1rem; font-size: 1rem; }
        .chart-container { height: 250px; position: relative; }
        
        /* Quick Actions */
        .quick-actions-section { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 1.5rem; margin-bottom: 2rem; }
        .quick-actions-section h3 { color: white; margin-bottom: 1rem; }
        .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
        .action-btn { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border: none; border-left: 4px solid; border-radius: 12px; cursor: pointer; transition: all 0.3s; text-align: left; }
        .action-btn:hover { background: rgba(255,255,255,0.1); transform: translateX(5px); }
        .action-icon { font-size: 1.5rem; }
        .action-text { display: flex; flex-direction: column; }
        .action-text strong { color: white; font-size: 0.9rem; }
        .action-text small { color: rgba(255,255,255,0.5); font-size: 0.7rem; }
        
        /* Recent Activity */
        .recent-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
        .recent-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 20px; padding: 1.5rem; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .card-header h3 { color: white; font-size: 1rem; }
        .card-header button { background: none; border: none; color: #a8ff78; cursor: pointer; font-size: 0.8rem; }
        .activity-item { display: flex; align-items: center; gap: 0.8rem; padding: 0.7rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .activity-item:last-child { border-bottom: none; }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.green { background: #4CAF50; }
        .dot.orange { background: #FF9800; }
        .dot.blue { background: #2196F3; }
        .activity-item span { color: white; font-size: 0.85rem; flex: 1; }
        .activity-item small { color: rgba(255,255,255,0.5); font-size: 0.7rem; }
        
        /* Loader */
        .admin-loader { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); }
        .loader-spinner { width: 60px; height: 60px; border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid #4CAF50; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
          .admin-sidebar { position: fixed; z-index: 100; height: 100vh; transform: translateX(0); }
          .admin-sidebar.collapsed { transform: translateX(-100%); }
          .admin-main { margin-left: 0; }
          .stats-grid { grid-template-columns: 1fr; }
          .charts-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardPage;
