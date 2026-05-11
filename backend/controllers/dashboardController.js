const Event = require('../models/Event');
const PrayerRequest = require('../models/PrayerRequest');
const Notification = require('../models/Notification');
const Booking = require('../models/Booking');

// @desc    Get dashboard statistics for logged-in user
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get counts for different activities
    const [registeredEventsCount, prayerRequestsCount, unreadNotificationsCount, bookingsCount] = await Promise.all([
      Event.countDocuments({ attendees: userId, status: 'published' }),
      PrayerRequest.countDocuments({ requestedBy: userId }),
      Notification.countDocuments({ user: userId, isRead: false, isDeleted: false }),
      Booking.countDocuments({ user: userId, status: { $ne: 'cancelled' } })
    ]);

    res.json({
      success: true,
      data: {
        registeredEvents: registeredEventsCount,
        prayerRequests: prayerRequestsCount,
        unreadNotifications: unreadNotificationsCount,
        activeBookings: bookingsCount
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's upcoming events
// @route   GET /api/dashboard/my-events
// @access  Private
const getMyEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;

    const events = await Event.find({ 
      attendees: userId, 
      status: 'published',
      startDate: { $gte: new Date() }
    })
    .sort({ startDate: 1 })
    .limit(parseInt(limit))
    .select('title startDate startTime endTime location featuredImage');

    res.json({
      success: true,
      data: { events }
    });
  } catch (error) {
    console.error('Error getting my events:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's prayer requests
// @route   GET /api/dashboard/my-prayers
// @access  Private
const getMyPrayers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;

    const prayers = await PrayerRequest.find({ requestedBy: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('title description status prayerCount createdAt');

    res.json({
      success: true,
      data: { prayers }
    });
  } catch (error) {
    console.error('Error getting my prayers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's recent notifications
// @route   GET /api/dashboard/my-notifications
// @access  Private
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;

    const notifications = await Notification.find({ user: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('title message type isRead createdAt');

    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      isRead: false, 
      isDeleted: false 
    });

    res.json({
      success: true,
      data: { 
        notifications,
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error getting my notifications:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get complete dashboard data (all in one)
// @route   GET /api/dashboard/all
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    // Run all queries in parallel for better performance
    const [stats, upcomingEvents, recentPrayers, recentNotifications] = await Promise.all([
      // Stats
      Promise.all([
        Event.countDocuments({ attendees: userId, status: 'published' }),
        PrayerRequest.countDocuments({ requestedBy: userId }),
        Notification.countDocuments({ user: userId, isRead: false, isDeleted: false }),
        Booking.countDocuments({ user: userId, status: { $ne: 'cancelled' } })
      ]),
      
      // Upcoming events
      Event.find({ 
        attendees: userId, 
        status: 'published',
        startDate: { $gte: new Date() }
      })
      .sort({ startDate: 1 })
      .limit(limit)
      .select('title startDate startTime endTime location featuredImage _id'),
      
      // Recent prayers
      PrayerRequest.find({ requestedBy: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('title description status prayerCount createdAt _id'),
      
      // Recent notifications
      Notification.find({ user: userId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('title message type isRead createdAt _id')
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          registeredEvents: stats[0],
          prayerRequests: stats[1],
          unreadNotifications: stats[2],
          activeBookings: stats[3]
        },
        upcomingEvents,
        recentPrayers,
        recentNotifications
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getMyEvents,
  getMyPrayers,
  getMyNotifications,
  getDashboardData
};