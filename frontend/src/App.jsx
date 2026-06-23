import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AdminLayout from './components/AdminLayout';
import PageSkeleton from './components/PageSkeleton';
import { routeLoaders, preloadRoutes } from './routePreload';
import './App.css';

const HomePage = lazy(routeLoaders.HomePage);
const EventsPage = lazy(routeLoaders.EventsPage);
const EventDetailPage = lazy(routeLoaders.EventDetailPage);
const LoginPage = lazy(routeLoaders.LoginPage);
const RegisterPage = lazy(routeLoaders.RegisterPage);
const ForgotPasswordPage = lazy(routeLoaders.ForgotPasswordPage);
const ResetPasswordPage = lazy(routeLoaders.ResetPasswordPage);
const VerifyEmailPage = lazy(routeLoaders.VerifyEmailPage);
const PrayerPage = lazy(routeLoaders.PrayerPage);
const DonationsPage = lazy(routeLoaders.DonationsPage);
const DashboardPage = lazy(routeLoaders.DashboardPage);
const ProfilePage = lazy(routeLoaders.ProfilePage);
const NotificationsPage = lazy(routeLoaders.NotificationsPage);
const FeedbackPage = lazy(routeLoaders.FeedbackPage);
const AnnouncementsPage = lazy(routeLoaders.AnnouncementsPage);
const AnnouncementDetailPage = lazy(routeLoaders.AnnouncementDetailPage);
const SermonsPage = lazy(routeLoaders.SermonsPage);
const SermonDetailPage = lazy(routeLoaders.SermonDetailPage);
const CellsPage = lazy(routeLoaders.CellsPage);
const CellDetailPage = lazy(routeLoaders.CellDetailPage);
const AdminDashboardPage = lazy(routeLoaders.AdminDashboardPage);
const BookingsPage = lazy(routeLoaders.BookingsPage);
const GivePage = lazy(routeLoaders.GivePage);
const AdminEvents = lazy(routeLoaders.AdminEvents);
const AdminAnnouncements = lazy(routeLoaders.AdminAnnouncements);
const AdminPrayerRequests = lazy(routeLoaders.AdminPrayerRequests);
const AdminUsers = lazy(routeLoaders.AdminUsers);
const AdminSettings = lazy(routeLoaders.AdminSettings);
const AdminBookings = lazy(routeLoaders.AdminBookings);
const AdminDonations = lazy(routeLoaders.AdminDonations);
const AdminAuditLogs = lazy(routeLoaders.AdminAuditLogs);
const AdminSermons = lazy(routeLoaders.AdminSermons);
const AdminCells = lazy(routeLoaders.AdminCells);
const AdminEventForm = lazy(routeLoaders.AdminEventForm);
const AdminAnnouncementForm = lazy(routeLoaders.AdminAnnouncementForm);
const AdminUserForm = lazy(routeLoaders.AdminUserForm);
const AdminExport = lazy(routeLoaders.AdminExport);
const AdminReports = lazy(routeLoaders.AdminReports);

// Protected Route Component - Only accessible when logged in
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <PageSkeleton />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return children;
};

const hasAdminPower = (user) => ['admin', 'chaplain'].includes(user?.role);

// Admin Route Component - Accessible to admin-power roles
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) {
    return <PageSkeleton variant="admin" />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (!hasAdminPower(user)) {
    return <Navigate to="/dashboard" />;
  }
  return <AdminLayout>{children}</AdminLayout>;
};

// Content Manager Route Component - Kept for route readability
const ContentManagerRoute = ({ children }) => {
  return <AdminRoute>{children}</AdminRoute>;
};

// Public Route - Redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) {
    return <PageSkeleton />;
  }
  if (isAuthenticated) {
    return <Navigate to={hasAdminPower(user) ? '/admin' : '/'} />;
  }
  return children;
};

function AppRoutes() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  React.useEffect(() => {
    const warmRoutes = () => {
      preloadRoutes();
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(warmRoutes, { timeout: 1800 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(warmRoutes, 900);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className={`App ${isAdminPath ? 'admin-app' : ''}`}>
      {!isAdminPath && <Navbar />}
      <main className={isAdminPath ? 'admin-main' : undefined}>
            <Suspense key={`${location.pathname}${location.search}`} fallback={<PageSkeleton variant={isAdminPath ? 'admin' : 'public'} />}>
            <Routes location={location}>
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
              
              {/* ===== PUBLIC DISCOVERY ROUTES ===== */}
              <Route path="/events" element={
                <EventsPage />
              } />
              <Route path="/events/:id" element={
                <EventDetailPage />
              } />
              <Route path="/announcements" element={
                <AnnouncementsPage />
              } />
              <Route path="/announcements/:id" element={
                <AnnouncementDetailPage />
              } />
              <Route path="/sermons" element={
                <SermonsPage />
              } />
              <Route path="/sermons/:id" element={
                <SermonDetailPage />
              } />
              <Route path="/cells" element={
                <CellsPage />
              } />
              <Route path="/cells/:id" element={
                <ProtectedRoute>
                  <CellDetailPage />
                </ProtectedRoute>
              } />

              {/* ===== PROTECTED ROUTES (Login required) ===== */}
              <Route path="/prayer" element={
                <ProtectedRoute>
                  <PrayerPage />
                </ProtectedRoute>
              } />
              <Route path="/donations" element={
                <DonationsPage />
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
                <GivePage />
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
                <ContentManagerRoute>
                  <AdminPrayerRequests />
                </ContentManagerRoute>
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
              <Route path="/admin/reports" element={
                <AdminRoute>
                  <AdminReports />
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
