const express = require('express');
const router = express.Router();
const { getSermons, getManageSermons, getSermonById, createSermon, updateSermon, deleteSermon, likeSermon } = require('../controllers/sermonController');
const { protect, admin, chaplain } = require('../middleware/auth');
const { validateSermon } = require('../middleware/validation');
const upload = require('../middleware/upload');

const sermonUpload = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'sermonAudio', maxCount: 1 },
  { name: 'sermonVideo', maxCount: 1 },
]);

const handleSermonUpload = (req, res, next) => {
  sermonUpload(req, res, (error) => {
    if (!error) return next();

    const maxUploadSizeMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 25);
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? `File is too large. Maximum upload size is ${maxUploadSizeMb} MB.`
      : error.message || 'Sermon media upload failed';

    return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
      success: false,
      message,
    });
  });
};

router.get('/', getSermons);
router.get('/manage/all', protect, chaplain, getManageSermons);
router.get('/:id', getSermonById);
router.post('/', protect, chaplain, handleSermonUpload, validateSermon, createSermon);
router.put('/:id', protect, chaplain, handleSermonUpload, validateSermon, updateSermon);
router.delete('/:id', protect, admin, deleteSermon);
router.post('/:id/like', protect, likeSermon);

module.exports = router;
