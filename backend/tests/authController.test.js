const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const Booking = require('../models/Booking');
const Cell = require('../models/Cell');
const Donation = require('../models/Donation');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');

let mongoServer;

describe('Auth Controller', () => {
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

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message');

    const user = await User.findOne({ email: 'testuser@example.com' });
    expect(user).not.toBeNull();
    expect(user.email).toBe('testuser@example.com');
  });

  it('should log in an existing user', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Login',
        lastName: 'User',
        email: 'loginuser@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'loginuser@example.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.email).toBe('loginuser@example.com');
  });

  it('should reject login with incorrect password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Bad',
        lastName: 'Password',
        email: 'badpassword@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'badpassword@example.com',
        password: 'WrongPassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should allow an admin to create an event', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Admin',
        lastName: 'Event',
        email: 'adminevent@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    await User.findOneAndUpdate({ email: 'adminevent@example.com' }, { role: 'admin' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'adminevent@example.com',
        password: 'Password123!'
      });

    const token = loginRes.body.data.token;

    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Admin Test Event',
        description: 'Event created by admin test',
        type: 'other',
        startDate: '2026-06-01T10:00:00.000Z',
        endDate: '2026-06-01T12:00:00.000Z',
        startTime: '10:00',
        endTime: '12:00',
        location: 'Church Hall',
        status: 'published'
      });

    expect(eventRes.statusCode).toBe(201);
    expect(eventRes.body).toHaveProperty('success', true);
    expect(eventRes.body.data.event.title).toBe('Admin Test Event');

    const event = await Event.findOne({ title: 'Admin Test Event' });
    expect(event).not.toBeNull();
    expect(event.description).toBe('Event created by admin test');
  });

  it('should allow an admin to create an announcement', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Admin',
        lastName: 'Announcement',
        email: 'adminannounce@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    await User.findOneAndUpdate({ email: 'adminannounce@example.com' }, { role: 'admin' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'adminannounce@example.com',
        password: 'Password123!'
      });

    const token = loginRes.body.data.token;

    const announcementRes = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Admin Test Announcement',
        content: 'Announcement created by admin test',
        status: 'published'
      });

    expect(announcementRes.statusCode).toBe(201);
    expect(announcementRes.body).toHaveProperty('success', true);
    expect(announcementRes.body.data.announcement.title).toBe('Admin Test Announcement');

    const announcement = await Announcement.findOne({ title: 'Admin Test Announcement' });
    expect(announcement).not.toBeNull();
    expect(announcement.content).toBe('Announcement created by admin test');

    const notification = await Notification.findOne({ title: 'Admin Test Announcement' });
    expect(notification).not.toBeNull();
    expect(notification.type).toBe('announcement');
    expect(notification.data.announcementId.toString()).toBe(announcement._id.toString());
  });

  it('should verify a registered user email with a valid token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Verify',
        lastName: 'User',
        email: 'verifyuser@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    const token = registerRes.body.data.verificationToken;
    expect(token).toBeTruthy();

    const redirectRes = await request(app)
      .get(`/api/auth/verify-email?token=${token}`);

    expect(redirectRes.statusCode).toBe(302);
    expect(redirectRes.headers.location).toContain(`/verify-email?token=${token}`);

    const verifyRes = await request(app)
      .post('/api/auth/verify-email')
      .send({ token });

    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body).toHaveProperty('success', true);

    const duplicateVerifyRes = await request(app)
      .post('/api/auth/verify-email')
      .send({ token });

    expect(duplicateVerifyRes.statusCode).toBe(200);
    expect(duplicateVerifyRes.body).toHaveProperty('success', true);

    const user = await User.findOne({ email: 'verifyuser@example.com' });
    expect(user.isEmailVerified).toBe(true);
    expect(user.emailVerificationToken).toBeTruthy();
  });

  it('should reset a password with a valid reset token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Reset',
        lastName: 'User',
        email: 'resetuser@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    const forgotRes = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'resetuser@example.com' });

    const token = forgotRes.body.data.resetToken;
    expect(token).toBeTruthy();

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'NewPassword123!' });

    expect(resetRes.statusCode).toBe(200);
    expect(resetRes.body).toHaveProperty('success', true);

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'resetuser@example.com', password: 'Password123!' });

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'resetuser@example.com', password: 'NewPassword123!' });

    expect(oldLogin.statusCode).toBe(401);
    expect(newLogin.statusCode).toBe(200);
  });

  it('should allow a regular user to create a chapel booking', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Booking',
        lastName: 'Member',
        email: 'bookingmember@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'bookingmember@example.com',
        password: 'Password123!'
      });

    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`)
      .send({
        bookingType: 'wedding',
        requestedDate: '2026-07-11',
        requestedTime: '10:00',
        purpose: 'Wedding ceremony booking',
        numberOfPeople: 80,
        specialRequests: 'Need chapel sound support'
      });

    expect(bookingRes.statusCode).toBe(201);
    expect(bookingRes.body).toHaveProperty('success', true);
    expect(bookingRes.body.data.booking.bookingType).toBe('wedding');
    expect(bookingRes.body.data.booking.status).toBe('pending');

    const booking = await Booking.findOne({ purpose: 'Wedding ceremony booking' });
    expect(booking).not.toBeNull();
    expect(booking.numberOfPeople).toBe(80);
  });

  it('should not allow a user to cancel another user booking', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Owner',
        lastName: 'Member',
        email: 'bookingowner@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Other',
        lastName: 'Member',
        email: 'bookingother@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bookingowner@example.com', password: 'Password123!' });

    const otherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bookingother@example.com', password: 'Password123!' });

    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${ownerLogin.body.data.token}`)
      .send({
        bookingType: 'baptism',
        requestedDate: '2026-08-02',
        requestedTime: '09:30',
        purpose: 'Baptism booking',
        numberOfPeople: 5
      });

    const cancelRes = await request(app)
      .put(`/api/bookings/${bookingRes.body.data.booking._id}/cancel`)
      .set('Authorization', `Bearer ${otherLogin.body.data.token}`);

    expect(cancelRes.statusCode).toBe(404);

    const booking = await Booking.findById(bookingRes.body.data.booking._id);
    expect(booking.status).toBe('pending');
  });

  it('should allow a chaplain to view and approve booking requests with a reason', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Booking',
        lastName: 'Requester',
        email: 'bookingrequester@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Chaplain',
        lastName: 'Manager',
        email: 'bookingchaplain@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    await User.findOneAndUpdate({ email: 'bookingchaplain@example.com' }, { role: 'chaplain' });

    const requesterLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bookingrequester@example.com', password: 'Password123!' });

    const chaplainLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bookingchaplain@example.com', password: 'Password123!' });

    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${requesterLogin.body.data.token}`)
      .send({
        bookingType: 'counselling',
        requestedDate: '2026-08-12',
        requestedTime: '14:00',
        purpose: 'Pastoral counselling',
        numberOfPeople: 1
      });

    const manageList = await request(app)
      .get('/api/bookings/manage/all')
      .set('Authorization', `Bearer ${chaplainLogin.body.data.token}`);

    expect(manageList.statusCode).toBe(200);
    expect(manageList.body.data.bookings.length).toBe(1);
    expect(manageList.body.data.bookings[0].user.email).toBe('bookingrequester@example.com');

    const updateRes = await request(app)
      .put(`/api/bookings/${bookingRes.body.data.booking._id}/manage`)
      .set('Authorization', `Bearer ${chaplainLogin.body.data.token}`)
      .send({ status: 'approved', reviewReason: 'Approved for counselling room 2.' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.booking.status).toBe('approved');
    expect(updateRes.body.data.booking.reviewReason).toBe('Approved for counselling room 2.');
    expect(updateRes.body.data.booking.reviewedBy.email).toBe('bookingchaplain@example.com');

    const requesterBookings = await request(app)
      .get('/api/bookings')
      .set('Authorization', `Bearer ${requesterLogin.body.data.token}`);

    expect(requesterBookings.body.data.bookings[0].reviewReason).toBe('Approved for counselling room 2.');

    const notification = await Notification.findOne({ type: 'booking' });
    expect(notification).not.toBeNull();
    expect(notification.title).toBe('Booking approved');
    expect(notification.message).toBe('Approved for counselling room 2.');
  });

  it('should block regular users from booking management endpoints', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Regular',
        lastName: 'Member',
        email: 'regularmanager@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'regularmanager@example.com', password: 'Password123!' });

    const res = await request(app)
      .get('/api/bookings/manage/all')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);

    expect(res.statusCode).toBe(403);
  });

  it('should let a user request a cell and an admin approve it', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Cell',
        lastName: 'Member',
        email: 'cellmember@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Cell',
        lastName: 'Admin',
        email: 'celladmin@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    const adminUser = await User.findOneAndUpdate({ email: 'celladmin@example.com' }, { role: 'admin' }, { new: true });

    const cell = await Cell.create({
      name: 'North Campus Cell',
      code: 'NORTH-1',
      zone: 'North',
      location: 'North Campus',
      meetingDay: 'Sunday',
      meetingTime: '16:00',
      meetingVenue: 'Room A',
      leader: adminUser._id,
      maxCapacity: 10,
    });

    const memberLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cellmember@example.com', password: 'Password123!' });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'celladmin@example.com', password: 'Password123!' });

    const requestRes = await request(app)
      .post(`/api/cells/${cell._id}/join`)
      .set('Authorization', `Bearer ${memberLogin.body.data.token}`)
      .send({ reason: 'I live near this cell.' });

    expect(requestRes.statusCode).toBe(201);

    const manageRes = await request(app)
      .get('/api/cells/manage/all')
      .set('Authorization', `Bearer ${adminLogin.body.data.token}`);

    expect(manageRes.body.data.cells[0].joinRequests.length).toBe(1);

    const reviewRes = await request(app)
      .put(`/api/cells/join-requests/${manageRes.body.data.cells[0].joinRequests[0]._id}`)
      .set('Authorization', `Bearer ${adminLogin.body.data.token}`)
      .send({ status: 'approved' });

    expect(reviewRes.statusCode).toBe(200);

    const member = await User.findOne({ email: 'cellmember@example.com' });
    expect(member.cellId.toString()).toBe(cell._id.toString());
  });

  it('should allow an admin to review and update donations', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Donation',
        lastName: 'Member',
        email: 'donationmember@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Finance',
        lastName: 'Admin',
        email: 'financeadmin@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    await User.findOneAndUpdate({ email: 'financeadmin@example.com' }, { role: 'admin' });

    const memberLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'donationmember@example.com', password: 'Password123!' });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'financeadmin@example.com', password: 'Password123!' });

    const donationRes = await request(app)
      .post('/api/donations')
      .set('Authorization', `Bearer ${memberLogin.body.data.token}`)
      .send({
        amount: 5000,
        donationType: 'offering',
        paymentMethod: 'mobile_money',
        provider: 'MTN',
        phoneNumber: '256700000000'
      });

    const listRes = await request(app)
      .get('/api/donations/manage/all')
      .set('Authorization', `Bearer ${adminLogin.body.data.token}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data.donations.length).toBe(1);
    expect(listRes.body.data.donations[0].donor.email).toBe('donationmember@example.com');

    const updateRes = await request(app)
      .put(`/api/donations/${donationRes.body.data.donation._id}/manage`)
      .set('Authorization', `Bearer ${adminLogin.body.data.token}`)
      .send({ status: 'completed', receiptNumber: 'RCP-TEST-001', receiptSent: true });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.data.donation.status).toBe('completed');
    expect(updateRes.body.data.donation.receiptNumber).toBe('RCP-TEST-001');

    const donation = await Donation.findById(donationRes.body.data.donation._id);
    expect(donation.receiptSent).toBe(true);
    expect(donation.completedAt).toBeTruthy();
  });

  it('should block regular users from donation management endpoints', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Giving',
        lastName: 'Member',
        email: 'givingmember@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'givingmember@example.com', password: 'Password123!' });

    const res = await request(app)
      .get('/api/donations/manage/all')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);

    expect(res.statusCode).toBe(403);
  });

  it('should record and expose audit logs for admin actions', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Audit',
        lastName: 'Admin',
        email: 'auditadmin@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    await User.findOneAndUpdate({ email: 'auditadmin@example.com' }, { role: 'admin' });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'auditadmin@example.com', password: 'Password123!' });

    const createUserRes = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`)
      .send({
        firstName: 'Audited',
        lastName: 'Member',
        email: 'auditedmember@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890',
        role: 'member'
      });

    expect(createUserRes.statusCode).toBe(201);

    const log = await AuditLog.findOne({ action: 'user.create', resource: 'User' });
    expect(log).not.toBeNull();
    expect(log.resourceId).toBe(createUserRes.body.data.user._id);

    const logsRes = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);

    expect(logsRes.statusCode).toBe(200);
    expect(logsRes.body.data.logs.some((item) => item.action === 'user.create')).toBe(true);
  });

  it('should block regular users from audit logs', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Audit',
        lastName: 'Member',
        email: 'auditmember@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'auditmember@example.com', password: 'Password123!' });

    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);

    expect(res.statusCode).toBe(403);
  });
});
