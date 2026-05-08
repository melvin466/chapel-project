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
  status: { type: String, enum: ['draft', 'published', 'cancelled', 'completed'], default: 'draft' },
  visibility: { type: String, enum: ['public', 'members_only', 'private'], default: 'public' },
  isFeatured: { type: Boolean, default: false },
  speakers: [{ name: String, title: String, photo: String }],
  organizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

eventSchema.index({ startDate: 1, status: 1 });
eventSchema.index({ type: 1, startDate: -1 });

module.exports = mongoose.model('Event', eventSchema);