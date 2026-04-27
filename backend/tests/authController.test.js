const request = require('supertest');
const app = require('../server');

describe('Auth Controller', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should not register a user with invalid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: '',
        email: 'invalid-email',
        password: '123',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('success', false);
  });
});