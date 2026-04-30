import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrayerPage from './pages/PrayerPage';
import DonationsPage from './pages/DonationsPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import FeedbackPage from './pages/FeedbackPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AnnouncementDetailPage from './pages/AnnouncementDetailPage';
import SermonsPage from './pages/SermonsPage';
import SermonDetailPage from './pages/SermonDetailPage';
import CellsPage from './pages/CellsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// FIXED: Import from ./pages/ NOT ./pages/admin/
import AdminEvents from './pages/AdminEvents';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminPrayerRequests from './pages/AdminPrayerRequests';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';

import './App.css';

// Protected Route Component - Only accessible when logged in
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return children;
};

// Admin Route Component - Only accessible when logged in as admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

// Public Route - Redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main>
            <Routes>
              {/* Public Routes - Everyone can see */}
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
              <Route path="/sermons" element={<SermonsPage />} />
              <Route path="/sermons/:id" element={<SermonDetailPage />} />
              <Route path="/cells" element={<CellsPage />} />
              <Route path="/prayer" element={<PrayerPage />} />
              <Route path="/donations" element={<DonationsPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              
              {/* Auth Routes - Redirect to dashboard if already logged in */}
              <Route path="/login" element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              } />
              
              {/* Protected Routes - Require login */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes - Require admin role */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              } />
              <Route path="/admin/events" element={
                <AdminRoute>
                  <AdminEvents />
                </AdminRoute>
              } />
              <Route path="/admin/announcements" element={
                <AdminRoute>
                  <AdminAnnouncements />
                </AdminRoute>
              } />
              <Route path="/admin/prayers" element={
                <AdminRoute>
                  <AdminPrayerRequests />
                </AdminRoute>
              } />
              <Route path="/admin/users" element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              } />
              <Route path="/admin/settings" element={
                <AdminRoute>
                  <AdminSettings />
                </AdminRoute>
              } />
              
              {/* Fallback for any unknown routes */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;