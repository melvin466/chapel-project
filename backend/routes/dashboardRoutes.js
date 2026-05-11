const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDashboardStats,
  getMyEvents,
  getMyPrayers,
  getMyNotifications,
  getDashboardData
} = require('../controllers/dashboardController');

// All dashboard routes require authentication
router.use(protect);

// Get all dashboard data in one request (recommended)
router.get('/all', getDashboardData);

// Get individual dashboard data
router.get('/stats', getDashboardStats);
router.get('/my-events', getMyEvents);
router.get('/my-prayers', getMyPrayers);
router.get('/my-notifications', getMyNotifications);

module.exports = router;