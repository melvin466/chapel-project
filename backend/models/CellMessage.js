const mongoose = require('mongoose');

const cellMessageSchema = new mongoose.Schema({
  cell: { type: mongoose.Schema.Types.ObjectId, ref: 'Cell', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

cellMessageSchema.index({ cell: 1, createdAt: -1 });
cellMessageSchema.index({ sender: 1 });

module.exports = mongoose.model('CellMessage', cellMessageSchema);
