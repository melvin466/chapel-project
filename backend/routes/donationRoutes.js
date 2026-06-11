const express = require('express');
const router = express.Router();
const {
  getDonations,
  getManageDonations,
  getDonationOptions,
  createDonation,
  getDonationStats,
  updateManagedDonation,
  handlePaymentCallback,
  getDonationStatusPublic,
} = require('../controllers/donationController');
const { protect, optionalProtect, admin } = require('../middleware/auth');

router.get('/manage/all', protect, admin, getManageDonations);
router.get('/', protect, getDonations);
router.get('/options', getDonationOptions);
router.get('/stats', protect, admin, getDonationStats);
router.get('/status/:transactionId', getDonationStatusPublic);
router.post('/', optionalProtect, createDonation);
router.put('/:id/manage', protect, admin, updateManagedDonation);
router.all('/callback', handlePaymentCallback);

module.exports = router;
