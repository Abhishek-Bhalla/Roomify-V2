const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    if (user.status === 'blocked') {
      return errorResponse(res, 'Account has been blocked', 403);
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const token = generateToken(user._id);

    return successResponse(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, employeeId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 400);
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'requester',
      employeeId: employeeId || `EMP${Date.now()}`
    });

    const token = generateToken(user._id);

    return successResponse(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    }, 'Registration successful', 201);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return successResponse(res, { user }, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
};

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'approver', 'requester']).withMessage('Invalid role'),
  body('employeeId').optional().trim()
];

module.exports = {
  login,
  register,
  getMe,
  loginValidation,
  registerValidation
};