const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const required = ['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'ADMIN_FIRST_NAME', 'ADMIN_LAST_NAME', 'ADMIN_PHONE'];

const createAdmin = async () => {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  const mongoUri = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://localhost:27017/chapel-system';
  await mongoose.connect(mongoUri);

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
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  ).select('-password');

  console.log(`Admin ready: ${user.email}`);
};

createAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
