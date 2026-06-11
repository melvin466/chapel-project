require('dotenv').config();
const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  amount: Number,
  status: String,
  donationType: String,
  transactionId: String,
  pesapalOrderTrackingId: String,
  phoneNumber: String,
  provider: String,
  createdAt: Date
}, { collection: 'donations' });

const Donation = mongoose.model('Donation', DonationSchema);

async function checkRecentDonations() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI not found');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected.');

  console.log('Fetching the 10 most recent donations...');
  const donations = await Donation.find().sort({ createdAt: -1 }).limit(10);

  if (donations.length === 0) {
    console.log('No donations found.');
  } else {
    donations.forEach((d, i) => {
      console.log(`\n--- Donation #${i + 1} ---`);
      console.log(`ID: ${d._id}`);
      console.log(`Amount: ${d.amount}`);
      console.log(`Status: ${d.status}`);
      console.log(`Transaction ID: ${d.transactionId}`);
      console.log(`Order Tracking ID: ${d.pesapalOrderTrackingId}`);
      console.log(`Phone: ${d.phoneNumber}`);
      console.log(`Date: ${d.createdAt}`);
    });
  }

  await mongoose.disconnect();
  console.log('\nDisconnected.');
}

checkRecentDonations().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
