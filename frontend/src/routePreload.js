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
  CellDetailPage: () => import('./pages/CellDetailPage'),
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
  '/donations': routeLoaders.DonationsPage,
  '/feedback': routeLoaders.FeedbackPage,
  '/give': routeLoaders.GivePage,
  '/bookings': routeLoaders.BookingsPage,
  '/login': routeLoaders.LoginPage,
  '/register': routeLoaders.RegisterPage,
  '/forgot-password': routeLoaders.ForgotPasswordPage,
  '/reset-password': routeLoaders.ResetPasswordPage,
  '/verify-email': routeLoaders.VerifyEmailPage,
  '/dashboard': routeLoaders.DashboardPage,
  '/profile': routeLoaders.ProfilePage,
  '/notifications': routeLoaders.NotificationsPage,
  '/admin': routeLoaders.AdminDashboardPage,
  '/admin/events': routeLoaders.AdminEvents,
  '/admin/events/create': routeLoaders.AdminEventForm,
  '/admin/announcements': routeLoaders.AdminAnnouncements,
  '/admin/announcements/create': routeLoaders.AdminAnnouncementForm,
  '/admin/bookings': routeLoaders.AdminBookings,
  '/admin/sermons': routeLoaders.AdminSermons,
  '/admin/cells': routeLoaders.AdminCells,
  '/admin/prayers': routeLoaders.AdminPrayerRequests,
  '/admin/donations': routeLoaders.AdminDonations,
  '/admin/users': routeLoaders.AdminUsers,
  '/admin/users/create': routeLoaders.AdminUserForm,
  '/admin/reports': routeLoaders.AdminReports,
  '/admin/audit-logs': routeLoaders.AdminAuditLogs,
  '/admin/export': routeLoaders.AdminExport,
  '/admin/settings': routeLoaders.AdminSettings,
};

const preloadCache = new Map();

const dynamicRoutePreloads = [
  [/^\/events\/[^/]+$/, routeLoaders.EventDetailPage, '/events/:id'],
  [/^\/announcements\/[^/]+$/, routeLoaders.AnnouncementDetailPage, '/announcements/:id'],
  [/^\/sermons\/[^/]+$/, routeLoaders.SermonDetailPage, '/sermons/:id'],
  [/^\/cells\/[^/]+$/, routeLoaders.CellDetailPage, '/cells/:id'],
  [/^\/admin\/events\/edit\/[^/]+$/, routeLoaders.AdminEventForm, '/admin/events/edit/:id'],
  [/^\/admin\/announcements\/edit\/[^/]+$/, routeLoaders.AdminAnnouncementForm, '/admin/announcements/edit/:id'],
  [/^\/admin\/users\/edit\/[^/]+$/, routeLoaders.AdminUserForm, '/admin/users/edit/:id'],
];

export const routePreloadPaths = Object.keys(routePreloads);

const normalizePath = (path) => {
  if (!path) return '/';
  const pathname = path.split('?')[0].split('#')[0];
  return pathname !== '/' ? pathname.replace(/\/$/, '') : pathname;
};

const getRoutePreload = (path) => {
  const normalizedPath = normalizePath(path);

  if (routePreloads[normalizedPath]) {
    return { cacheKey: normalizedPath, loader: routePreloads[normalizedPath] };
  }

  const dynamicMatch = dynamicRoutePreloads.find(([pattern]) => pattern.test(normalizedPath));
  if (!dynamicMatch) {
    return null;
  }

  return { cacheKey: dynamicMatch[2], loader: dynamicMatch[1] };
};

export const preloadRoute = (path) => {
  const routePreload = getRoutePreload(path);

  if (!routePreload || preloadCache.has(routePreload.cacheKey)) {
    return;
  }

  preloadCache.set(routePreload.cacheKey, routePreload.loader().catch(() => {
    preloadCache.delete(routePreload.cacheKey);
  }));
};

export const preloadRoutes = (paths = routePreloadPaths) => {
  paths.forEach(preloadRoute);
};

export const preloadProps = (path) => ({
  onMouseEnter: () => preloadRoute(path),
  onPointerEnter: () => preloadRoute(path),
  onPointerDown: () => preloadRoute(path),
  onTouchStart: () => preloadRoute(path),
  onFocus: () => preloadRoute(path),
});
