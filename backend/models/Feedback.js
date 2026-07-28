const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // What impressed them most (for 5 stars)
  impressedWith: [{
    type: String,
    enum: ['easy_booking', 'fast_approval', 'clean_facility', 'well_maintained_equipment', 'friendly_staff', 'everything_smooth', 'other']
  }],
  // What could be better (for 4 stars)
  couldImprove: [{
    type: String,
    enum: ['faster_approval', 'better_equipment', 'cleaner_room', 'more_time_slots', 'better_internet', 'other']
  }],
  // What was missing (for 3 stars)
  missing: [{
    type: String,
    enum: ['equipment_quality', 'cleanliness', 'approval_speed', 'room_comfort', 'booking_process', 'other']
  }],
  // What went wrong (for 1-2 stars)
  issues: [{
    type: String,
    enum: ['equipment_failure', 'room_unavailable', 'booking_conflict', 'long_approval_time', 'staff_issue', 'room_not_clean', 'internet_issue', 'incorrect_booking', 'other']
  }],
  // Other feedback text
  otherFeedback: {
    type: String,
    trim: true,
    maxlength: 500
  },
  // Whether user wants follow-up on issues
  wantsFollowUp: {
    type: Boolean,
    default: false
  },
  // Feedback sent via email
  emailSent: {
    type: Boolean,
    default: false
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

feedbackSchema.index({ bookingId: 1 });
feedbackSchema.index({ userId: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ wantsFollowUp: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
