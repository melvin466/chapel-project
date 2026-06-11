const Notification = require('../models/Notification');
const User = require('../models/User');

const notifyUser = async (userId, notification) => {
  if (!userId) return null;
  return Notification.create({
    user: userId,
    ...notification,
  });
};

const notifyActiveUsers = async (notification) => {
  const users = await User.find({ isActive: true }).select('_id');
  if (users.length === 0) return [];

  return Notification.insertMany(
    users.map((user) => ({
      user: user._id,
      ...notification,
    }))
  );
};

const audienceFilters = {
  everyone: {},
  students: { role: 'member' },
  staff: { role: { $in: ['admin', 'chaplain'] } },
  leaders: { role: { $in: ['admin', 'chaplain', 'chapel_leader'] } },
  cell_members: { cellId: { $exists: true, $ne: null } },
  ministry_members: { role: { $in: ['member', 'chapel_leader'] } },
};

const notifyAudience = async (targetAudience = 'everyone', notification) => {
  const audienceFilter = audienceFilters[targetAudience] || audienceFilters.everyone;
  const users = await User.find({ isActive: true, ...audienceFilter }).select('_id');
  if (users.length === 0) return [];

  return Notification.insertMany(
    users.map((user) => ({
      user: user._id,
      ...notification,
    }))
  );
};

module.exports = { notifyUser, notifyActiveUsers, notifyAudience };
