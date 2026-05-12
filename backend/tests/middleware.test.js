const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');

let mongoServer;

describe('Auth Middleware', () => {
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

  it('should block access without a token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message', 'Not authorized, no token');
  });

  it('should allow access with a valid token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Token',
        lastName: 'Test',
        email: 'tokenuser@example.com',
        password: 'Password123!',
        phoneNumber: '1234567890'
      });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'tokenuser@example.com',
        password: 'Password123!'
      });

    const token = loginRes.body.data?.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.email).toBe('tokenuser@example.com');
  });
});