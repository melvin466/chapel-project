const mongoose = require('mongoose');

const counsellingSessionSchema = new mongoose.Schema({
  sessionType: { type: String, enum: ['individual', 'couples', 'family', 'premarital', 'grief', 'academic', 'career'], required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  counsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true },
  duration: { type: Number, default: 60 },
  status: { type: String, enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'], default: 'scheduled' },
  presentingIssue: { type: String, required: true },
  sessionNotes: [{ note: String, recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, recordedAt: Date }],
  location: { type: String, enum: ['in_person', 'virtual', 'phone'], default: 'in_person' },
  meetingLink: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CounsellingSession', counsellingSessionSchema);