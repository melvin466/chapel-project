const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../services/emailService');
const crypto = require('crypto');
const { sendServerError } = require('../utils/errorResponse');
const { getUploadedFilePath } = require('../utils/uploadedFile');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createTokenPair = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hashedToken: hashToken(token) };
};

const getFrontendBaseUrl = () => (
  process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173'
).replace(/\/+$/, '');

const getFrontendUrl = (path) => `${getFrontendBaseUrl()}${path}`;

const getDevTokenPayload = (key, token) => (
  process.env.NODE_ENV === 'production' ? {} : { data: { [key]: token } }
);

const isEmailVerificationRequired = () => (
  process.env.NODE_ENV !== 'test' && process.env.REQUIRE_EMAIL_VERIFICATION === 'true'
);

const toSafeUser = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phoneNumber: user.phoneNumber,
  role: user.role,
  profilePicture: user.profilePicture,
  bio: user.bio,
  isEmailVerified: user.isEmailVerified,
});

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { token: verificationToken, hashedToken } = createTokenPair();

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const verificationUrl = getFrontendUrl(`/verify-email?token=${verificationToken}`);

    await sendEmail({
      to: email,
      subject: 'Verify Your Email',
      htmlContent: `<p>Please verify your chapel account by clicking <a href="${verificationUrl}">this link</a>.</p><p>This link expires in 24 hours.</p>`
    });

    res.status(201).json({
      success: true,
      message: 'User registered. Please check your email to verify your account.',
      ...getDevTokenPayload('verificationToken', verificationToken),
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (isEmailVerificationRequired() && !user.isEmailVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email before logging in' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          ...toSafeUser(user)
        },
        token
      }
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const token = req.body.token || req.query.token;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const user = await User.findOne({
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    sendServerError(res, error);
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.isEmailVerified) {
      return res.json({ success: true, message: 'If verification is needed, an email has been sent.' });
    }

    const { token, hashedToken } = createTokenPair();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verificationUrl = getFrontendUrl(`/verify-email?token=${token}`);
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email',
      htmlContent: `<p>Please verify your chapel account by clicking <a href="${verificationUrl}">this link</a>.</p><p>This link expires in 24 hours.</p>`
    });

    res.json({
      success: true,
      message: 'If verification is needed, an email has been sent.',
      ...getDevTokenPayload('verificationToken', token),
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    let resetToken;

    if (user) {
      const tokenPair = createTokenPair();
      resetToken = tokenPair.token;
      user.passwordResetToken = tokenPair.hashedToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const resetUrl = getFrontendUrl(`/reset-password?token=${resetToken}`);
      await sendEmail({
        to: user.email,
        subject: 'Reset Your Password',
        htmlContent: `<p>You can reset your chapel account password by clicking <a href="${resetUrl}">this link</a>.</p><p>This link expires in 1 hour.</p>`
      });
    }

    res.json({
      success: true,
      message: 'If an account exists for that email, a password reset link has been sent.',
      ...(resetToken ? getDevTokenPayload('resetToken', resetToken) : {}),
    });
  } catch (error) {
    sendServerError(res, error);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    sendServerError(res, error);
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: { user } });
  } catch (error) {
    sendServerError(res, error);
  }
};

const updateMe = async (req, res) => {
  try {
    const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'bio'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updateData[field] = req.body[field];
    });

    const profilePicture = getUploadedFilePath(req.file);
    if (profilePicture) updateData.profilePicture = profilePicture;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: { user } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((err) => err.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    sendServerError(res, error);
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateMe,
};
