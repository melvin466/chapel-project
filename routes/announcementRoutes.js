const express = require('express');
const router = express.Router();
const { getAnnouncements, getAnnouncementById, createAnnouncement, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { protect, admin, chaplain } = require('../middleware/auth');

router.get('/', getAnnouncements);
router.get('/:id', getAnnouncementById);
router.post('/', protect, admin, createAnnouncement);
router.put('/:id', protect, chaplain, updateAnnouncement);
router.delete('/:id', protect, admin, deleteAnnouncement);

module.exports = router;