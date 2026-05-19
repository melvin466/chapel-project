const Cell = require('../models/Cell');
const CellJoinRequest = require('../models/CellJoinRequest');
const User = require('../models/User');
const { recordAuditLog } = require('../utils/auditLogger');
const { notifyUser } = require('../utils/notificationDispatcher');

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
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
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
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getManageCells = async (req, res) => {
  try {
    const cells = await Cell.find()
      .populate('leader', 'firstName lastName email')
      .populate('assistantLeader', 'firstName lastName email')
      .sort({ name: 1 })
      .lean();

    const cellsWithMembers = await Promise.all(cells.map(async (cell) => {
      const members = await User.find({ cellId: cell._id })
        .select('firstName lastName email role')
        .sort({ firstName: 1, lastName: 1 })
        .lean();
      const joinRequests = await CellJoinRequest.find({ cell: cell._id, status: 'pending' })
        .populate('user', 'firstName lastName email role')
        .sort({ createdAt: 1 })
        .lean();
      return { ...cell, members, joinRequests, memberCount: members.length };
    }));

    res.json({ success: true, data: { cells: cellsWithMembers } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const createCell = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.assistantLeader) delete payload.assistantLeader;
    if (!payload.code) delete payload.code;
    const cell = await Cell.create(payload);
    await recordAuditLog(req, {
      action: 'cell.create',
      resource: 'Cell',
      resourceId: cell._id,
      metadata: { name: cell.name, leader: cell.leader },
    });
    res.status(201).json({ success: true, data: { cell } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const updateCell = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.assistantLeader) delete payload.assistantLeader;
    if (!payload.code) delete payload.code;
    const cell = await Cell.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!cell) return res.status(404).json({ success: false, message: 'Cell not found' });
    await recordAuditLog(req, {
      action: 'cell.update',
      resource: 'Cell',
      resourceId: cell._id,
      metadata: { name: cell.name, changedFields: Object.keys(payload) },
    });
    res.json({ success: true, data: { cell } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const deleteCell = async (req, res) => {
  try {
    const cell = await Cell.findByIdAndDelete(req.params.id);
    if (!cell) return res.status(404).json({ success: false, message: 'Cell not found' });
    await User.updateMany({ cellId: cell._id }, { $unset: { cellId: '' } });
    await recordAuditLog(req, {
      action: 'cell.delete',
      resource: 'Cell',
      resourceId: cell._id,
      metadata: { name: cell.name },
    });
    res.json({ success: true, message: 'Cell deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const requestJoinCell = async (req, res) => {
  try {
    const cell = await Cell.findById(req.params.id);
    if (!cell) return res.status(404).json({ success: false, message: 'Cell not found' });
    if (!cell.isActive) return res.status(400).json({ success: false, message: 'This cell is not accepting requests' });
    
    const user = await User.findById(req.user.id);
    if (user.cellId) {
      return res.status(400).json({ success: false, message: 'You are already in a cell' });
    }

    const existingRequest = await CellJoinRequest.findOne({ user: user._id, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'You already have a pending cell request' });
    }

    await CellJoinRequest.create({
      cell: cell._id,
      user: user._id,
      reason: req.body.reason,
    });
    
    res.status(201).json({ success: true, message: `Request sent to join ${cell.name}` });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const refreshMemberCount = async (cellId) => {
  if (!cellId) return;
  const memberCount = await User.countDocuments({ cellId });
  await Cell.findByIdAndUpdate(cellId, { memberCount });
};

const assignMemberToCell = async (req, res) => {
  try {
    const { userId } = req.body;
    const cell = await Cell.findById(req.params.id);
    if (!cell) return res.status(404).json({ success: false, message: 'Cell not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const previousCellId = user.cellId;
    user.cellId = cell._id;
    await user.save();

    await refreshMemberCount(previousCellId);
    await refreshMemberCount(cell._id);

    await recordAuditLog(req, {
      action: 'cell.member.assign',
      resource: 'Cell',
      resourceId: cell._id,
      metadata: { cell: cell.name, userId: user._id, previousCellId },
    });

    res.json({ success: true, message: 'Member assigned to cell' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const removeMemberFromCell = async (req, res) => {
  try {
    const cell = await Cell.findById(req.params.id);
    if (!cell) return res.status(404).json({ success: false, message: 'Cell not found' });

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.cellId || user.cellId.toString() !== cell._id.toString()) {
      return res.status(400).json({ success: false, message: 'User is not assigned to this cell' });
    }

    user.cellId = undefined;
    await user.save();
    await refreshMemberCount(cell._id);

    await recordAuditLog(req, {
      action: 'cell.member.remove',
      resource: 'Cell',
      resourceId: cell._id,
      metadata: { cell: cell.name, userId: user._id },
    });

    res.json({ success: true, message: 'Member removed from cell' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const reviewJoinRequest = async (req, res) => {
  try {
    const { status, reason } = req.body;
    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid request status' });
    }

    const joinRequest = await CellJoinRequest.findById(req.params.requestId)
      .populate('cell', 'name maxCapacity')
      .populate('user', 'firstName lastName email cellId');

    if (!joinRequest) return res.status(404).json({ success: false, message: 'Join request not found' });
    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been reviewed' });
    }

    joinRequest.status = status;
    joinRequest.reason = reason;
    joinRequest.reviewedBy = req.user.id;
    joinRequest.reviewedAt = new Date();

    if (status === 'approved') {
      if (joinRequest.user.cellId) {
        return res.status(400).json({ success: false, message: 'User is already assigned to a cell' });
      }
      const memberCount = await User.countDocuments({ cellId: joinRequest.cell._id });
      if (memberCount >= joinRequest.cell.maxCapacity) {
        return res.status(400).json({ success: false, message: 'Cell is already at capacity' });
      }
      joinRequest.user.cellId = joinRequest.cell._id;
      await joinRequest.user.save();
      await refreshMemberCount(joinRequest.cell._id);
    }

    await joinRequest.save();

    await notifyUser(joinRequest.user._id, {
      type: 'system',
      title: status === 'approved' ? 'Cell request approved' : 'Cell request denied',
      message: reason || `Your request to join ${joinRequest.cell.name} was ${status}.`,
      data: { cellId: joinRequest.cell._id, requestId: joinRequest._id, status },
    });

    await recordAuditLog(req, {
      action: `cell.join_request.${status}`,
      resource: 'Cell',
      resourceId: joinRequest.cell._id,
      metadata: { userId: joinRequest.user._id, requestId: joinRequest._id },
    });

    res.json({ success: true, data: { joinRequest } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

module.exports = {
  getCells,
  getManageCells,
  getCellById,
  createCell,
  updateCell,
  deleteCell,
  requestJoinCell,
  reviewJoinRequest,
  assignMemberToCell,
  removeMemberFromCell,
};

