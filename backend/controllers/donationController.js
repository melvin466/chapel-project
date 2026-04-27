const Donation = require('../models/Donation');
const axios = require('axios');

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
    res.status(500).json({ success: false, message: error.message });
  }
};

const initiateMobileMoneyPayment = async (amount, phoneNumber, provider) => {
  const apiUrl = provider === 'MTN' ? process.env.MTN_API_URL : process.env.AIRTEL_API_URL;
  const apiKey = provider === 'MTN' ? process.env.MTN_API_KEY : process.env.AIRTEL_API_KEY;

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
    const response = await axios.post(`${apiUrl}/payments`, payload, { headers });
    return response.data;
  } catch (error) {
    console.error('Mobile Money Payment Error:', error.response?.data || error.message);
    throw new Error('Failed to initiate mobile money payment');
  }
};

const createDonation = async (req, res) => {
  try {
    const { amount, phoneNumber, paymentMethod } = req.body;

    if (paymentMethod === 'mobile_money') {
      const provider = req.body.provider || 'MTN'; // Default to MTN
      const paymentResponse = await initiateMobileMoneyPayment(amount, phoneNumber, provider);

      const donation = await Donation.create({
        ...req.body,
        donor: req.user.id,
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
    res.status(500).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

const handlePaymentCallback = async (req, res) => {
  try {
    const { transactionId, status } = req.body;

    const donation = await Donation.findOne({ transactionId });
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found' });
    }

    donation.status = status === 'SUCCESS' ? 'completed' : 'failed';
    if (status === 'SUCCESS') {
      donation.completedAt = new Date();
    }
    await donation.save();

    res.json({ success: true, message: 'Payment status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDonations, createDonation, getDonationStats, handlePaymentCallback };