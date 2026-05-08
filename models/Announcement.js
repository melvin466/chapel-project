const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  summary: { type: String, maxlength: 300 },
  type: { type: String, enum: ['general', 'urgent', 'event', 'ministry', 'prayer', 'administrative', 'pastoral'], default: 'general' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  targetAudience: { type: String, enum: ['everyone', 'students', 'staff', 'cell_members', 'ministry_members', 'leaders'], default: 'everyone' },
  featuredImage: { type: String, default: '' },
  isFeatured: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishDate: { type: Date, default: Date.now },
  expiryDate: Date,
  views: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

announcementSchema.index({ status: 1, publishDate: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);