const express = require('express');
const router = express.Router();
const { getCells, getCellById, createCell, joinCell } = require('../controllers/cellController');
const { protect, admin } = require('../middleware/auth');
const { validateCell } = require('../middleware/validation');

router.get('/', getCells);
router.get('/:id', getCellById);
router.post('/', protect, admin, validateCell, createCell);
router.post('/:id/join', protect, joinCell);

module.exports = router;