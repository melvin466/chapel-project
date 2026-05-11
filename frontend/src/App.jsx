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
import BookingsPage from './pages/BookingsPage';
import GivePage from './pages/GivePage';

import AdminEvents from './pages/AdminEvents';
import AdminAnnouncements from './pages/AdminAnnouncements';
import AdminPrayerRequests from './pages/AdminPrayerRequests';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';

// NEW IMPORTS FOR CREATE/EDIT FORMS
import AdminEventForm from './pages/AdminEventForm';
import AdminAnnouncementForm from './pages/AdminAnnouncementForm';
import AdminUserForm from './pages/AdminUserForm';
import AdminExport from './pages/AdminExport';

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

// Content Manager Route Component - Accessible to admin or chaplain
const ContentManagerRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (user?.role !== 'admin' && user?.role !== 'chaplain') {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

// Public Route - Redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} />;
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
              {/* ===== PUBLIC ROUTES (No login required) ===== */}
              <Route path="/" element={<HomePage />} />
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
              
              {/* ===== PROTECTED ROUTES (Login required) ===== */}
              <Route path="/events" element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              } />
              <Route path="/events/:id" element={
                <ProtectedRoute>
                  <EventDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/announcements" element={
                <ProtectedRoute>
                  <AnnouncementsPage />
                </ProtectedRoute>
              } />
              <Route path="/announcements/:id" element={
                <ProtectedRoute>
                  <AnnouncementDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/sermons" element={
                <ProtectedRoute>
                  <SermonsPage />
                </ProtectedRoute>
              } />
              <Route path="/sermons/:id" element={
                <ProtectedRoute>
                  <SermonDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/cells" element={
                <ProtectedRoute>
                  <CellsPage />
                </ProtectedRoute>
              } />
              <Route path="/prayer" element={
                <ProtectedRoute>
                  <PrayerPage />
                </ProtectedRoute>
              } />
              <Route path="/donations" element={
                <ProtectedRoute>
                  <DonationsPage />
                </ProtectedRoute>
              } />
              <Route path="/feedback" element={
                <ProtectedRoute>
                  <FeedbackPage />
                </ProtectedRoute>
              } />
              <Route path="/bookings" element={
                <ProtectedRoute>
                  <BookingsPage />
                </ProtectedRoute>
              } />
              <Route path="/give" element={
                <ProtectedRoute>
                  <GivePage />
                </ProtectedRoute>
              } />
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
              
              {/* ===== ADMIN ONLY ROUTES ===== */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboardPage />
                </AdminRoute>
              } />
              <Route path="/admin/events" element={
                <ContentManagerRoute>
                  <AdminEvents />
                </ContentManagerRoute>
              } />
              <Route path="/admin/announcements" element={
                <ContentManagerRoute>
                  <AdminAnnouncements />
                </ContentManagerRoute>
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
              <Route path="/admin/export" element={
                <AdminRoute>
                  <AdminExport />
                </AdminRoute>
              } />
              
              {/* ===== ADMIN/CHAPLAIN CREATE/EDIT ROUTES ===== */}
              <Route path="/admin/events/create" element={
                <ContentManagerRoute>
                  <AdminEventForm />
                </ContentManagerRoute>
              } />
              <Route path="/admin/events/edit/:id" element={
                <ContentManagerRoute>
                  <AdminEventForm />
                </ContentManagerRoute>
              } />
              <Route path="/admin/announcements/create" element={
                <ContentManagerRoute>
                  <AdminAnnouncementForm />
                </ContentManagerRoute>
              } />
              <Route path="/admin/announcements/edit/:id" element={
                <ContentManagerRoute>
                  <AdminAnnouncementForm />
                </ContentManagerRoute>
              } />
              <Route path="/admin/users/create" element={
                <AdminRoute>
                  <AdminUserForm />
                </AdminRoute>
              } />
              <Route path="/admin/users/edit/:id" element={
                <AdminRoute>
                  <AdminUserForm />
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
