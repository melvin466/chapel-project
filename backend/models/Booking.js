const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingType: { type: String, enum: ['counselling', 'wedding', 'baptism', 'facility', 'appointment'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  requestedDate: { type: Date, required: true },
  requestedTime: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'denied', 'cancelled', 'completed'], default: 'pending' },
  purpose: { type: String, required: true },
  numberOfPeople: { type: Number, default: 1 },
  specialRequests: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewReason: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ user: 1, status: 1, requestedDate: 1 });
bookingSchema.index({ assignedTo: 1, status: 1, requestedDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
