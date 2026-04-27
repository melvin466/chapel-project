const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const client = SibApiV3Sdk.ApiClient.instance;
const apiKey = client.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendEmail = async ({ to, subject, htmlContent }) => {
  try {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const sender = {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME,
    };

    const receivers = [{ email: to }];

    const emailData = {
      sender,
      to: receivers,
      subject,
      htmlContent,
    };

    const response = await apiInstance.sendTransacEmail(emailData);
    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail;