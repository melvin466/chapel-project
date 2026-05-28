const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 500 },
  currency: { type: String, default: 'UGX' },
  donationType: { type: String, enum: ['tithe', 'offering', 'pledge', 'building', 'missions', 'benevolence'], required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAnonymous: { type: Boolean, default: false },
  donorName: String,
  donorEmail: String,
  phoneNumber: String,
  provider: { type: String, enum: ['MTN', 'Airtel'] },
  paymentMethod: { type: String, enum: ['mobile_money', 'credit_card', 'bank_transfer', 'cash'], required: true },
  transactionId: String,
  pesapalOrderTrackingId: String,
  relworxInternalReference: String,
  providerTransactionId: String,
  paymentUrl: String,
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  message: String,
  receiptNumber: String,
  receiptSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ status: 1, donationType: 1, createdAt: -1 });
donationSchema.index({ transactionId: 1 }, { sparse: true });
donationSchema.index({ pesapalOrderTrackingId: 1 }, { sparse: true });
donationSchema.index({ receiptNumber: 1 }, { sparse: true });

module.exports = mongoose.model('Donation', donationSchema);
