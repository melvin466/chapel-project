const {
  RelworxRequestError,
  requestRelworxPayment,
} = require('../utils/relworxService');

describe('Relworx service', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      RELWORX_API_KEY: 'test-api-key',
      RELWORX_ACCOUNT_NO: 'RELTEST123',
    };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('throws a RelworxRequestError with provider details when Relworx rejects a request', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, message: 'Invalid API key' }),
    });

    await expect(requestRelworxPayment({
      amount: 500,
      reference: 'donation-test',
      phoneNumber: '+256700000000',
      description: 'Donation - Offering',
    })).rejects.toMatchObject({
      name: 'RelworxRequestError',
      message: 'Invalid API key',
      statusCode: 401,
      responseBody: { success: false, message: 'Invalid API key' },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://payments.relworx.com/api/mobile-money/request-payment',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-api-key',
        }),
      })
    );
  });

  it('throws a service-unavailable RelworxRequestError when credentials are missing', async () => {
    delete process.env.RELWORX_API_KEY;

    await expect(requestRelworxPayment({
      amount: 500,
      reference: 'donation-test',
      phoneNumber: '+256700000000',
      description: 'Donation - Offering',
    })).rejects.toMatchObject({
      name: 'RelworxRequestError',
      message: 'Relworx API key or account number is not configured',
      statusCode: 503,
    });
  });
});
