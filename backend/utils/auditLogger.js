const AuditLog = require('../models/AuditLog');

const recordAuditLog = async (req, { action, resource, resourceId, metadata = {} }) => {
  try {
    await AuditLog.create({
      actor: req.user?._id || req.user?.id,
      actorRole: req.user?.role,
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : undefined,
      metadata,
      ipAddress: req.ip,
      userAgent: req.get?.('user-agent'),
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Audit log write failed:', error.message);
    }
  }
};

module.exports = { recordAuditLog };
