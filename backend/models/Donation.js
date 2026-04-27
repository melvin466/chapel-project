const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 100 },
  currency: { type: String, default: 'UGX' },
  donationType: { type: String, enum: ['tithe', 'offering', 'pledge', 'building', 'missions', 'benevolence'], required: true },
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAnonymous: { type: Boolean, default: false },
  donorName: String,
  donorEmail: String,
  paymentMethod: { type: String, enum: ['mobile_money', 'credit_card', 'bank_transfer', 'cash'], required: true },
  transactionId: String,
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  message: String,
  receiptNumber: String,
  receiptSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

module.exports = mongoose.model('Donation', donationSchema);