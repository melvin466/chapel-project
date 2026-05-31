const PrayerRequest = require('../models/PrayerRequest');
const { recordAuditLog } = require('../utils/auditLogger');

const careRoles = ['admin', 'chaplain'];

const canSeePrayer = (prayer, user) => {
  const isOwner = prayer.requestedBy?.toString?.() === user.id || prayer.requestedBy?._id?.toString?.() === user.id;
  return prayer.visibility !== 'chaplain' || isOwner || careRoles.includes(user.role);
};

const serializePrayer = (prayer, user) => {
  const prayerObject = typeof prayer.toObject === 'function' ? prayer.toObject() : prayer;
  const requestedById = prayerObject.requestedBy?._id || prayerObject.requestedBy;
  const isOwner = requestedById?.toString?.() === user.id;
  const viewerHasPrayed = Boolean(
    prayerObject.prayedBy?.some((entry) => (entry.user?._id || entry.user)?.toString?.() === user.id)
  );

  if (!isOwner) {
    delete prayerObject.prayerCount;
    delete prayerObject.prayedBy;
  }

  return {
    ...prayerObject,
    canViewPrayerCount: isOwner,
    viewerHasPrayed,
    viewerCanPray: !isOwner && prayerObject.status !== 'closed' && canSeePrayer(prayerObject, user),
  };
};

const getPrayerRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filterParts = [];

    if (status) {
      filterParts.push({ status });
    }

    if (!careRoles.includes(req.user.role)) {
      filterParts.push({
        $or: [
          { requestedBy: req.user.id },
          {
            visibility: { $in: ['community', null] },
            status: { $in: ['active', 'answered'] },
          },
          {
            visibility: { $exists: false },
            status: { $in: ['active', 'answered'] },
          },
        ],
      });
    }

    const filter = filterParts.length ? { $and: filterParts } : {};

    const prayerRequests = await PrayerRequest.find(filter)
      .populate('requestedBy', 'firstName lastName')
      .populate('answeredBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await PrayerRequest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        prayerRequests: prayerRequests.map((prayer) => serializePrayer(prayer, req.user)),
        pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const createPrayerRequest = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      visibility: req.body.visibility || 'community',
      requestedBy: req.user.id,
    };
    const prayerRequest = await PrayerRequest.create(payload);
    res.status(201).json({ success: true, data: { prayerRequest: serializePrayer(prayerRequest, req.user) } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const prayForRequest = async (req, res) => {
  try {
    const prayer = await PrayerRequest.findById(req.params.id);
    if (!prayer) return res.status(404).json({ success: false, message: 'Prayer request not found' });
    if (!canSeePrayer(prayer, req.user)) {
      return res.status(403).json({ success: false, message: 'You cannot pray for this request' });
    }
    if (prayer.requestedBy.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot mark your own request as prayed for' });
    }
    if (prayer.status === 'closed') {
      return res.status(400).json({ success: false, message: 'This prayer request is closed' });
    }
    
    const alreadyPrayed = prayer.prayedBy.some(p => p.user.toString() === req.user.id);
    if (!alreadyPrayed) {
      prayer.prayerCount += 1;
      prayer.prayedBy.push({ user: req.user.id });
      await prayer.save();
    }
    
    res.json({
      success: true,
      message: alreadyPrayed ? 'Prayer already recorded' : 'Prayer recorded',
      data: serializePrayer(prayer, req.user),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const updatePrayerStatus = async (req, res) => {
  try {
    const { status, adminResponse = '' } = req.body;
    if (!['active', 'answered', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid prayer status' });
    }

    const updateData = {
      status,
      adminResponse: status === 'answered' ? adminResponse : '',
      answeredBy: status === 'answered' ? req.user.id : null,
      answeredAt: status === 'answered' ? new Date() : null
    };

    const prayer = await PrayerRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('requestedBy', 'firstName lastName').populate('answeredBy', 'firstName lastName');
    if (!prayer) return res.status(404).json({ success: false, message: 'Prayer request not found' });
    await recordAuditLog(req, {
      action: 'prayer.status_update',
      resource: 'PrayerRequest',
      resourceId: prayer._id,
      metadata: { title: prayer.title, status: prayer.status, answeredBy: prayer.answeredBy?._id },
    });
    res.json({ success: true, data: { prayer } });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

const deletePrayerRequest = async (req, res) => {
  try {
    const prayer = await PrayerRequest.findByIdAndDelete(req.params.id);
    if (!prayer) return res.status(404).json({ success: false, message: 'Prayer request not found' });
    await recordAuditLog(req, {
      action: 'prayer.delete',
      resource: 'PrayerRequest',
      resourceId: prayer._id,
      metadata: { title: prayer.title, status: prayer.status },
    });
    res.json({ success: true, message: 'Prayer request deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
};

module.exports = { getPrayerRequests, createPrayerRequest, prayForRequest, updatePrayerStatus, deletePrayerRequest };
