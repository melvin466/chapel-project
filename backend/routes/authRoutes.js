const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  redirectEmailVerification,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');
const upload = require('../middleware/upload');
const { authLimiter } = require('../middleware/rateLimiters');

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/verify-email', authLimiter, verifyEmail);
router.get('/verify-email', authLimiter, redirectEmailVerification);
router.post('/resend-verification', authLimiter, resendVerificationEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', protect, getMe);
router.put('/me', protect, upload.single('profilePicture'), updateMe);

module.exports = router;
