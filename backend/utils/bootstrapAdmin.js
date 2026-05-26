const bcrypt = require('bcryptjs');
const User = require('../models/User');

const requiredAdminEnv = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_FIRST_NAME', 'ADMIN_LAST_NAME', 'ADMIN_PHONE'];

const getMissingAdminEnv = () => requiredAdminEnv.filter((key) => !process.env[key]);

const bootstrapAdmin = async ({ requireConfig = false } = {}) => {
  const missing = getMissingAdminEnv();

  if (missing.length > 0) {
    if (requireConfig) {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }

    if (missing.length !== requiredAdminEnv.length) {
      console.warn(`Admin bootstrap skipped; missing env vars: ${missing.join(', ')}`);
    }

    return null;
  }

  const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

  const user = await User.findOneAndUpdate(
    { email },
    {
      firstName: process.env.ADMIN_FIRST_NAME,
      lastName: process.env.ADMIN_LAST_NAME,
      email,
      password: hashedPassword,
      phoneNumber: process.env.ADMIN_PHONE,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  ).select('-password');

  return user;
};

module.exports = {
  bootstrapAdmin,
};
