const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

// Submit feedback for a completed booking (with smart dynamic questions)
exports.submitFeedback = async (req, res) => {
  try {
    const {
      bookingId,
      rating,
      comment,
      impressedWith,
      couldImprove,
      missing,
      issues,
      otherFeedback,
      wantsFollowUp
    } = req.body;
    const userId = req.user.id;

    // Check if booking exists and is approved
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Can only provide feedback for approved bookings' });
    }

    // Check if feedback already exists (with actual rating)
    const existingFeedback = await Feedback.findOne({ bookingId, rating: { $gt: 0 } });
    if (existingFeedback) {
      return res.status(400).json({ success: false, message: 'Feedback already submitted for this booking' });
    }

    const feedback = await Feedback.create({
      bookingId,
      userId,
      roomId: booking.roomId,
      rating,
      comment,
      impressedWith: impressedWith || [],
      couldImprove: couldImprove || [],
      missing: missing || [],
      issues: issues || [],
      otherFeedback,
      wantsFollowUp: wantsFollowUp || false,
      emailSent: true
    });

    await feedback.populate([
      { path: 'userId', select: 'name email' },
      { path: 'roomId', select: 'name building' }
    ]);

    // If user wants follow-up, create notification for admin
    if (wantsFollowUp && rating <= 3) {
      await Notification.create({
        userId: booking.userId, // Will be reassigned to admin in admin notifications
        bookingId: booking._id,
        type: 'feedback_alert',
        title: 'Feedback Requires Attention',
        message: `User gave ${rating}-star rating for ${booking.roomId?.name || 'a room'} and requested follow-up.`,
        isRead: false
      });
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { feedback }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all feedback (for admin/approver)
exports.getAllFeedback = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const feedback = await Feedback.find()
      .populate('userId', 'name email')
      .populate('roomId', 'name building')
      .populate({
        path: 'bookingId',
        select: 'date startTime endTime purpose status'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments();

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get feedback by room
exports.getFeedbackByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const feedback = await Feedback.find({ roomId })
      .populate('userId', 'name email')
      .populate({
        path: 'bookingId',
        select: 'date startTime endTime purpose'
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { feedback }
    });
  } catch (error) {
    console.error('Error fetching room feedback:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get completed bookings with details (for providing feedback)
exports.getCompletedBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({
      userId,
      status: 'approved',
      date: { $lt: new Date() }
    })
      .populate('roomId', 'name building floor')
      .sort({ date: -1 });

    // Filter to only show bookings that have ended
    const today = new Date();
    const completedBookings = bookings.filter(booking => {
      const bookingEnd = new Date(booking.date);
      const [endHour, endMin] = booking.endTime.split(':');
      bookingEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);
      return bookingEnd < today;
    });

    // Check which bookings already have feedback
    const bookingIds = completedBookings.map(b => b._id);
    const feedbacks = await Feedback.find({ bookingId: { $in: bookingIds } });
    const feedbackMap = new Map(feedbacks.map(f => [f.bookingId.toString(), true]));

    const bookingsWithFeedbackStatus = completedBookings.map(booking => ({
      ...booking.toObject(),
      hasFeedback: feedbackMap.has(booking._id.toString())
    }));

    res.json({
      success: true,
      data: { bookings: bookingsWithFeedbackStatus }
    });
  } catch (error) {
    console.error('Error fetching completed bookings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get feedback statistics
exports.getFeedbackStats = async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments();

    const avgRating = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    const ratingDistribution = await Feedback.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    const roomRatings = await Feedback.aggregate([
      {
        $group: {
          _id: '$roomId',
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: '_id',
          as: 'room'
        }
      },
      {
        $unwind: '$room'
      },
      {
        $project: {
          roomName: '$room.name',
          averageRating: 1,
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        totalFeedback,
        averageRating: avgRating[0]?.average?.toFixed(1) || 0,
        totalRatings: avgRating[0]?.count || 0,
        ratingDistribution: ratingDistribution.map(r => ({ rating: r._id, count: r.count })),
        roomRatings
      }
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
