require('dotenv').config();

const { registerPesapalIpn } = require('../utils/pesapalService');

const main = async () => {
  const url = process.argv[2]
    || process.env.PESAPAL_CALLBACK_URL
    || `${(process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000').replace(/\/+$/, '')}/api/donations/callback`;
  const notificationType = process.argv[3] || process.env.PESAPAL_IPN_NOTIFICATION_TYPE || 'GET';

  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(url)) {
    console.warn('Warning: Pesapal IPN URLs must be publicly reachable. Use a public HTTPS URL for real payments.');
  }

  const ipn = await registerPesapalIpn({ url, notificationType });
  console.log(`IPN URL: ${ipn.url}`);
  console.log(`IPN ID: ${ipn.ipn_id}`);
  console.log('Set PESAPAL_IPN_ID to this IPN ID in your backend environment.');
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
