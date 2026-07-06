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
  hours: { type: Number, default: 1, min: 1 },
  price: { type: Number, default: 0 },
  startDateTime: Date,
  endDateTime: Date,
  specialRequests: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewReason: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

bookingSchema.pre('save', function (next) {
  if (this.isModified('requestedDate') || this.isModified('requestedTime') || this.isModified('hours')) {
    try {
      const datePart = new Date(this.requestedDate).toISOString().split('T')[0];
      this.startDateTime = new Date(`${datePart}T${this.requestedTime}:00`);
      this.endDateTime = new Date(this.startDateTime.getTime() + (this.hours || 1) * 60 * 60 * 1000);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ user: 1, status: 1, requestedDate: 1 });
bookingSchema.index({ assignedTo: 1, status: 1, requestedDate: 1 });
bookingSchema.index({ startDateTime: 1, endDateTime: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
