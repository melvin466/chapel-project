const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { bootstrapAdmin } = require('../utils/bootstrapAdmin');

dotenv.config();

const createAdmin = async () => {
  const mongoUri = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://localhost:27017/chapel-system';
  await mongoose.connect(mongoUri);

  const user = await bootstrapAdmin({ requireConfig: true });
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
