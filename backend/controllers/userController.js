const { body, param } = require('express-validator');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { validateWorkEmail } = require('../utils/validation');

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return successResponse(res, { users }, 'Users retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, employeeId } = req.body;

    const workEmailError = validateWorkEmail(email);
    if (workEmailError) {
      return errorResponse(res, workEmailError, 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 400);
    }

    if (employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId });
      if (existingEmployeeId) {
        return errorResponse(res, 'Employee ID already exists', 400);
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'requester',
      employeeId
    });

    return successResponse(res, {
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    }, 'User created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, employeeId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return errorResponse(res, 'Email already in use', 400);
      }
    }

    if (employeeId && employeeId !== user.employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId });
      if (existingEmployeeId) {
        return errorResponse(res, 'Employee ID already in use', 400);
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    if (role) user.role = role;
    if (employeeId) user.employeeId = employeeId;

    await user.save();

    return successResponse(res, {
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    }, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return errorResponse(res, 'Cannot delete your own account', 400);
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return errorResponse(res, 'Cannot block your own account', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.status === 'blocked') {
      return errorResponse(res, 'User is already blocked', 400);
    }

    user.status = 'blocked';
    await user.save();

    return successResponse(res, {
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    }, 'User blocked successfully');
  } catch (error) {
    next(error);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.status === 'active') {
      return errorResponse(res, 'User is already active', 400);
    }

    user.status = 'active';
    await user.save();

    return successResponse(res, {
      user: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    }, 'User unblocked successfully');
  } catch (error) {
    next(error);
  }
};

const createUserValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'approver', 'requester', 'maintenance']).withMessage('Invalid role')
];

const updateUserValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('employeeId').optional().trim().notEmpty().withMessage('Employee ID cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('role').optional().isIn(['admin', 'approver', 'requester', 'maintenance']).withMessage('Invalid role')
];

// Custom work email validation for express-validator
const workEmailValidator = (value) => {
  const error = validateWorkEmail(value);
  if (error) {
    throw new Error(error);
  }
  return true;
};

const userIdValidation = [
  param('id').isMongoId().withMessage('Invalid user ID')
];

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  blockUser,
  unblockUser,
  createUserValidation,
  updateUserValidation,
  userIdValidation
};