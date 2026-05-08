const express = require('express');
const router = express.Router();
const { getSermons, getSermonById, createSermon, likeSermon } = require('../controllers/sermonController');
const { protect, admin, chaplain } = require('../middleware/auth');
const { validateSermon } = require('../middleware/validation');

router.get('/', getSermons);
router.get('/:id', getSermonById);
router.post('/', protect, chaplain, validateSermon, createSermon);
router.post('/:id/like', protect, likeSermon);

module.exports = router;