const Booking = require('../models/Booking');

const getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { user: req.user.id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('event', 'title startDate')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      success: true,
      data: { bookings, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({ ...req.body, user: req.user.id });
    res.status(201).json({ success: true, data: { booking } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { status: 'cancelled' }, 
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking cancelled', data: { booking } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBookings, createBooking, cancelBooking };