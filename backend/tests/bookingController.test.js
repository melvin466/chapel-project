const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Booking = require('../models/Booking');

let mongoServer;

jest.setTimeout(30000);

const registerAndLogin = async ({ email, role = 'member' }) => {
  await request(app)
    .post('/api/auth/register')
    .send({
      firstName: role === 'admin' ? 'Admin' : 'Booking',
      lastName: 'Tester',
      email,
      password: 'Password123!',
      phoneNumber: '1234567890'
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

describe('Booking Controller Integration Tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  }, 30000);

  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  it('should calculate booking prices correctly based on occasion type and duration', async () => {
    const member = await registerAndLogin({ email: 'member@example.com' });

    // 1. Counselling booking: 2 hours. Rate is 10,000 per hour. Price should be 20,000.
    const resCounselling = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        bookingType: 'counselling',
        requestedDate: '2026-08-10',
        requestedTime: '10:00',
        hours: 2,
        purpose: 'Need guidance',
        numberOfPeople: 1
      });
    
    expect(resCounselling.statusCode).toBe(201);
    expect(resCounselling.body.data.booking.price).toBe(20000);

    // 2. Wedding booking: 3 hours. Rate is 200,000 per hour. Price should be 600,000.
    const resWedding = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        bookingType: 'wedding',
        requestedDate: '2026-08-11',
        requestedTime: '14:00',
        hours: 3,
        purpose: 'Wedding ceremony',
        numberOfPeople: 50
      });

    expect(resWedding.statusCode).toBe(201);
    expect(resWedding.body.data.booking.price).toBe(600000);
  });

  it('should check for overlap against approved bookings and reject conflicts', async () => {
    const admin = await registerAndLogin({ email: 'admin@example.com', role: 'admin' });
    const member1 = await registerAndLogin({ email: 'member1@example.com' });
    const member2 = await registerAndLogin({ email: 'member2@example.com' });

    // 1. Create a booking that will be approved.
    // Time: 2026-08-10 from 10:00 to 12:00 (2 hours)
    const booking1Res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${member1.token}`)
      .send({
        bookingType: 'facility',
        requestedDate: '2026-08-10',
        requestedTime: '10:00',
        hours: 2,
        purpose: 'Fellowship',
        numberOfPeople: 20
      });
    expect(booking1Res.statusCode).toBe(201);
    const booking1Id = booking1Res.body.data.booking._id;

    // Approve the booking (admin required)
    const approveRes = await request(app)
      .put(`/api/bookings/${booking1Id}/manage`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        status: 'approved',
        reviewReason: 'Slot is free. Approved.'
      });
    expect(approveRes.statusCode).toBe(200);

    // 2. Attempt to book an overlapping time (same day 11:00 to 12:00 - overlap)
    const conflictRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${member2.token}`)
      .send({
        bookingType: 'facility',
        requestedDate: '2026-08-10',
        requestedTime: '11:00',
        hours: 1,
        purpose: 'Youth group meeting',
        numberOfPeople: 15
      });
    expect(conflictRes.statusCode).toBe(400);
    expect(conflictRes.body.message).toContain('conflicts with an already approved booking');

    // 3. Attempt to book a non-overlapping time (same day 08:00 to 10:00 - no overlap)
    const nonConflictRes1 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${member2.token}`)
      .send({
        bookingType: 'facility',
        requestedDate: '2026-08-10',
        requestedTime: '08:00',
        hours: 2,
        purpose: 'Morning prayers',
        numberOfPeople: 5
      });
    expect(nonConflictRes1.statusCode).toBe(201);

    // 4. Attempt to book another non-overlapping time (same day 12:00 to 13:00 - boundary/no overlap)
    const nonConflictRes2 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${member2.token}`)
      .send({
        bookingType: 'facility',
        requestedDate: '2026-08-10',
        requestedTime: '12:00',
        hours: 1,
        purpose: 'Lunch fellowship',
        numberOfPeople: 10
      });
    expect(nonConflictRes2.statusCode).toBe(201);
  });

  it('should prevent collision when approving a pending booking', async () => {
    const admin = await registerAndLogin({ email: 'admin@example.com', role: 'admin' });
    const member1 = await registerAndLogin({ email: 'member1@example.com' });
    const member2 = await registerAndLogin({ email: 'member2@example.com' });

    // 1. Create booking 1 (pending) for 2026-08-10 10:00 - 12:00
    const b1Res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${member1.token}`)
      .send({
        bookingType: 'facility',
        requestedDate: '2026-08-10',
        requestedTime: '10:00',
        hours: 2,
        purpose: 'Meeting 1',
      });
    const b1Id = b1Res.body.data.booking._id;

    // 2. Create booking 2 (pending) for 2026-08-10 11:00 - 12:00 (overlapping)
    const b2Res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${member2.token}`)
      .send({
        bookingType: 'facility',
        requestedDate: '2026-08-10',
        requestedTime: '11:00',
        hours: 1,
        purpose: 'Meeting 2',
      });
    const b2Id = b2Res.body.data.booking._id;

    // 3. Approve booking 1
    const approveB1 = await request(app)
      .put(`/api/bookings/${b1Id}/manage`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        status: 'approved',
        reviewReason: 'Approved meeting 1'
      });
    expect(approveB1.statusCode).toBe(200);

    // 4. Try to approve booking 2 (should fail because it conflicts with approved booking 1)
    const approveB2 = await request(app)
      .put(`/api/bookings/${b2Id}/manage`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        status: 'approved',
        reviewReason: 'Approved meeting 2'
      });
    expect(approveB2.statusCode).toBe(400);
    expect(approveB2.body.message).toContain('Cannot approve this booking because it conflicts');
  });
});
