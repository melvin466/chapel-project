const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Event = require('../models/Event');
const Feedback = require('../models/Feedback');

let mongoServer;

const registerAndLogin = async ({ email, role = 'member' }) => {
  await request(app)
    .post('/api/auth/register')
    .send({
      firstName: role === 'admin' ? 'Admin' : 'Event',
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

const makeEvent = async (createdBy, overrides = {}) => Event.create({
  title: 'Focused Event',
  description: 'A focused test event',
  type: 'other',
  startDate: '2026-06-10T10:00:00.000Z',
  endDate: '2026-06-10T12:00:00.000Z',
  startTime: '10:00',
  endTime: '12:00',
  location: 'Main Hall',
  status: 'published',
  registrationRequired: true,
  capacity: 10,
  createdBy,
  ...overrides
});

describe('Event endpoints', () => {
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

  it('enforces event registration requirements and capacity', async () => {
    const admin = await registerAndLogin({ email: 'eventadmin@example.com', role: 'admin' });
    const member = await registerAndLogin({ email: 'eventmember@example.com' });

    const draftEvent = await makeEvent(admin.user._id, { status: 'draft' });
    const noRegistrationEvent = await makeEvent(admin.user._id, { registrationRequired: false });
    const fullEvent = await makeEvent(admin.user._id, { capacity: 1, attendees: [admin.user._id], registeredCount: 1 });
    const expiredEvent = await makeEvent(admin.user._id, { registrationDeadline: '2020-01-01T00:00:00.000Z' });
    const openEvent = await makeEvent(admin.user._id, { title: 'Open Registration', capacity: 1 });

    const draftRes = await request(app)
      .post(`/api/events/${draftEvent._id}/register`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(draftRes.statusCode).toBe(400);
    expect(draftRes.body.message).toMatch(/published/);

    const noRegistrationRes = await request(app)
      .post(`/api/events/${noRegistrationEvent._id}/register`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(noRegistrationRes.statusCode).toBe(400);
    expect(noRegistrationRes.body.message).toMatch(/not required/);

    const fullRes = await request(app)
      .post(`/api/events/${fullEvent._id}/register`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(fullRes.statusCode).toBe(400);
    expect(fullRes.body.message).toMatch(/full capacity/);

    const expiredRes = await request(app)
      .post(`/api/events/${expiredEvent._id}/register`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(expiredRes.statusCode).toBe(400);
    expect(expiredRes.body.message).toMatch(/deadline/);

    const successRes = await request(app)
      .post(`/api/events/${openEvent._id}/register`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(successRes.statusCode).toBe(200);

    const duplicateRes = await request(app)
      .post(`/api/events/${openEvent._id}/register`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(duplicateRes.statusCode).toBe(400);
    expect(duplicateRes.body.message).toMatch(/Already registered/);
  });

  it('cancels registration and removes check-in state', async () => {
    const admin = await registerAndLogin({ email: 'canceladmin@example.com', role: 'admin' });
    const member = await registerAndLogin({ email: 'cancelmember@example.com' });
    const event = await makeEvent(admin.user._id, {
      attendees: [member.user._id],
      checkedInAttendees: [member.user._id],
      registeredCount: 1
    });

    const res = await request(app)
      .delete(`/api/events/${event._id}/register`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(res.statusCode).toBe(200);
    const updated = await Event.findById(event._id);
    expect(updated.attendees).toHaveLength(0);
    expect(updated.checkedInAttendees).toHaveLength(0);
    expect(updated.registeredCount).toBe(0);
  });

  it('lists attendees and checks them in once', async () => {
    const admin = await registerAndLogin({ email: 'checkinadmin@example.com', role: 'admin' });
    const member = await registerAndLogin({ email: 'checkinmember@example.com' });
    const event = await makeEvent(admin.user._id, {
      attendees: [member.user._id],
      registeredCount: 1
    });

    const attendeesRes = await request(app)
      .get(`/api/events/${event._id}/attendees`)
      .set('Authorization', `Bearer ${admin.token}`);

    expect(attendeesRes.statusCode).toBe(200);
    expect(attendeesRes.body.data.attendees).toHaveLength(1);
    expect(attendeesRes.body.data.event.checkedInAttendees).toEqual([]);

    const checkInRes = await request(app)
      .post(`/api/events/${event._id}/checkin`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ attendeeId: member.user._id });

    expect(checkInRes.statusCode).toBe(200);

    const duplicateRes = await request(app)
      .post(`/api/events/${event._id}/checkin`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ attendeeId: member.user._id });

    expect(duplicateRes.statusCode).toBe(400);
    expect(duplicateRes.body.message).toMatch(/already checked in/);
  });

  it('returns calendar, stats, CSV export, and accepts event feedback', async () => {
    const admin = await registerAndLogin({ email: 'reportadmin@example.com', role: 'admin' });
    const member = await registerAndLogin({ email: 'feedbackmember@example.com' });
    const juneEvent = await makeEvent(admin.user._id, {
      title: 'June Event',
      startDate: '2026-06-10T10:00:00.000Z',
      endDate: '2026-06-10T12:00:00.000Z',
      registeredCount: 2
    });
    await makeEvent(admin.user._id, {
      title: 'July Event',
      startDate: '2026-07-12T10:00:00.000Z',
      endDate: '2026-07-12T12:00:00.000Z',
      status: 'draft'
    });

    const calendarRes = await request(app)
      .get('/api/events/calendar?year=2026&status=published');
    expect(calendarRes.statusCode).toBe(200);
    expect(calendarRes.body.data.months).toHaveLength(1);
    expect(calendarRes.body.data.months[0].monthName).toBe('June');

    const statsRes = await request(app)
      .get('/api/events/stats/summary')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(statsRes.statusCode).toBe(200);
    expect(statsRes.body.data.totals.totalEvents).toBe(2);
    expect(statsRes.body.data.totals.publishedEvents).toBe(1);

    const exportRes = await request(app)
      .get('/api/events/export/all')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(exportRes.statusCode).toBe(200);
    expect(exportRes.headers['content-disposition']).toContain('events_export.csv');
    expect(exportRes.text).toContain('June Event');

    const feedbackRes = await request(app)
      .post(`/api/events/${juneEvent._id}/feedback`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        subject: 'Great service',
        message: 'The event was well organized.',
        rating: 5
      });

    expect(feedbackRes.statusCode).toBe(201);
    const feedback = await Feedback.findOne({ subject: 'Great service' });
    expect(feedback).not.toBeNull();
    expect(feedback.type).toBe('event');
  });
});
