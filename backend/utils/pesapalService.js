const PESAPAL_BASE_URLS = {
  production: 'https://pay.pesapal.com/v3/api',
  sandbox: 'https://cybqa.pesapal.com/pesapalv3/api',
};

let cachedToken;
let cachedTokenExpiry = 0;

class PesapalRequestError extends Error {
  constructor(message, { statusCode = 502, pesapalStatus, publicMessage } = {}) {
    super(message);
    this.name = 'PesapalRequestError';
    this.statusCode = statusCode;
    this.pesapalStatus = pesapalStatus;
    this.publicMessage = publicMessage;
  }
}

const stripTrailingSlash = (value) => value.replace(/\/+$/, '');

const getPesapalBaseUrl = () => {
  if (process.env.PESAPAL_API_BASE_URL) {
    return stripTrailingSlash(process.env.PESAPAL_API_BASE_URL.trim());
  }

  const environment = process.env.PESAPAL_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
  return PESAPAL_BASE_URLS[environment];
};

const isPesapalConfigured = () => {
  return Boolean(
    process.env.PESAPAL_CONSUMER_KEY
      && process.env.PESAPAL_CONSUMER_SECRET
      && process.env.PESAPAL_IPN_ID
  );
};

const parseExpiry = (expiryDate) => {
  const timestamp = Date.parse(expiryDate);
  if (Number.isNaN(timestamp)) return Date.now() + 4 * 60 * 1000;
  return timestamp;
};

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${getPesapalBaseUrl()}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  const pesapalError = data.error && (data.error.message || data.error.code || data.error.type);
  const pesapalStatusError = data.status && String(data.status) !== '200';
  if (!response.ok || pesapalError || pesapalStatusError) {
    const message = data?.error?.message
      || data?.error?.code
      || data.message
      || `Pesapal request failed with status ${response.status}`;
    const isApiDisabled = /api\s+disabled|disabled\s+.*api/i.test(message);
    throw new PesapalRequestError(message, {
      statusCode: isApiDisabled ? 403 : (response.status >= 400 ? response.status : 502),
      pesapalStatus: data.status,
      publicMessage: isApiDisabled
        ? 'Pesapal rejected this payment because API access is disabled for the merchant account. Ask Pesapal to enable API 3.0/e-commerce payments for this live account, or switch PESAPAL_ENVIRONMENT to sandbox with sandbox credentials while testing.'
        : undefined,
    });
  }

  return data;
};

const getPesapalToken = async () => {
  if (process.env.NODE_ENV !== 'test' && cachedToken && Date.now() < cachedTokenExpiry - 30 * 1000) {
    return cachedToken;
  }

  const data = await requestJson('/Auth/RequestToken', {
    method: 'POST',
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });

  if (!data.token) {
    throw new Error(data.message || 'Pesapal did not return an access token');
  }

  if (process.env.NODE_ENV !== 'test') {
    cachedToken = data.token;
    cachedTokenExpiry = parseExpiry(data.expiryDate);
  }

  return data.token;
};

const trimToLength = (value, maxLength) => {
  return String(value || '').trim().slice(0, maxLength);
};

const buildBillingAddress = ({ user, email, phoneNumber, countryCode = 'UG' }) => ({
  email_address: email,
  phone_number: phoneNumber,
  country_code: countryCode,
  first_name: trimToLength(user?.firstName, 50),
  last_name: trimToLength(user?.lastName, 50),
});

const submitPesapalOrder = async ({
  amount,
  currency = 'UGX',
  description,
  reference,
  email,
  phoneNumber,
  callbackUrl,
  cancellationUrl,
  user,
}) => {
  if (!isPesapalConfigured()) {
    throw new Error('Pesapal credentials or IPN ID are not configured');
  }

  const token = await getPesapalToken();
  const payload = {
    id: trimToLength(reference, 50),
    currency,
    amount: Number(amount),
    description: trimToLength(description, 100),
    callback_url: callbackUrl,
    redirect_mode: 'TOP_WINDOW',
    notification_id: process.env.PESAPAL_IPN_ID,
    billing_address: buildBillingAddress({ user, email, phoneNumber }),
  };

  if (process.env.PESAPAL_BRANCH) payload.branch = trimToLength(process.env.PESAPAL_BRANCH, 100);
  if (cancellationUrl) payload.cancellation_url = cancellationUrl;

  const data = await requestJson('/Transactions/SubmitOrderRequest', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  if (!data.redirect_url || !data.order_tracking_id) {
    throw new Error(data.message || 'Pesapal did not return a payment redirect URL');
  }

  return data;
};

const getPesapalTransactionStatus = async (orderTrackingId) => {
  if (!isPesapalConfigured()) {
    throw new Error('Pesapal credentials or IPN ID are not configured');
  }

  const token = await getPesapalToken();
  const query = new URLSearchParams({ orderTrackingId }).toString();

  return requestJson(`/Transactions/GetTransactionStatus?${query}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
};

const registerPesapalIpn = async ({ url, notificationType = 'GET' }) => {
  if (!process.env.PESAPAL_CONSUMER_KEY || !process.env.PESAPAL_CONSUMER_SECRET) {
    throw new Error('Pesapal credentials are not configured');
  }

  const token = await getPesapalToken();
  const data = await requestJson('/URLSetup/RegisterIPN', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      url,
      ipn_notification_type: notificationType,
    }),
  });

  if (!data.ipn_id) {
    throw new Error(data.message || 'Pesapal did not return an IPN ID');
  }

  return data;
};

module.exports = {
  PesapalRequestError,
  getPesapalTransactionStatus,
  isPesapalConfigured,
  registerPesapalIpn,
  submitPesapalOrder,
};
