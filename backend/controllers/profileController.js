const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars');

const deleteAvatarFile = (userId) => {
  if (!userId) return;
  try {
    const dir = AVATAR_DIR;
    if (!fs.existsSync(dir)) return;
    for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
      const filePath = path.join(dir, `${userId}.${ext}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return;
      }
    }
  } catch (err) {
    // best-effort; the DB is the source of truth
    console.warn('Failed to delete avatar file:', err.message);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.user && (req.user._id || req.user.id);
    const requesterRole = req.user && req.user.role;

    if (requesterRole !== 'admin' && String(requesterId) !== String(id)) {
      return errorResponse(res, 'You can only change your own profile picture', 403);
    }

    if (!req.file) {
      return errorResponse(res, 'No avatar file uploaded', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      // multer already wrote the file; clean it up
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return errorResponse(res, 'User not found', 404);
    }

    // Remove any prior avatar file with a different extension
    if (user.profilePicture) {
      deleteAvatarFile(user._id.toString());
    }

    user.profilePicture = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    return successResponse(res, {
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePicture: user.profilePicture,
      }
    }, 'Profile picture updated successfully');
  } catch (error) {
    // Clean up the uploaded file on error
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(error);
  }
};

const removeAvatar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.user && (req.user._id || req.user.id);
    const requesterRole = req.user && req.user.role;

    if (requesterRole !== 'admin' && String(requesterId) !== String(id)) {
      return errorResponse(res, 'You can only change your own profile picture', 403);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    deleteAvatarFile(user._id.toString());
    user.profilePicture = null;
    await user.save();

    return successResponse(res, {
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePicture: null,
      }
    }, 'Profile picture removed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadAvatar, removeAvatar };