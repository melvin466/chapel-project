const Donation = require('../models/Donation');
const { recordAuditLog } = require('../utils/auditLogger');

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
      data: { donations, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
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
      data: { donations, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const initiateMobileMoneyPayment = async (amount, phoneNumber, provider) => {
  const apiUrl = provider === 'MTN' ? process.env.MTN_API_URL : process.env.AIRTEL_API_URL;
  const apiKey = provider === 'MTN' ? process.env.MTN_API_KEY : process.env.AIRTEL_API_KEY;

  if (!apiUrl || !apiKey) {
    return {
      transactionId: `${provider.toLowerCase()}-${Date.now()}`,
      provider,
      sandbox: true,
    };
  }

  const payload = {
    amount,
    phoneNumber,
    currency: 'UGX',
    provider,
    callbackUrl: `${process.env.BASE_URL}/api/donations/callback`,
  };

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Payment provider returned ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Mobile Money Payment Error:', error.message);
    throw new Error('Failed to initiate mobile money payment');
  }
};

const createDonation = async (req, res) => {
  try {
    const { amount, phoneNumber, paymentMethod, provider = 'MTN' } = req.body;
    const normalizedProvider = provider === 'Airtel' ? 'Airtel' : 'MTN';

    if (!amount || Number(amount) < 100) {
      return res.status(400).json({ success: false, message: 'Donation amount must be at least UGX 100' });
    }

    if (paymentMethod === 'mobile_money') {
      if (!phoneNumber) {
        return res.status(400).json({ success: false, message: 'Phone number is required for mobile money' });
      }

      const paymentResponse = await initiateMobileMoneyPayment(amount, phoneNumber, normalizedProvider);

      const donation = await Donation.create({
        ...req.body,
        donor: req.user.id,
        provider: normalizedProvider,
        status: 'pending',
        transactionId: paymentResponse.transactionId,
      });

      return res.status(201).json({
        success: true,
        message: 'Payment initiated. Awaiting confirmation.',
        data: { donation },
      });
    }

    // Handle other payment methods
    const donation = await Donation.create({
      ...req.body,
      donor: req.user.id,
      status: 'completed',
      completedAt: new Date(),
    });

    res.status(201).json({ success: true, data: { donation } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getDonationStats = async (req, res) => {
  try {
    const total = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    
    const byType = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$donationType', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: { totalAmount: total[0]?.total || 0, totalCount: total[0]?.count || 0, byType }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const handlePaymentCallback = async (req, res) => {
  try {
    const { transactionId, status } = req.body;
    const normalizedStatus = String(status || '').toUpperCase();

    if (!transactionId || !['SUCCESS', 'FAILED'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment callback payload' });
    }

    const donation = await Donation.findOne({ transactionId });
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    donation.status = normalizedStatus === 'SUCCESS' ? 'completed' : 'failed';
    if (normalizedStatus === 'SUCCESS') {
      donation.completedAt = new Date();
    }
    await donation.save();

    res.json({ success: true, message: 'Payment status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
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
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
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
};
