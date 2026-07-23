const cron = require('node-cron');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const { sendBookingReminderEmail } = require('../utils/emailService');

const sendReminderNotification = async (booking) => {
  try {
    await booking.populate('roomId', 'name capacity building floor');
    await booking.populate('userId', 'name email');

    const existingNotification = await Notification.findOne({
      bookingId: booking._id,
      type: 'booking_reminder',
      createdAt: { $gte: new Date(Date.now() - 70 * 60 * 1000) }
    });

    if (existingNotification) {
      return;
    }

    await Notification.create({
      userId: booking.userId._id,
      bookingId: booking._id,
      type: 'booking_reminder',
      title: 'Booking Reminder',
      message: `You have a booking for ${booking.roomId.name} in 1 hour (${booking.startTime} - ${booking.endTime}). Purpose: ${booking.purpose}`
    });

    // Send reminder email
    await sendBookingReminderEmail(
      booking.userId.email,
      booking.userId.name,
      {
        roomName: booking.roomId.name,
        date: new Date(booking.date).toLocaleDateString(),
        startTime: booking.startTime,
        endTime: booking.endTime,
        purpose: booking.purpose,
        bookingId: booking.bookingId
      }
    );

    console.log(`Reminder sent for booking ${booking._id}`);
  } catch (error) {
    console.error('Error sending reminder notification:', error);
  }
};

const checkUpcomingBookings = async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const upcomingBookings = await Booking.find({
      status: 'approved',
      date: {
        $gte: new Date(now.toISOString().split('T')[0]),
        $lte: new Date(now.toISOString().split('T')[0] + 'T23:59:59.999Z')
      }
    });

    for (const booking of upcomingBookings) {
      const bookingTime = booking.startTime.split(':');
      const bookingDateTime = new Date(booking.date);
      bookingDateTime.setHours(parseInt(bookingTime[0]), parseInt(bookingTime[1]), 0, 0);

      const timeDiff = bookingDateTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      if (minutesDiff > 0 && minutesDiff <= 60) {
        await sendReminderNotification(booking);
      }
    }
  } catch (error) {
    console.error('Error checking upcoming bookings:', error);
  }
};

const startNotificationScheduler = () => {
  cron.schedule('*/5 * * * *', async () => {
    await checkUpcomingBookings();
  });

  console.log('Notification scheduler started - checks every 5 minutes for upcoming bookings');
};

module.exports = { startNotificationScheduler };
