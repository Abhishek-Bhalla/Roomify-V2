const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadAvatar, removeAvatar } = require('../controllers/profileController');

router.use(protect);

// Authz is enforced inside the controller (own user OR admin) so any
// authenticated role can hit these endpoints for themselves.
router.post('/:id/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/:id/avatar', removeAvatar);

module.exports = router;