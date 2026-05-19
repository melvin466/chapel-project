const express = require('express');
const router = express.Router();
const {
  getCells,
  getManageCells,
  getCellById,
  createCell,
  updateCell,
  deleteCell,
  joinCell,
  assignMemberToCell,
  removeMemberFromCell,
} = require('../controllers/cellController');
const { protect, admin } = require('../middleware/auth');
const { validateCell } = require('../middleware/validation');

router.get('/', getCells);
router.get('/manage/all', protect, admin, getManageCells);
router.get('/:id', getCellById);
router.post('/', protect, admin, validateCell, createCell);
router.put('/:id', protect, admin, validateCell, updateCell);
router.delete('/:id', protect, admin, deleteCell);
router.post('/:id/members', protect, admin, assignMemberToCell);
router.delete('/:id/members/:userId', protect, admin, removeMemberFromCell);
router.post('/:id/join', protect, joinCell);

module.exports = router;
