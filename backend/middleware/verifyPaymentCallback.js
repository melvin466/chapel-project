const crypto = require('crypto');

const verifyPaymentCallback = (req, res, next) => {
  const secret = process.env.PAYMENT_CALLBACK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        success: false,
        message: 'Payment callback verification is not configured',
      });
    }
    return next();
  }

  const signature = req.get('x-payment-signature');
  if (!signature || !req.rawBody) {
    return res.status(401).json({ success: false, message: 'Invalid payment callback signature' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(req.rawBody)
    .digest('hex');

  const provided = Buffer.from(signature, 'hex');
  const expected = Buffer.from(expectedSignature, 'hex');

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return res.status(401).json({ success: false, message: 'Invalid payment callback signature' });
  }

  next();
};

module.exports = verifyPaymentCallback;
