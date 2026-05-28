const RELWORX_DEFAULT_BASE_URL = 'https://payments.relworx.com/api';

const stripTrailingSlash = (value) => value.replace(/\/+$/, '');

const getRelworxBaseUrl = () => {
  return stripTrailingSlash(process.env.RELWORX_API_BASE_URL || RELWORX_DEFAULT_BASE_URL);
};

const isRelworxConfigured = () => {
  if (process.env.NODE_ENV === 'test') return false;
  return Boolean(process.env.RELWORX_API_KEY && process.env.RELWORX_ACCOUNT_NO);
};

const requestRelworxPayment = async ({ amount, reference, phoneNumber, description, currency = 'UGX' }) => {
  if (!isRelworxConfigured()) {
    throw new Error('Relworx API key or account number is not configured');
  }

  const response = await fetch(`${getRelworxBaseUrl()}/mobile-money/request-payment`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.relworx.v2',
      Authorization: `Bearer ${process.env.RELWORX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account_no: process.env.RELWORX_ACCOUNT_NO,
      reference,
      msisdn: phoneNumber,
      currency,
      amount: Number(amount),
      description,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Relworx request failed with status ${response.status}`);
  }

  return data;
};

module.exports = {
  isRelworxConfigured,
  requestRelworxPayment,
};
