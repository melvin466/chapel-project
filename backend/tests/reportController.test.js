const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Donation = require('../models/Donation');
const AuditLog = require('../models/AuditLog');

let mongoServer;

const registerAndLogin = async ({ email, role = 'member' }) => {
  await request(app)
    .post('/api/auth/register')
    .send({
      firstName: role === 'admin' ? 'Report' : 'Member',
      lastName: 'Tester',
      email,
      password: 'Password123!',
      phoneNumber: '1234567890',
    });

  if (role !== 'member') {
    await User.findOneAndUpdate({ email }, { role });
  }

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Password123!' });

  const user = await User.findOne({ email });
  return { token: loginRes.body.data.token, user };
};

describe('Report endpoints', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  it('returns report summary for admins only', async () => {
    const admin = await registerAndLogin({ email: 'reportsadmin@example.com', role: 'admin' });
    const member = await registerAndLogin({ email: 'reportsmember@example.com' });

    // Set user creation dates outside the query range to make the test date-independent
    await User.updateMany({}, { createdAt: new Date('2026-05-01T00:00:00.000Z') });

    await Event.create({
      title: 'Attendance Sunday',
      description: 'Report event',
      type: 'worship_service',
      startDate: '2026-06-07T08:00:00.000Z',
      endDate: '2026-06-07T10:00:00.000Z',
      startTime: '08:00',
      endTime: '10:00',
      location: 'Chapel',
      status: 'published',
      registrationRequired: true,
      attendees: [member.user._id],
      checkedInAttendees: [member.user._id],
      registeredCount: 1,
      createdBy: admin.user._id,
    });

    await Booking.create({
      bookingType: 'facility',
      user: member.user._id,
      requestedDate: '2026-06-08T00:00:00.000Z',
      requestedTime: '12:00',
      status: 'approved',
      purpose: 'Hall use',
      reviewedBy: admin.user._id,
      reviewReason: 'Approved',
    });

    await Donation.create({
      amount: 5000,
      donationType: 'offering',
      donor: member.user._id,
      paymentMethod: 'cash',
      status: 'completed',
      completedAt: new Date('2026-06-01T00:00:00.000Z'),
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
    });

    await AuditLog.create({
      actor: admin.user._id,
      actorRole: 'admin',
      action: 'event.create',
      resource: 'Event',
      resourceId: 'someid',
      createdAt: new Date('2026-06-15T00:00:00.000Z'),
    });

    const blockedRes = await request(app)
      .get('/api/reports/summary')
      .set('Authorization', `Bearer ${member.token}`);

    expect(blockedRes.statusCode).toBe(403);

    const summaryRes = await request(app)
      .get('/api/reports/summary?startDate=2026-06-01&endDate=2026-06-30')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(summaryRes.statusCode).toBe(200);
    expect(summaryRes.body.data.events.total).toBe(1);
    expect(summaryRes.body.data.attendance.registered).toBe(1);
    expect(summaryRes.body.data.attendance.checkedIn).toBe(1);
    expect(summaryRes.body.data.attendance.checkInRate).toBe(100);
    expect(summaryRes.body.data.bookings.total).toBe(1);
    expect(summaryRes.body.data.donations.completedAmount).toBe(5000);
    expect(summaryRes.body.data.users.total).toBe(0);
    expect(summaryRes.body.data.processes.total).toBe(1);
  });

  it('exports attendance, booking, donation, user, and event CSV reports', async () => {
    const admin = await registerAndLogin({ email: 'csvadmin@example.com', role: 'admin' });
    const member = await registerAndLogin({ email: 'csvmember@example.com' });

    await Event.create({
      title: 'CSV Event',
      description: 'Report event',
      type: 'conference',
      startDate: '2026-07-10T08:00:00.000Z',
      endDate: '2026-07-10T10:00:00.000Z',
      startTime: '08:00',
      endTime: '10:00',
      location: 'Chapel',
      status: 'published',
      registrationRequired: true,
      attendees: [member.user._id],
      checkedInAttendees: [],
      registeredCount: 1,
      createdBy: admin.user._id,
    });

    await Booking.create({
      bookingType: 'appointment',
      user: member.user._id,
      requestedDate: '2026-07-11T00:00:00.000Z',
      requestedTime: '09:00',
      status: 'pending',
      purpose: 'Pastoral appointment',
    });

    await Donation.create({
      amount: 7000,
      donationType: 'tithe',
      donor: member.user._id,
      paymentMethod: 'cash',
      status: 'completed',
      createdAt: new Date('2026-07-12T00:00:00.000Z'),
    });

    await AuditLog.create({
      actor: admin.user._id,
      actorRole: 'admin',
      action: 'event.create',
      resource: 'Event',
      resourceId: 'someid',
    });

    const expectations = [
      ['events', 'events_report.csv', 'CSV Event'],
      ['attendance', 'attendance_report.csv', 'csvmember@example.com'],
      ['bookings', 'bookings_report.csv', 'Pastoral appointment'],
      ['donations', 'donations_report.csv', '7000'],
      ['users', 'users_report.csv', 'csvmember@example.com'],
      ['processes', 'processes_report.csv', 'event.create'],
    ];

    for (const [type, filename, content] of expectations) {
      const res = await request(app)
        .get(`/api/reports/export/${type}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-disposition']).toContain(filename);
      expect(res.text).toContain(content);
    }

    const invalidRes = await request(app)
      .get('/api/reports/export/unknown')
      .set('Authorization', `Bearer ${admin.token}`);

    expect(invalidRes.statusCode).toBe(400);
  });
});
