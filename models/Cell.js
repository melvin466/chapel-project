const mongoose = require('mongoose');

const cellSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, unique: true },
  zone: { type: String, required: true },
  location: { type: String, required: true },
  meetingDay: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  meetingTime: { type: String, required: true },
  meetingVenue: { type: String, required: true },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assistantLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  memberCount: { type: Number, default: 0 },
  maxCapacity: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true },
  description: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cell', cellSchema);