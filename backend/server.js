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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
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

routes.forEach(({ path, route }) => app.use(path, route));

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  });