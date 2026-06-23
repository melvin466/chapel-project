const Cell = require('../models/Cell');
const CellJoinRequest = require('../models/CellJoinRequest');
const CellMessage = require('../models/CellMessage');
const User = require('../models/User');
const { hasAdminPower } = require('../middleware/auth');
const { recordAuditLog } = require('../utils/auditLogger');
const { notifyUser, notifyAudience } = require('../utils/notificationDispatcher');

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
    let viewer = null;
    let pendingRequest = null;

    if (req.user?._id) {
      pendingRequest = await CellJoinRequest.findOne({ user: req.user._id, status: 'pending' })
        .select('cell status')
        .lean();

      viewer = {
        cellId: req.user.cellId || null,
        pendingCellId: pendingRequest?.cell || null,
      };
    }

    const cellsWithViewerStatus = cells.map((cell) => {
      const cellObject = cell.toObject();
      const isCurrentCell = viewer?.cellId?.toString() === cell._id.toString();
      const isPending = viewer?.pendingCellId?.toString() === cell._id.toString();

      return {
        ...cellObject,
        viewerStatus: isCurrentCell ? 'member' : isPending ? 'pending' : 'none',
      };
    });

    res.json({
      success: true,
      data: {
        cells: cellsWithViewerStatus,
        viewer,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
      }
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

const getCellDetail = async (req, res) => {
  try {
    const cell = await Cell.findById(req.params.id)
      .populate('leader', 'firstName lastName email phoneNumber')
      .populate('assistantLeader', 'firstName lastName email phoneNumber');

    if (!cell) {
      return res.status(404).json({ success: false, message: 'Cell not found' });
    }

    const isMember = req.user ? await User.findOne({ _id: req.user._id, cellId: cell._id }) : null;

    if (!isMember && req.user) {
      return res.status(403).json({ success: false, message: 'You must be a member of this cell to view details' });
    }

    const members = await User.find({ cellId: cell._id })
      .select('firstName lastName email phoneNumber _id')
      .sort({ firstName: 1, lastName: 1 })
      .lean();

    const messages = await CellMessage.find({ cell: cell._id })
      .populate('sender', 'firstName lastName _id')
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    res.json({
      success: true,
      data: {
        cell,
        members,
        messages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getCellMembers = async (req, res) => {
  try {
    const cell = await Cell.findById(req.params.id);
    if (!cell) {
      return res.status(404).json({ success: false, message: 'Cell not found' });
    }

    const isMember = req.user ? await User.findOne({ _id: req.user._id, cellId: cell._id }) : null;
    if (!isMember && req.user) {
      return res.status(403).json({ success: false, message: 'You must be a member of this cell to view members' });
    }

    const members = await User.find({ cellId: cell._id })
      .select('firstName lastName email phoneNumber _id')
      .sort({ firstName: 1, lastName: 1 })
      .lean();

    res.json({ success: true, data: { members } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const sendCellMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const cell = await Cell.findById(req.params.id);
    if (!cell) {
      return res.status(404).json({ success: false, message: 'Cell not found' });
    }

    const isMember = await User.findOne({ _id: req.user._id, cellId: cell._id });
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'You must be a member of this cell to send messages' });
    }

    const message = await CellMessage.create({
      cell: cell._id,
      sender: req.user._id,
      text: text.trim()
    });

    await message.populate('sender', 'firstName lastName _id');

    res.status(201).json({
      success: true,
      message: 'Message sent',
      data: { message }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const getCellMessages = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const cell = await Cell.findById(req.params.id);
    if (!cell) {
      return res.status(404).json({ success: false, message: 'Cell not found' });
    }

    const isMember = req.user ? await User.findOne({ _id: req.user._id, cellId: cell._id }) : null;
    if (!isMember && req.user) {
      return res.status(403).json({ success: false, message: 'You must be a member of this cell to view messages' });
    }

    const messages = await CellMessage.find({ cell: cell._id })
      .populate('sender', 'firstName lastName _id')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();

    const total = await CellMessage.countDocuments({ cell: cell._id });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: { offset: parseInt(offset), limit: parseInt(limit), total }
      }
    });
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
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.cellId) {
      if (user.cellId.toString() === cell._id.toString()) {
        return res.status(400).json({ success: false, message: `You are already a member of ${cell.name}` });
      }
      return res.status(400).json({ success: false, message: 'You are already in a cell' });
    }

    const existingRequest = await CellJoinRequest.findOne({ user: user._id, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'You already have a pending cell request' });
    }

    const memberCount = await User.countDocuments({ cellId: cell._id });
    if (memberCount >= cell.maxCapacity) {
      return res.status(400).json({ success: false, message: 'Cell is already at capacity' });
    }

    if (hasAdminPower(user)) {
      user.cellId = cell._id;
      await user.save();
      await refreshMemberCount(cell._id);
      await CellJoinRequest.deleteMany({ user: user._id, status: 'pending' });

      await recordAuditLog(req, {
        action: 'cell.member.self_assign',
        resource: 'Cell',
        resourceId: cell._id,
        metadata: { cell: cell.name, userId: user._id },
      });

      return res.json({
        success: true,
        message: `You joined ${cell.name}`,
        data: { cellId: cell._id, joinedDirectly: true },
      });
    }

    const joinRequest = await CellJoinRequest.create({
      cell: cell._id,
      user: user._id,
      reason: req.body.reason,
    });
    
    await notifyAudience('leaders', {
      type: 'system',
      title: 'New Cell Join Request',
      message: `${user.firstName} ${user.lastName} requested to join cell group: "${cell.name}"`,
      data: { cellId: cell._id, requestId: joinRequest._id }
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
    if (user.cellId && user.cellId.toString() === cell._id.toString()) {
      return res.status(400).json({ success: false, message: 'User is already assigned to this cell' });
    }

    const previousCellId = user.cellId;
    user.cellId = cell._id;
    await user.save();
    await CellJoinRequest.deleteMany({ user: user._id, status: 'pending' });

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
      await CellJoinRequest.updateMany(
        { user: joinRequest.user._id, status: 'pending', _id: { $ne: joinRequest._id } },
        { status: 'denied', reason: 'User was assigned to another cell', reviewedBy: req.user.id, reviewedAt: new Date() }
      );
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
  getCellDetail,
  getCellMembers,
  sendCellMessage,
  getCellMessages,
  createCell,
  updateCell,
  deleteCell,
  requestJoinCell,
  reviewJoinRequest,
  assignMemberToCell,
  removeMemberFromCell,
};

