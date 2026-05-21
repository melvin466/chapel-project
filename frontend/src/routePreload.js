export const routeLoaders = {
  HomePage: () => import('./pages/HomePage'),
  EventsPage: () => import('./pages/EventsPage'),
  EventDetailPage: () => import('./pages/EventDetailPage'),
  LoginPage: () => import('./pages/LoginPage'),
  RegisterPage: () => import('./pages/RegisterPage'),
  ForgotPasswordPage: () => import('./pages/ForgotPasswordPage'),
  ResetPasswordPage: () => import('./pages/ResetPasswordPage'),
  VerifyEmailPage: () => import('./pages/VerifyEmailPage'),
  PrayerPage: () => import('./pages/PrayerPage'),
  DonationsPage: () => import('./pages/DonationsPage'),
  DashboardPage: () => import('./pages/DashboardPage'),
  ProfilePage: () => import('./pages/ProfilePage'),
  NotificationsPage: () => import('./pages/NotificationsPage'),
  FeedbackPage: () => import('./pages/FeedbackPage'),
  AnnouncementsPage: () => import('./pages/AnnouncementsPage'),
  AnnouncementDetailPage: () => import('./pages/AnnouncementDetailPage'),
  SermonsPage: () => import('./pages/SermonsPage'),
  SermonDetailPage: () => import('./pages/SermonDetailPage'),
  CellsPage: () => import('./pages/CellsPage'),
  AdminDashboardPage: () => import('./pages/AdminDashboardPage'),
  BookingsPage: () => import('./pages/BookingsPage'),
  GivePage: () => import('./pages/GivePage'),
  AdminEvents: () => import('./pages/AdminEvents'),
  AdminAnnouncements: () => import('./pages/AdminAnnouncements'),
  AdminPrayerRequests: () => import('./pages/AdminPrayerRequests'),
  AdminUsers: () => import('./pages/AdminUsers'),
  AdminSettings: () => import('./pages/AdminSettings'),
  AdminBookings: () => import('./pages/AdminBookings'),
  AdminDonations: () => import('./pages/AdminDonations'),
  AdminAuditLogs: () => import('./pages/AdminAuditLogs'),
  AdminSermons: () => import('./pages/AdminSermons'),
  AdminCells: () => import('./pages/AdminCells'),
  AdminEventForm: () => import('./pages/AdminEventForm'),
  AdminAnnouncementForm: () => import('./pages/AdminAnnouncementForm'),
  AdminUserForm: () => import('./pages/AdminUserForm'),
  AdminExport: () => import('./pages/AdminExport'),
  AdminReports: () => import('./pages/AdminReports'),
};

const routePreloads = {
  '/': routeLoaders.HomePage,
  '/events': routeLoaders.EventsPage,
  '/announcements': routeLoaders.AnnouncementsPage,
  '/sermons': routeLoaders.SermonsPage,
  '/cells': routeLoaders.CellsPage,
  '/prayer': routeLoaders.PrayerPage,
  '/give': routeLoaders.GivePage,
  '/bookings': routeLoaders.BookingsPage,
  '/login': routeLoaders.LoginPage,
  '/register': routeLoaders.RegisterPage,
  '/dashboard': routeLoaders.DashboardPage,
  '/profile': routeLoaders.ProfilePage,
  '/notifications': routeLoaders.NotificationsPage,
  '/admin': routeLoaders.AdminDashboardPage,
  '/admin/events': routeLoaders.AdminEvents,
  '/admin/announcements': routeLoaders.AdminAnnouncements,
  '/admin/bookings': routeLoaders.AdminBookings,
  '/admin/sermons': routeLoaders.AdminSermons,
  '/admin/cells': routeLoaders.AdminCells,
  '/admin/prayers': routeLoaders.AdminPrayerRequests,
  '/admin/donations': routeLoaders.AdminDonations,
  '/admin/users': routeLoaders.AdminUsers,
  '/admin/reports': routeLoaders.AdminReports,
  '/admin/audit-logs': routeLoaders.AdminAuditLogs,
  '/admin/settings': routeLoaders.AdminSettings,
};

const preloadCache = new Map();

export const preloadRoute = (path) => {
  const loader = routePreloads[path];

  if (!loader || preloadCache.has(path)) {
    return;
  }

  preloadCache.set(path, loader().catch(() => {
    preloadCache.delete(path);
  }));
};
