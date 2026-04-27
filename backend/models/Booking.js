const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingType: { type: String, enum: ['counselling', 'wedding', 'baptism', 'facility', 'appointment'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  requestedDate: { type: Date, required: true },
  requestedTime: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  purpose: { type: String, required: true },
  numberOfPeople: { type: Number, default: 1 },
  specialRequests: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);