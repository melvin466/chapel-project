const Donation = require('../models/Donation');
const { recordAuditLog } = require('../utils/auditLogger');
const { getErrorMessage } = require('../utils/errorResponse');
const {
  getPesapalTransactionStatus,
  isPesapalConfigured,
  submitPesapalOrder,
} = require('../utils/pesapalService');

const donationOptions = [
  { id: 'tithe', name: 'Tithe' },
  { id: 'offering', name: 'Offering' },
  { id: 'pledge', name: 'Pledge' },
  { id: 'building', name: 'Building Fund' },
  { id: 'missions', name: 'Missions' },
  { id: 'benevolence', name: 'Benevolence' },
];

const getDonations = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const filter = { donor: req.user.id };
    if (type) filter.donationType = type;

    const donations = await Donation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Donation.countDocuments(filter);

    res.json({
      success: true,
      data: {
        donations,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

const getDonationOptions = (req, res) => {
  res.json({ success: true, data: { options: donationOptions } });
};

const getManageDonations = async (req, res) => {
  try {
    const { page = 1, limit = 100, status, type, paymentMethod } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.donationType = type;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const donations = await Donation.find(filter)
      .populate('donor', 'firstName lastName email phoneNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Donation.countDocuments(filter);

    res.json({
      success: true,
      data: {
        donations,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

const normalizeProvider = (provider) => {
  return String(provider).toLowerCase() === 'airtel' ? 'Airtel' : 'MTN';
};

const normalizeUgandaMobileNumber = (phoneNumber) => {
  const digits = String(phoneNumber || '').replace(/\D/g, '');

  if (digits.startsWith('256') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return `256${digits.slice(1)}`;
  if (digits.startsWith('7') && digits.length === 9) return `256${digits}`;

  return null;
};

const getDonationCallbackUrl = () => {
  const backendBaseUrl = process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
  return process.env.PESAPAL_CALLBACK_URL || `${backendBaseUrl.replace(/\/+$/, '')}/api/donations/callback`;
};

const getDonationFrontendRedirectUrl = (transactionId) => {
  const baseUrl = process.env.PESAPAL_CANCELLATION_URL
    ? process.env.PESAPAL_CANCELLATION_URL.split('?')[0]
    : (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL.replace(/\/+$/, '')}/donations` : 'http://localhost:5173/donations');

  return `${baseUrl}?reference=${transactionId}`;
};

const getDonationCancellationUrl = () => {
  const frontendBaseUrl = process.env.PESAPAL_CANCELLATION_URL
    || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL.replace(/\/+$/, '')}/give` : undefined);

  return frontendBaseUrl;
};

const createDonation = async (req, res) => {
  try {
    const { amount, phoneNumber, paymentMethod, provider = 'MTN' } = req.body;
    const normalizedProvider = normalizeProvider(provider);
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount < 500) {
      return res.status(400).json({ success: false, message: 'Donation amount must be at least UGX 500' });
    }

    if (paymentMethod !== 'mobile_money') {
      return res.status(400).json({ success: false, message: 'Only mobile money donations are accepted.' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required for mobile money' });
    }

    const normalizedPhoneNumber = normalizeUgandaMobileNumber(phoneNumber);
    if (!normalizedPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid Uganda mobile money number, for example 256700000000.',
      });
    }

    const transactionId = `donation-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const donationPayload = {
      ...req.body,
      amount: numericAmount,
      ...(req.user ? { donor: req.user.id } : {}),
      provider: normalizedProvider,
      phoneNumber: normalizedPhoneNumber,
      status: 'pending',
      transactionId,
      currency: 'UGX',
    };

    if (!isPesapalConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Pesapal payments are not configured. Set PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, and PESAPAL_IPN_ID.',
      });
    }

    const userEmail = req.user?.email || `donor+${transactionId}@chapel.local`;
    const pesapalOrder = await submitPesapalOrder({
      amount: numericAmount,
      description: `Donation - ${req.body.donationType || 'General'}`,
      reference: transactionId,
      email: userEmail,
      phoneNumber: normalizedPhoneNumber,
      callbackUrl: getDonationFrontendRedirectUrl(transactionId),
      cancellationUrl: getDonationCancellationUrl(),
      user: req.user,
    });

    const donation = await Donation.create({
      ...donationPayload,
      transactionId: pesapalOrder.merchant_reference || transactionId,
      pesapalOrderTrackingId: pesapalOrder.order_tracking_id,
      paymentUrl: pesapalOrder.redirect_url,
    });

    return res.status(201).json({
      success: true,
      message: 'Pesapal payment created. Redirecting to checkout.',
      data: { donation, paymentUrl: donation.paymentUrl },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

const getDonationStats = async (req, res) => {
  try {
    const total = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const byType = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$donationType', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: { totalAmount: total[0]?.total || 0, totalCount: total[0]?.count || 0, byType },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

const getCallbackField = (req, names) => {
  const sources = [req.body || {}, req.query || {}];
  for (const source of sources) {
    for (const name of names) {
      if (source[name] !== undefined) return source[name];
    }
  }
  return undefined;
};

const mapPesapalStatus = (statusResponse) => {
  const statusCode = Number(statusResponse.status_code);
  const description = String(statusResponse.payment_status_description || '').toLowerCase();

  if (statusCode === 1 || description === 'completed') return 'completed';
  if (statusCode === 3 || description === 'reversed') return 'refunded';
  if (statusCode === 0 || description === 'invalid' || statusCode === 2 || description === 'failed') return 'failed';
  return 'pending';
};

const sendPesapalIpnResponse = (req, res, status = 200) => {
  const orderTrackingId = getCallbackField(req, ['OrderTrackingId', 'orderTrackingId', 'order_tracking_id']);
  const orderMerchantReference = getCallbackField(req, [
    'OrderMerchantReference',
    'orderMerchantReference',
    'order_merchant_reference',
  ]);
  const orderNotificationType = getCallbackField(req, [
    'OrderNotificationType',
    'orderNotificationType',
    'order_notification_type',
  ]) || 'IPNCHANGE';

  return res.status(status === 200 ? 200 : 500).json({
    orderNotificationType,
    orderTrackingId,
    orderMerchantReference,
    status,
  });
};

const handlePaymentCallback = async (req, res) => {
  try {
    const orderTrackingId = getCallbackField(req, ['OrderTrackingId', 'orderTrackingId', 'order_tracking_id']);
    const merchantReference = getCallbackField(req, [
      'OrderMerchantReference',
      'orderMerchantReference',
      'order_merchant_reference',
      'merchant_reference',
    ]);

    if (orderTrackingId) {
      const statusResponse = await getPesapalTransactionStatus(orderTrackingId);
      const reference = statusResponse.merchant_reference || merchantReference;

      const donation = await Donation.findOne({
        $or: [
          { pesapalOrderTrackingId: orderTrackingId },
          ...(reference ? [{ transactionId: reference }] : []),
        ],
      });

      if (!donation) {
        return sendPesapalIpnResponse(req, res, 500);
      }

      donation.pesapalOrderTrackingId = orderTrackingId;
      donation.status = mapPesapalStatus(statusResponse);
      donation.message = statusResponse.description || statusResponse.message || donation.message;
      if (donation.status === 'completed') {
        donation.completedAt = new Date();
      }
      if (donation.status !== 'completed') {
        donation.completedAt = null;
      }

      await donation.save();
      return sendPesapalIpnResponse(req, res, 200);
    }

    if (process.env.NODE_ENV !== 'production') {
      const transactionId = getCallbackField(req, ['transactionId']);
      const status = String(getCallbackField(req, ['status']) || '').toUpperCase();

      if (!transactionId || !['SUCCESS', 'FAILED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid payment callback payload' });
      }

      const donation = await Donation.findOne({ transactionId });
      if (!donation) {
        return res.status(404).json({ success: false, message: 'Donation not found' });
      }

      donation.status = status === 'SUCCESS' ? 'completed' : 'failed';
      donation.completedAt = status === 'SUCCESS' ? new Date() : null;
      await donation.save();

      return res.json({ success: true, message: 'Payment status updated' });
    }

    return res.status(400).json({ success: false, message: 'Invalid Pesapal callback payload' });
  } catch (error) {
    if (getCallbackField(req, ['OrderTrackingId', 'orderTrackingId', 'order_tracking_id'])) {
      return sendPesapalIpnResponse(req, res, 500);
    }

    return res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

const updateManagedDonation = async (req, res) => {
  try {
    const allowedStatuses = ['pending', 'completed', 'failed', 'refunded'];
    const updateData = {};

    if (req.body.status !== undefined) {
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ success: false, message: 'Invalid donation status' });
      }
      updateData.status = req.body.status;
      if (req.body.status === 'completed') {
        updateData.completedAt = new Date();
      }
      if (req.body.status !== 'completed') {
        updateData.completedAt = null;
      }
    }

    if (req.body.receiptNumber !== undefined) updateData.receiptNumber = req.body.receiptNumber;
    if (req.body.receiptSent !== undefined) updateData.receiptSent = Boolean(req.body.receiptSent);
    if (req.body.transactionId !== undefined) updateData.transactionId = req.body.transactionId;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No donation updates provided' });
    }

    const donation = await Donation.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('donor', 'firstName lastName email phoneNumber');

    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    await recordAuditLog(req, {
      action: 'donation.manage_update',
      resource: 'Donation',
      resourceId: donation._id,
      metadata: {
        status: donation.status,
        receiptNumber: donation.receiptNumber,
        receiptSent: donation.receiptSent,
        transactionId: donation.transactionId,
      },
    });

    res.json({ success: true, data: { donation } });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

const getDonationStatusPublic = async (req, res) => {
  try {
    const { transactionId } = req.params;
    if (!transactionId) {
      return res.status(400).json({ success: false, message: 'Transaction ID is required' });
    }

    const donation = await Donation.findOne({
      $or: [
        { transactionId },
        { pesapalOrderTrackingId: transactionId },
      ],
    });
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    if (donation.status === 'pending' && donation.pesapalOrderTrackingId && isPesapalConfigured()) {
      const statusResponse = await getPesapalTransactionStatus(donation.pesapalOrderTrackingId);
      donation.status = mapPesapalStatus(statusResponse);
      donation.message = statusResponse.description || statusResponse.message || donation.message;
      if (donation.status === 'completed') {
        donation.completedAt = new Date();
      }
      if (donation.status !== 'completed') {
        donation.completedAt = null;
      }
      await donation.save();
    }

    res.json({
      success: true,
      data: {
        status: donation.status,
        amount: donation.amount,
        donationType: donation.donationType,
        isAnonymous: donation.isAnonymous,
        completedAt: donation.completedAt,
        message: donation.message
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

module.exports = {
  getDonations,
  getManageDonations,
  getDonationOptions,
  createDonation,
  getDonationStats,
  updateManagedDonation,
  handlePaymentCallback,
  getDonationStatusPublic,
};
