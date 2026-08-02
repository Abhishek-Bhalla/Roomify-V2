const mongoose = require('mongoose');
const Counter = require('./Counter');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    required: [true, 'Booking ID is required']
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
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true,
    maxlength: [500, 'Purpose cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

bookingSchema.index({ roomId: 1, date: 1, startTime: 1, endTime: 1 });

bookingSchema.statics.getNextSequence = async function() {
  const counter = await Counter.findByIdAndUpdate(
    'bookingId',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

bookingSchema.statics.initializeCounter = async function() {
  const lastBooking = await this.findOne().sort({ bookingId: -1 });
  let seq = 0;
  if (lastBooking && lastBooking.bookingId) {
    const num = parseInt(lastBooking.bookingId.replace('BK-', ''));
    if (!isNaN(num)) seq = num;
  }
  await Counter.findByIdAndUpdate(
    'bookingId',
    { $set: { seq } },
    { upsert: true }
  );
  return seq;
};

module.exports = mongoose.model('Booking', bookingSchema);