const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getPendingBookings,
  approveBooking,
  rejectBooking,
  getAllBookings,
  createBookingValidation,
  rejectBookingValidation,
  bookingIdValidation
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validation');

router.use(protect);

// Requester routes
router.post('/', authorize('requester'), createBookingValidation, validate, createBooking);
router.get('/my', authorize('requester'), getMyBookings);

// Approver routes - approve/reject
router.get('/pending', authorize('approver', 'admin'), getPendingBookings);
router.patch('/:id/approve', authorize('approver', 'admin'), bookingIdValidation, validate, approveBooking);
router.patch('/:id/reject', authorize('approver', 'admin'), bookingIdValidation, validate, rejectBookingValidation, validate, rejectBooking);

// All authenticated users can view all approved bookings (for availability)
router.get('/all', authorize('admin', 'approver', 'requester'), getAllBookings);

module.exports = router;