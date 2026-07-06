const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['worship_service', 'fellowship', 'conference', 'retreat', 'prayer_meeting', 'bible_study', 'wedding', 'baptism', 'seminar', 'workshop', 'crusade', 'other'],
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  location: { type: String, required: true },
  venue: { name: String, address: String },
  capacity: { type: Number, default: 0 },
  registeredCount: { type: Number, default: 0 },
  registrationRequired: { type: Boolean, default: false },
  registrationDeadline: Date,
  featuredImage: { type: String, default: '' },
   eventVideo: {
    type: String, 
    default: ''
  },
  status: { type: String, enum: ['draft', 'published', 'cancelled', 'completed'], default: 'draft' },
  visibility: { type: String, enum: ['public', 'members_only', 'private'], default: 'public' },
  isFeatured: { type: Boolean, default: false },
  expiryDate: Date,
  speakers: [{ name: String, title: String, photo: String }],
  organizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  checkedInAttendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  requiresChapel: { type: Boolean, default: false },
  startDateTime: Date,
  endDateTime: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

eventSchema.pre('save', function (next) {
  if (this.isModified('startDate') || this.isModified('startTime') || this.isModified('endDate') || this.isModified('endTime')) {
    try {
      const startDatePart = new Date(this.startDate).toISOString().split('T')[0];
      this.startDateTime = new Date(`${startDatePart}T${this.startTime}:00`);

      const endDatePart = new Date(this.endDate).toISOString().split('T')[0];
      this.endDateTime = new Date(`${endDatePart}T${this.endTime}:00`);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

eventSchema.index({ startDate: 1, status: 1 });
eventSchema.index({ type: 1, startDate: -1 });
eventSchema.index({ attendees: 1, status: 1, startDate: 1 });
eventSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('Event', eventSchema);
