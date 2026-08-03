const express = require('express');
const router = express.Router();
const { login, register, getMe, loginValidation, registerValidation } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

router.post('/login', loginValidation, validate, login);
// Public self-registration is disabled. Accounts are created by admins via
// the User Management module (POST /api/users).
router.post('/register', protect, authorize('admin'), registerValidation, validate, register);
router.get('/me', protect, getMe);

module.exports = router;
