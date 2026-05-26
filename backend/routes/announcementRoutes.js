const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getManageAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, admin, chaplain } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getUploadedFilePath } = require('../utils/uploadedFile');

const announcementUpload = upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'announcementVideo', maxCount: 1 }
]);

// Public routes (anyone can view)
router.get('/', getAnnouncements);
router.get('/manage/all', protect, chaplain, getManageAnnouncements);
router.get('/:id', getAnnouncementById);

// Admin/Chaplain only routes (create, update, delete announcements)
router.post('/', protect, chaplain, announcementUpload, createAnnouncement);
router.put('/:id', protect, chaplain, announcementUpload, updateAnnouncement);
router.delete('/:id', protect, admin, deleteAnnouncement);

// Admin upload route
router.post('/upload', protect, admin, upload.single('featuredImage'), (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      filePath: getUploadedFilePath(req.file),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: require('../utils/errorResponse').getErrorMessage(error) });
  }
});

module.exports = router;
