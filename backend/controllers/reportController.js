const Booking = require('../models/Booking');
const Donation = require('../models/Donation');
const Event = require('../models/Event');
const User = require('../models/User');

const reportTypes = ['events', 'attendance', 'bookings', 'donations', 'users'];

const escapeCsv = (value) => {
  if (value === undefined || value === null) return '';
  const stringValue = value instanceof Date ? value.toISOString() : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const sendCsv = (res, filename, headers, rows) => {
  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
};

const buildDateFilter = (field, query) => {
  const range = {};
  if (query.startDate) {
    const start = new Date(query.startDate);
    if (!Number.isNaN(start.getTime())) range.$gte = start;
  }
  if (query.endDate) {
    const end = new Date(query.endDate);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
  }
  return Object.keys(range).length > 0 ? { [field]: range } : {};
};

const getEventFilter = (query) => {
  const filter = { ...buildDateFilter('startDate', query) };
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  return filter;
};

const getBookingFilter = (query) => {
  const filter = { ...buildDateFilter('requestedDate', query) };
  if (query.status) filter.status = query.status;
  if (query.type) filter.bookingType = query.type;
  return filter;
};

const getDonationFilter = (query) => {
  const filter = { ...buildDateFilter('createdAt', query) };
  if (query.status) filter.status = query.status;
  if (query.type) filter.donationType = query.type;
  if (query.paymentMethod) filter.paymentMethod = query.paymentMethod;
  return filter;
};

const getUserFilter = (query) => {
  const filter = { ...buildDateFilter('createdAt', query) };
  if (query.role) filter.role = query.role;
  if (query.isActive === 'true') filter.isActive = true;
  if (query.isActive === 'false') filter.isActive = false;
  return filter;
};

const countByField = async (Model, filter, field) => Model.aggregate([
  { $match: filter },
  { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  { $sort: { count: -1 } },
]);

const getReportSummary = async (req, res) => {
  try {
    const eventFilter = getEventFilter(req.query);
    const bookingFilter = getBookingFilter(req.query);
    const donationFilter = getDonationFilter(req.query);
    const userFilter = getUserFilter(req.query);

    const [
      events,
      eventStatuses,
      eventTypes,
      bookings,
      bookingStatuses,
      bookingTypes,
      donationTotals,
      donationTypes,
      donationStatuses,
      users,
      userRoles,
    ] = await Promise.all([
      Event.find(eventFilter).select('registeredCount attendees checkedInAttendees'),
      countByField(Event, eventFilter, 'status'),
      countByField(Event, eventFilter, 'type'),
      Booking.countDocuments(bookingFilter),
      countByField(Booking, bookingFilter, 'status'),
      countByField(Booking, bookingFilter, 'bookingType'),
      Donation.aggregate([
        { $match: donationFilter },
        { $group: { _id: '$status', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Donation.aggregate([
        { $match: donationFilter },
        { $group: { _id: '$donationType', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { totalAmount: -1 } },
      ]),
      countByField(Donation, donationFilter, 'status'),
      User.countDocuments(userFilter),
      countByField(User, userFilter, 'role'),
    ]);

    const totalRegistered = events.reduce((sum, event) => sum + (event.registeredCount ?? event.attendees.length), 0);
    const totalCheckedIn = events.reduce((sum, event) => sum + ((event.checkedInAttendees || []).length), 0);
    const completedDonationTotal = donationTotals
      .filter((item) => item._id === 'completed')
      .reduce((sum, item) => sum + item.totalAmount, 0);
    const allDonationTotal = donationTotals.reduce((sum, item) => sum + item.totalAmount, 0);

    res.json({
      success: true,
      data: {
        filters: req.query,
        events: {
          total: events.length,
          byStatus: eventStatuses,
          byType: eventTypes,
        },
        attendance: {
          eventCount: events.length,
          registered: totalRegistered,
          checkedIn: totalCheckedIn,
          checkInRate: totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0,
        },
        bookings: {
          total: bookings,
          byStatus: bookingStatuses,
          byType: bookingTypes,
        },
        donations: {
          totalAmount: allDonationTotal,
          completedAmount: completedDonationTotal,
          byStatus: donationStatuses,
          byType: donationTypes,
        },
        users: {
          total: users,
          byRole: userRoles,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const exportEvents = async (req, res) => {
  const events = await Event.find(getEventFilter(req.query))
    .populate('createdBy', 'firstName lastName email')
    .sort({ startDate: 1 });

  sendCsv(res, 'events_report.csv', [
    'Event ID', 'Title', 'Type', 'Status', 'Start Date', 'End Date', 'Location', 'Capacity', 'Registered', 'Checked In', 'Created By'
  ], events.map((event) => [
    event._id,
    event.title,
    event.type,
    event.status,
    event.startDate,
    event.endDate,
    event.location,
    event.capacity ?? 0,
    event.registeredCount ?? event.attendees.length,
    (event.checkedInAttendees || []).length,
    event.createdBy ? `${event.createdBy.firstName || ''} ${event.createdBy.lastName || ''}`.trim() : '',
  ]));
};

const exportAttendance = async (req, res) => {
  const events = await Event.find(getEventFilter(req.query))
    .populate('attendees', 'firstName lastName email phoneNumber role')
    .sort({ startDate: 1 });

  const rows = [];
  events.forEach((event) => {
    const checkedInIds = new Set((event.checkedInAttendees || []).map((id) => id.toString()));
    if (event.attendees.length === 0) {
      rows.push([event._id, event.title, event.startDate, '', '', '', '', 'No attendees']);
      return;
    }
    event.attendees.forEach((attendee) => {
      rows.push([
        event._id,
        event.title,
        event.startDate,
        attendee.firstName,
        attendee.lastName,
        attendee.email,
        attendee.phoneNumber || '',
        checkedInIds.has(attendee._id.toString()) ? 'Checked in' : 'Registered',
      ]);
    });
  });

  sendCsv(res, 'attendance_report.csv', [
    'Event ID', 'Event', 'Event Date', 'First Name', 'Last Name', 'Email', 'Phone', 'Attendance Status'
  ], rows);
};

const exportBookings = async (req, res) => {
  const bookings = await Booking.find(getBookingFilter(req.query))
    .populate('user', 'firstName lastName email phoneNumber')
    .populate('assignedTo', 'firstName lastName email')
    .populate('reviewedBy', 'firstName lastName email')
    .sort({ requestedDate: 1, requestedTime: 1 });

  sendCsv(res, 'bookings_report.csv', [
    'Booking ID', 'Type', 'Status', 'Requested Date', 'Requested Time', 'People', 'Purpose', 'Member', 'Contact', 'Assigned To', 'Reviewed By', 'Review Reason'
  ], bookings.map((booking) => [
    booking._id,
    booking.bookingType,
    booking.status,
    booking.requestedDate,
    booking.requestedTime,
    booking.numberOfPeople,
    booking.purpose,
    booking.user ? `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() : '',
    booking.user?.phoneNumber || booking.user?.email || '',
    booking.assignedTo ? `${booking.assignedTo.firstName || ''} ${booking.assignedTo.lastName || ''}`.trim() : '',
    booking.reviewedBy ? `${booking.reviewedBy.firstName || ''} ${booking.reviewedBy.lastName || ''}`.trim() : '',
    booking.reviewReason || '',
  ]));
};

const exportDonations = async (req, res) => {
  const donations = await Donation.find(getDonationFilter(req.query))
    .populate('donor', 'firstName lastName email phoneNumber')
    .sort({ createdAt: -1 });

  sendCsv(res, 'donations_report.csv', [
    'Donation ID', 'Amount', 'Currency', 'Type', 'Status', 'Payment Method', 'Provider', 'Transaction ID', 'Donor', 'Phone', 'Created At', 'Completed At', 'Receipt Number'
  ], donations.map((donation) => [
    donation._id,
    donation.amount,
    donation.currency,
    donation.donationType,
    donation.status,
    donation.paymentMethod,
    donation.provider || '',
    donation.transactionId || '',
    donation.isAnonymous ? 'Anonymous' : (donation.donor ? `${donation.donor.firstName || ''} ${donation.donor.lastName || ''}`.trim() : donation.donorName || ''),
    donation.phoneNumber || donation.donor?.phoneNumber || '',
    donation.createdAt,
    donation.completedAt || '',
    donation.receiptNumber || '',
  ]));
};

const exportUsers = async (req, res) => {
  const users = await User.find(getUserFilter(req.query)).sort({ createdAt: -1 });

  sendCsv(res, 'users_report.csv', [
    'User ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Active', 'Email Verified', 'Created At', 'Last Login'
  ], users.map((user) => [
    user._id,
    user.firstName,
    user.lastName,
    user.email,
    user.phoneNumber,
    user.role,
    user.isActive ? 'Yes' : 'No',
    user.isEmailVerified ? 'Yes' : 'No',
    user.createdAt,
    user.lastLogin || '',
  ]));
};

const exportReport = async (req, res) => {
  try {
    const { type } = req.params;
    if (!reportTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    if (type === 'events') return exportEvents(req, res);
    if (type === 'attendance') return exportAttendance(req, res);
    if (type === 'bookings') return exportBookings(req, res);
    if (type === 'donations') return exportDonations(req, res);
    return exportUsers(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

module.exports = { getReportSummary, exportReport };
