const mongoose = require('mongoose');

const cellJoinRequestSchema = new mongoose.Schema({
  cell: { type: mongoose.Schema.Types.ObjectId, ref: 'Cell', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
  reason: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

cellJoinRequestSchema.index({ cell: 1, status: 1 });
cellJoinRequestSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('CellJoinRequest', cellJoinRequestSchema);
