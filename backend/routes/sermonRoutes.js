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

router.get('/', getSermons);
router.get('/manage/all', protect, chaplain, getManageSermons);
router.get('/:id', getSermonById);
router.post('/', protect, chaplain, sermonUpload, validateSermon, createSermon);
router.put('/:id', protect, chaplain, sermonUpload, validateSermon, updateSermon);
router.delete('/:id', protect, admin, deleteSermon);
router.post('/:id/like', protect, likeSermon);

module.exports = router;
