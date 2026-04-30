const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS error: Origin ${origin} not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Logging
app.use(morgan('combined'));
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// ============ SIMPLE ROUTE LIST (MANUAL) ============
function logRegisteredRoutes() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              📋 REGISTERED API ENDPOINTS 📋                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const routeList = [
    { method: 'GET', path: '/api/health' },
    { method: 'POST', path: '/api/auth/register' },
    { method: 'POST', path: '/api/auth/login' },
    { method: 'GET', path: '/api/auth/me' },
    { method: 'GET', path: '/api/events' },
    { method: 'POST', path: '/api/events' },
    { method: 'GET', path: '/api/events/upcoming' },
    { method: 'GET', path: '/api/events/:id' },
    { method: 'POST', path: '/api/events/:id/register' },
    { method: 'PUT', path: '/api/events/:id' },
    { method: 'DELETE', path: '/api/events/:id' },
    { method: 'GET', path: '/api/announcements' },
    { method: 'POST', path: '/api/announcements' },
    { method: 'GET', path: '/api/announcements/:id' },
    { method: 'PUT', path: '/api/announcements/:id' },
    { method: 'DELETE', path: '/api/announcements/:id' },
    { method: 'GET', path: '/api/prayers' },
    { method: 'POST', path: '/api/prayers' },
    { method: 'POST', path: '/api/prayers/:id/pray' },
    { method: 'PUT', path: '/api/prayers/:id/status' },
    { method: 'GET', path: '/api/sermons' },
    { method: 'POST', path: '/api/sermons' },
    { method: 'GET', path: '/api/sermons/:id' },
    { method: 'POST', path: '/api/sermons/:id/like' },
    { method: 'GET', path: '/api/cells' },
    { method: 'GET', path: '/api/cells/:id' },
    { method: 'POST', path: '/api/cells' },
    { method: 'POST', path: '/api/cells/:id/join' },
    { method: 'GET', path: '/api/bookings' },
    { method: 'POST', path: '/api/bookings' },
    { method: 'PUT', path: '/api/bookings/:id/cancel' },
    { method: 'GET', path: '/api/donations' },
    { method: 'POST', path: '/api/donations' },
    { method: 'GET', path: '/api/donations/stats' },
    { method: 'GET', path: '/api/notifications' },
    { method: 'PUT', path: '/api/notifications/:id/read' },
    { method: 'PUT', path: '/api/notifications/read-all' },
    { method: 'GET', path: '/api/feedback' },
    { method: 'POST', path: '/api/feedback' },
    { method: 'GET', path: '/api/settings/public' },
    { method: 'GET', path: '/api/settings' },
    { method: 'PUT', path: '/api/settings/:key' },
  ];

  routeList.sort((a, b) => a.path.localeCompare(b.path));

  console.log('🔹 API ENDPOINTS:');
  console.log('─────────────────────────────────────────────────────────────');
  routeList.forEach(route => {
    console.log(`   ${route.method.padEnd(10)} ${route.path}`);
  });

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log(`📊 Total: ${routeList.length} endpoints`);
  console.log('═════════════════════════════════════════════════════════════\n');
}
// ============ END OF ROUTE LOGGER ============

// Routes
const routes = [
  { path: '/api/auth', route: require('./routes/authRoutes') },
  { path: '/api/events', route: require('./routes/eventRoutes') },
  { path: '/api/announcements', route: require('./routes/announcementRoutes') },
  { path: '/api/prayers', route: require('./routes/prayerRoutes') },
  { path: '/api/sermons', route: require('./routes/sermonRoutes') },
  { path: '/api/cells', route: require('./routes/cellRoutes') },
  { path: '/api/bookings', route: require('./routes/bookingRoutes') },
  { path: '/api/donations', route: require('./routes/donationRoutes') },
  { path: '/api/notifications', route: require('./routes/notificationRoutes') },
  { path: '/api/feedback', route: require('./routes/feedbackRoutes') },
  { path: '/api/settings', route: require('./routes/settingRoutes') },
];

const verificationRoutes = require('./routes/verificationRoutes');

routes.forEach(({ path, route }) => {
  app.use(path, route);
  console.log(`✅ Route registered: ${path}`);
});

app.use('/api', verificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    database: process.env.MONGODB_URI,
    timestamp: new Date(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Chapel Management System API',
    version: '1.0.0',
    endpoints: '/api/health, /api/auth, /api/events, /api/announcements, /api/prayers, /api/sermons, /api/cells, /api/bookings, /api/donations, /api/notifications, /api/feedback, /api/settings'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// MongoDB connection
const mongooseOptions = {
  tls: true, // Enable TLS/SSL
  tlsAllowInvalidCertificates: true, // Allow self-signed certificates (if needed)
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chapel-system', mongooseOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      // Display routes
      logRegisteredRoutes();
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  });