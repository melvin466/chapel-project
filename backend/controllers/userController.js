const bcrypt = require('bcryptjs');
const User = require('../models/User');

const getFilePath = (file) => {
  if (!file) return undefined;
  const normalizedPath = file.path.replace(/\\/g, '/');
  const uploadIndex = normalizedPath.indexOf('/uploads/');
  return uploadIndex >= 0 ? normalizedPath.slice(uploadIndex) : `/${normalizedPath}`;
};

const withUploadedUserFile = (body, file) => {
  const data = { ...body };
  const profilePicture = getFilePath(file);
  if (profilePicture) data.profilePicture = profilePicture;
  return data;
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: { users } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const payload = withUploadedUserFile(req.body, req.file);
    const { firstName, lastName, email, password, phoneNumber, role, isActive, isEmailVerified, profilePicture } = payload;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!firstName || !lastName || !normalizedEmail || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'First name, last name, email, and phone number are required' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber,
      role: role || 'member',
      isActive: isActive === 'false' ? false : Boolean(isActive ?? true),
      isEmailVerified: isEmailVerified === 'true' || isEmailVerified === true,
      profilePicture: profilePicture || ''
    });

    const safeUser = await User.findById(user._id).select('-password');
    res.status(201).json({ success: true, data: { user: safeUser } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map((err) => err.message).join(', ');
      return res.status(400).json({ success: false, message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updateData = withUploadedUserFile(req.body, req.file);
    if (updateData.email) updateData.email = updateData.email.toLowerCase().trim();
    if (updateData.isActive !== undefined) updateData.isActive = updateData.isActive === 'false' ? false : Boolean(updateData.isActive);
    if (updateData.isEmailVerified !== undefined) updateData.isEmailVerified = updateData.isEmailVerified === 'true' || updateData.isEmailVerified === true;

    if (updateData.password) {
      if (updateData.password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
