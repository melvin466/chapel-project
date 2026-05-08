const Cell = require('../models/Cell');
const User = require('../models/User');

const getCells = async (req, res) => {
  try {
    const { page = 1, limit = 10, zone } = req.query;
    const filter = { isActive: true };
    if (zone) filter.zone = zone;

    const cells = await Cell.find(filter)
      .populate('leader', 'firstName lastName email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Cell.countDocuments(filter);

    res.json({
      success: true,
      data: { cells, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getCellById = async (req, res) => {
  try {
    const cell = await Cell.findById(req.params.id)
      .populate('leader', 'firstName lastName email')
      .populate('assistantLeader', 'firstName lastName');
    if (!cell) return res.status(404).json({ success: false, message: 'Cell not found' });
    res.json({ success: true, data: { cell } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCell = async (req, res) => {
  try {
    const cell = await Cell.create(req.body);
    res.status(201).json({ success: true, data: { cell } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const joinCell = async (req, res) => {
  try {
    const cell = await Cell.findById(req.params.id);
    if (!cell) return res.status(404).json({ success: false, message: 'Cell not found' });
    
    const user = await User.findById(req.user.id);
    if (user.cellId) {
      return res.status(400).json({ success: false, message: 'You are already in a cell' });
    }
    
    user.cellId = cell._id;
    cell.memberCount += 1;
    await user.save();
    await cell.save();
    
    res.json({ success: true, message: `Joined ${cell.name} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCells, getCellById, createCell, joinCell };

