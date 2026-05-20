import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import './App.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const PrayerPage = lazy(() => import('./pages/PrayerPage'));
const DonationsPage = lazy(() => import('./pages/DonationsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const AnnouncementDetailPage = lazy(() => import('./pages/AnnouncementDetailPage'));
const SermonsPage = lazy(() => import('./pages/SermonsPage'));
const SermonDetailPage = lazy(() => import('./pages/SermonDetailPage'));
const CellsPage = lazy(() => import('./pages/CellsPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const BookingsPage = lazy(() => import('./pages/BookingsPage'));
const GivePage = lazy(() => import('./pages/GivePage'));
const AdminEvents = lazy(() => import('./pages/AdminEvents'));
const AdminAnnouncements = lazy(() => import('./pages/AdminAnnouncements'));
const AdminPrayerRequests = lazy(() => import('./pages/AdminPrayerRequests'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminBookings = lazy(() => import('./pages/AdminBookings'));
const AdminDonations = lazy(() => import('./pages/AdminDonations'));
const AdminAuditLogs = lazy(() => import('./pages/AdminAuditLogs'));
const AdminSermons = lazy(() => import('./pages/AdminSermons'));
const AdminCells = lazy(() => import('./pages/AdminCells'));
const AdminEventForm = lazy(() => import('./pages/AdminEventForm'));
const AdminAnnouncementForm = lazy(() => import('./pages/AdminAnnouncementForm'));
const AdminUserForm = lazy(() => import('./pages/AdminUserForm'));
const AdminExport = lazy(() => import('./pages/AdminExport'));

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
  return <AdminLayout>{children}</AdminLayout>;
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
  return <AdminLayout>{children}</AdminLayout>;
};

// Public Route - Redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} />;
  }
  return children;
};

function AppRoutes() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className={`App ${isAdminPath ? 'admin-app' : ''}`}>
      {!isAdminPath && <Navbar />}
      <main className={isAdminPath ? 'admin-main' : undefined}>
            <Suspense fallback={<div className="loading">Loading page...</div>}>
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
              <Route path="/forgot-password" element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              } />
              <Route path="/reset-password" element={
                <PublicRoute>
                  <ResetPasswordPage />
                </PublicRoute>
              } />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              
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
                <AdminRoute>
                  <AdminEvents />
                </AdminRoute>
              } />
              <Route path="/admin/announcements" element={
                <ContentManagerRoute>
                  <AdminAnnouncements />
                </ContentManagerRoute>
              } />
              <Route path="/admin/bookings" element={
                <ContentManagerRoute>
                  <AdminBookings />
                </ContentManagerRoute>
              } />
              <Route path="/admin/donations" element={
                <AdminRoute>
                  <AdminDonations />
                </AdminRoute>
              } />
              <Route path="/admin/sermons" element={
                <ContentManagerRoute>
                  <AdminSermons />
                </ContentManagerRoute>
              } />
              <Route path="/admin/cells" element={
                <AdminRoute>
                  <AdminCells />
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
              <Route path="/admin/audit-logs" element={
                <AdminRoute>
                  <AdminAuditLogs />
                </AdminRoute>
              } />
              <Route path="/admin/export" element={
                <AdminRoute>
                  <AdminExport />
                </AdminRoute>
              } />
              
              {/* ===== ADMIN CREATE/EDIT ROUTES ===== */}
              <Route path="/admin/events/create" element={
                <AdminRoute>
                  <AdminEventForm />
                </AdminRoute>
              } />
              <Route path="/admin/events/edit/:id" element={
                <AdminRoute>
                  <AdminEventForm />
                </AdminRoute>
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
            </Suspense>
      </main>
      {!isAdminPath && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
