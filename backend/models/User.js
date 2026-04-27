const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  role: { type: String, enum: ['member', 'chaplain', 'admin', 'student_leader'], default: 'member' },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  cellId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cell' },
  profilePicture: { type: String, default: '' },
  bio: { type: String, maxlength: 500 },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);