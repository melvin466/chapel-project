const mongoose = require('mongoose');

const prayerRequestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['personal', 'family', 'health', 'academic', 'financial', 'spiritual', 'other'], default: 'personal' },
  urgency: { type: String, enum: ['normal', 'urgent', 'critical'], default: 'normal' },
  isAnonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'answered', 'closed'], default: 'active' },
  prayerCount: { type: Number, default: 0 },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prayedBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, prayedAt: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now },
  answeredAt: Date
});

module.exports = mongoose.model('PrayerRequest', prayerRequestSchema);