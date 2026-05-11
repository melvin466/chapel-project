const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect, admin);

router.get('/', getUsers);
router.post('/', upload.single('profilePicture'), createUser);
router.get('/:id', getUserById);
router.put('/:id', upload.single('profilePicture'), updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
