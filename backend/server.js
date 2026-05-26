const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const winston = require('winston');
const path = require('path');
const compression = require('compression');
const sanitizeRequest = require('./middleware/sanitize');
const { getErrorMessage } = require('./utils/errorResponse');
const { hasCloudinaryConfig } = require('./utils/cloudinaryMedia');

// Load environment variables
dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const weakJwtSecrets = new Set([
  'secret',
  'jwt_secret',
  'your_jwt_secret',
  'change_me',
  'changeme',
  'password',
]);

const validateJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (isProduction) throw new Error('JWT_SECRET is required in production');
    return;
  }

  if (secret.length < 32 || weakJwtSecrets.has(secret.toLowerCase())) {
    throw new Error('JWT_SECRET must be at least 32 characters and not use a default value');
  }
};

validateJwtSecret();

const getAllowedOrigins = () => {
  const configuredOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (isProduction) {
    if (configuredOrigins.length === 0) {
      throw new Error('CORS_ORIGINS or FRONTEND_URL is required in production');
    }

    const localOrigins = configuredOrigins.filter((origin) => /localhost|127\.0\.0\.1|\[::1\]/i.test(origin));
    if (localOrigins.length > 0) {
      throw new Error('Production CORS origins must not include localhost addresses');
    }

    return configuredOrigins;
  }

  return configuredOrigins.length > 0 ? configuredOrigins : ['http://localhost:3000', 'http://localhost:5173'];
};

const allowedOrigins = getAllowedOrigins();

const isLocalDevOrigin = (origin) => {
  if (!origin) return false;
  return /^(https?:\/\/)(localhost|127\.0\.0\.1|\[::1\]|\d+\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin);
};

if (isProduction && process.env.FRONTEND_URL && process.env.CORS_ORIGINS) {
  console.warn('Both FRONTEND_URL and CORS_ORIGINS are set; CORS_ORIGINS takes precedence.');
}

if (isProduction && !(process.env.MONGODB_URI || process.env.DB_URI)) {
  throw new Error('MONGODB_URI is required in production');
}

if (isProduction && process.env.MONGODB_TLS_ALLOW_INVALID_CERTS === 'true') {
  throw new Error('MONGODB_TLS_ALLOW_INVALID_CERTS must not be enabled in production');
}

if (isProduction && !hasCloudinaryConfig()) {
  throw new Error('Cloudinary configuration is required in production so uploaded media is not stored on ephemeral disk');
}

if (isProduction) {
  app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (!isProduction && isLocalDevOrigin(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
app.use(express.json({
  limit: process.env.JSON_BODY_LIMIT || '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeRequest);
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  dotfiles: 'deny',
  index: false,
  maxAge: isProduction ? '1d' : 0,
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Accept-Ranges', 'bytes');
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Logging
app.use(morgan('combined'));
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: isTest ? [] : [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
if (!isProduction && !isTest) {
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
    // Dashboard routes
    { method: 'GET', path: '/api/dashboard/all' },
    { method: 'GET', path: '/api/dashboard/stats' },
    { method: 'GET', path: '/api/dashboard/my-events' },
    { method: 'GET', path: '/api/dashboard/my-prayers' },
    { method: 'GET', path: '/api/dashboard/my-notifications' },
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
  { path: '/api/users', route: require('./routes/userRoutes') },
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
  { path: '/api/dashboard', route: require('./routes/dashboardRoutes') }, // ADDED DASHBOARD ROUTES
  { path: '/api/audit-logs', route: require('./routes/auditRoutes') },
  { path: '/api/reports', route: require('./routes/reportRoutes') },
];

const verificationRoutes = require('./routes/verificationRoutes');

routes.forEach(({ path, route }) => {
  app.use(path, route);
  if (!isProduction && !isTest) {
    console.log(`Route registered: ${path}`);
  }
});

app.use('/api', verificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

app.get('/api/ready', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'ready' : 'not_ready',
    database: databaseReady ? 'connected' : 'disconnected',
    timestamp: new Date(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Chapel Management System API',
    version: '1.0.0',
    endpoints: '/api/health, /api/auth, /api/events, /api/announcements, /api/prayers, /api/sermons, /api/cells, /api/bookings, /api/donations, /api/notifications, /api/feedback, /api/settings, /api/dashboard'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ 
    success: false, 
    message: getErrorMessage(err)
  });
});

module.exports = app;

if (process.env.NODE_ENV !== 'test') {
  // MongoDB connection
  const allowInvalidMongoCerts = !isProduction && process.env.MONGODB_TLS_ALLOW_INVALID_CERTS === 'true';
  const mongooseOptions = process.env.MONGODB_TLS === 'true'
    ? {
        tls: true,
        tlsAllowInvalidCertificates: allowInvalidMongoCerts,
      }
    : {};

  mongoose.connect(process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://localhost:27017/chapel-system', mongooseOptions)
    .then(() => {
      console.log('Connected to MongoDB');
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch(err => {
      console.error('MongoDB Error:', err.message);
      process.exit(1);
    });
}
