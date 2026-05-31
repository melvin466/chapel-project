const Booking = require('../models/Booking');
const { recordAuditLog } = require('../utils/auditLogger');
const { notifyUser, notifyAudience } = require('../utils/notificationDispatcher');

const getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { user: req.user.id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('event', 'title startDate')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: { bookings, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getManageBookings = async (req, res) => {
  try {
    const { page = 1, limit = 100, status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.bookingType = type;

    const bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email phoneNumber')
      .populate('assignedTo', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .populate('event', 'title startDate')
      .sort({ requestedDate: 1, requestedTime: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: { bookings, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({
      bookingType: req.body.bookingType,
      requestedDate: req.body.requestedDate,
      requestedTime: req.body.requestedTime,
      purpose: req.body.purpose,
      numberOfPeople: req.body.numberOfPeople,
      specialRequests: req.body.specialRequests,
      event: req.body.event,
      user: req.user.id,
      status: 'pending',
    });

    await notifyAudience('leaders', {
      type: 'booking',
      title: 'New Venue/Service Booking Request',
      message: `${req.user.firstName || 'A member'} has requested a booking for: "${booking.purpose || booking.bookingType}"`,
      data: { bookingId: booking._id }
    });

    res.status(201).json({ success: true, data: { booking } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, status: { $in: ['pending', 'approved'] } },
      { status: 'cancelled' }, 
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking cancelled', data: { booking } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const updateManagedBooking = async (req, res) => {
  try {
    const allowedStatuses = ['pending', 'approved', 'denied', 'cancelled', 'completed'];
    const updateData = {};

    if (req.body.status !== undefined) {
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Invalid booking status' });
      }
      if (['approved', 'denied'].includes(req.body.status) && !req.body.reviewReason?.trim()) {
        return res.status(400).json({ success: false, message: 'A reason is required to approve or deny a booking' });
      }
      updateData.status = req.body.status;
    }

    if (req.body.assignedTo !== undefined) {
      updateData.assignedTo = req.body.assignedTo || null;
    }

    if (req.body.reviewReason !== undefined) {
      updateData.reviewReason = req.body.reviewReason.trim();
    }

    if (['approved', 'denied'].includes(updateData.status)) {
      updateData.reviewedBy = req.user.id;
      updateData.reviewedAt = new Date();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No booking updates provided' });
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('user', 'firstName lastName email phoneNumber')
      .populate('assignedTo', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .populate('event', 'title startDate');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (['approved', 'denied'].includes(updateData.status)) {
      await notifyUser(booking.user?._id || booking.user, {
        type: 'booking',
        title: updateData.status === 'approved' ? 'Booking approved' : 'Booking denied',
        message: booking.reviewReason,
        data: { bookingId: booking._id, status: booking.status },
      });
    }

    await recordAuditLog(req, {
      action: 'booking.manage_update',
      resource: 'Booking',
      resourceId: booking._id,
      metadata: {
        status: booking.status,
        assignedTo: booking.assignedTo,
        requestedBy: booking.user,
        reviewReason: booking.reviewReason,
      },
    });

    res.json({ success: true, data: { booking } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

module.exports = { getBookings, getManageBookings, createBooking, cancelBooking, updateManagedBooking };
