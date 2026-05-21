require('dotenv').config();

const sendEmail = async ({ to, subject, htmlContent }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Chapel Management';

  if (process.env.NODE_ENV === 'test') {
    return { skipped: true };
  }

  if (!apiKey || !senderEmail) {
    console.warn('Email not sent: BREVO_API_KEY and BREVO_SENDER_EMAIL are not configured.');
    return { skipped: true };
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Email provider returned ${response.status}`);
  }

  return data;
};

module.exports = sendEmail;
