const { body, param } = require('express-validator');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { createNotification } = require('./notificationController');
const { sendBookingCreatedEmail, sendBookingApprovedEmail, sendBookingRejectedEmail, sendBookingRequestForApprovalEmail } = require('../utils/emailService');

// Maintenance lifecycle states that block booking. 'none' or undefined
// (legacy rooms predating the maintenanceStatus field) are treated as available.
const MAINTENANCE_ACTIVE = ['under_maintenance', 'maintenance_assigned', 'in_progress', 'review_pending'];

const checkConflict = async (roomId, date, startTime, endTime, excludeBookingId = null) => {
  const query = {
    roomId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const dateStr = typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];
  const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
  const endOfDay = new Date(dateStr + 'T23:59:59.999Z');
  query.date = { $gte: startOfDay, $lte: endOfDay };

  const conflict = await Booking.findOne(query);
  return !!conflict;
};

const createBooking = async (req, res, next) => {
  try {
    const { roomId, date, startTime, endTime, purpose } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return errorResponse(res, 'Room not found', 404);
    }

    if (room.status !== 'available' || MAINTENANCE_ACTIVE.includes(room.maintenanceStatus)) {
      return errorResponse(res, 'Room is not available for booking', 400);
    }

    const hasConflict = await checkConflict(roomId, date, startTime, endTime);
    if (hasConflict) {
      return errorResponse(res, 'Room is already booked for this time slot', 409);
    }

    const seq = await Booking.getNextSequence();
    const bookingId = `BK-${String(seq).padStart(5, '0')}`;

    const booking = await Booking.create({
      bookingId,
      userId: req.user._id,
      roomId,
      date: new Date(date + 'T12:00:00.000'),
      startTime,
      endTime,
      purpose
    });

    await booking.populate('roomId', 'name capacity building floor roomId');
    await booking.populate('userId', 'name email employeeId');

    await createNotification(
      req.user._id,
      booking._id,
      'booking_created',
      'Booking Request Submitted',
      `Your booking request for ${booking.roomId.name} on ${new Date(date).toLocaleDateString()} from ${startTime} to ${endTime} has been submitted and is pending approval.`
    );

    // Send confirmation email to requester
    await sendBookingCreatedEmail(
      req.user.email,
      req.user.name,
      {
        roomName: booking.roomId.name,
        date: new Date(date).toLocaleDateString(),
        startTime,
        endTime,
        purpose,
        bookingId: booking.bookingId
      }
    );

    // Send email to all approvers about new booking request
    const approvers = await User.find({ role: 'approver', status: 'active' });
    for (const approver of approvers) {
      await sendBookingRequestForApprovalEmail(
        approver.email,
        approver.name,
        {
          roomName: booking.roomId.name,
          date: new Date(date).toLocaleDateString(),
          startTime,
          endTime,
          purpose,
          bookingId: booking.bookingId,
          requesterName: req.user.name,
          requesterEmail: req.user.email
        }
      );
    }

    return successResponse(res, { booking }, 'Booking request created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const { status } = req.query;

    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('roomId', 'name capacity building floor location facilities roomId')
      .populate('userId', 'name email employeeId')
      .sort({ createdAt: -1 });

    return successResponse(res, { bookings }, 'Bookings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getPendingBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ status: 'pending' })
      .populate('roomId', 'name capacity building floor location roomId')
      .populate('userId', 'name email employeeId')
      .sort({ createdAt: 1 });

    return successResponse(res, { bookings }, 'Pending bookings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const approveBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);
    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    if (booking.status !== 'pending') {
      return errorResponse(res, 'Booking is not pending', 400);
    }

    booking.status = 'approved';
    booking.remarks = null;
    await booking.save();

    await booking.populate('roomId', 'name capacity building floor roomId');
    await booking.populate('userId', 'name email employeeId');

    await createNotification(
      booking.userId,
      booking._id,
      'booking_approved',
      'Booking Approved',
      `Your booking request for ${booking.roomId.name} on ${new Date(booking.date).toLocaleDateString()} from ${booking.startTime} to ${booking.endTime} has been approved!`
    );

    // Send approval email
    const userEmail = typeof booking.userId === 'object' ? booking.userId.email : (await require('../models/User').findById(booking.userId)).email;
    const userName = typeof booking.userId === 'object' ? booking.userId.name : (await require('../models/User').findById(booking.userId)).name;

    await sendBookingApprovedEmail(
      userEmail,
      userName,
      {
        roomName: booking.roomId.name,
        date: new Date(booking.date).toLocaleDateString(),
        startTime: booking.startTime,
        endTime: booking.endTime,
        purpose: booking.purpose,
        bookingId: booking.bookingId
      }
    );

    return successResponse(res, { booking }, 'Booking approved successfully');
  } catch (error) {
    next(error);
  }
};

const rejectBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    if (booking.status !== 'pending') {
      return errorResponse(res, 'Booking is not pending', 400);
    }

    booking.status = 'rejected';
    booking.remarks = remarks || 'Booking rejected';
    await booking.save();

    await booking.populate('roomId', 'name capacity building floor roomId');
    await booking.populate('userId', 'name email employeeId');

    await createNotification(
      booking.userId,
      booking._id,
      'booking_rejected',
      'Booking Rejected',
      `Your booking request for ${booking.roomId.name} on ${new Date(booking.date).toLocaleDateString()} from ${booking.startTime} to ${booking.endTime} has been rejected. Reason: ${booking.remarks}`
    );

    // Send rejection email
    const userEmail = typeof booking.userId === 'object' ? booking.userId.email : (await require('../models/User').findById(booking.userId)).email;
    const userName = typeof booking.userId === 'object' ? booking.userId.name : (await require('../models/User').findById(booking.userId)).name;

    await sendBookingRejectedEmail(
      userEmail,
      userName,
      {
        roomName: booking.roomId.name,
        date: new Date(booking.date).toLocaleDateString(),
        startTime: booking.startTime,
        endTime: booking.endTime,
        purpose: booking.purpose,
        bookingId: booking.bookingId,
        remarks: booking.remarks
      }
    );

    return successResponse(res, { booking }, 'Booking rejected successfully');
  } catch (error) {
    next(error);
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const { status, date } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (date) filter.date = new Date(date);

    const bookings = await Booking.find(filter)
      .populate('roomId', 'name capacity building floor location roomId')
      .populate('userId', 'name email employeeId')
      .sort({ createdAt: -1 });

    return successResponse(res, { bookings }, 'All bookings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createBookingValidation = [
  body('roomId').isMongoId().withMessage('Invalid room ID'),
  body('date').isDate().withMessage('Invalid date'),
  body('startTime').notEmpty().withMessage('Start time is required'),
  body('endTime').notEmpty().withMessage('End time is required'),
  body('purpose').trim().notEmpty().withMessage('Purpose is required')
];

const rejectBookingValidation = [
  body('remarks').optional().trim().isLength({ max: 500 }).withMessage('Remarks cannot exceed 500 characters')
];

const bookingIdValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID')
];

module.exports = {
  createBooking,
  getMyBookings,
  getPendingBookings,
  approveBooking,
  rejectBooking,
  getAllBookings,
  createBookingValidation,
  rejectBookingValidation,
  bookingIdValidation
};
