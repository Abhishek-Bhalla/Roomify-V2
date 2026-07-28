const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback, getFeedbackByRoom, getCompletedBookings, getFeedbackStats } = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Submit feedback for a completed booking
router.post('/', submitFeedback);

// Get all feedback (for admin/approver)
router.get('/', getAllFeedback);

// Get feedback statistics
router.get('/stats', getFeedbackStats);

// Get completed bookings (for requester to provide feedback)
router.get('/completed-bookings', getCompletedBookings);

// Get feedback by room
router.get('/room/:roomId', getFeedbackByRoom);

module.exports = router;
