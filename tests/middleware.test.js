const request = require('supertest');
const app = require('../server');

describe('Auth Middleware', () => {
  it('should block access without a token', async () => {
    const res = await request(app).get('/api/protected-route');

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message', 'Not authorized, no token');
  });

  it('should allow access with a valid token', async () => {
    const token = 'your_valid_jwt_token'; // Replace with a valid token for testing

    const res = await request(app)
      .get('/api/protected-route')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
  });
});