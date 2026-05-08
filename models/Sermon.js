const mongoose = require('mongoose');

const sermonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  speaker: { type: String, required: true },
  date: { type: Date, required: true },
  serviceType: { type: String, enum: ['sunday', 'wednesday', 'friday', 'conference', 'special'], default: 'sunday' },
  description: { type: String, required: true },
  bibleVerses: [String],
  content: String,
  audioUrl: String,
  videoUrl: String,
  thumbnail: String,
  duration: Number,
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  series: String,
  tags: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

sermonSchema.index({ title: 'text', speaker: 'text' });

module.exports = mongoose.model('Sermon', sermonSchema);