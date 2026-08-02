const cron = require('node-cron');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Feedback = require('../models/Feedback');
const { sendBookingReminderEmail, sendFeedbackRequestEmail } = require('../utils/emailService');

const sendReminderNotification = async (booking) => {
  try {
    await booking.populate('roomId', 'name capacity building floor');
    await booking.populate('userId', 'name email');

    // Skip if userId or userId.email is null
    if (!booking.userId || !booking.userId.email) {
      console.log(`Skipping reminder for booking ${booking._id} - no user email`);
      return;
    }

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

// Check for completed bookings and send feedback request emails
const checkCompletedBookingsAndSendFeedbackEmail = async () => {
  try {
    const now = new Date();

    // Find all approved bookings (both past and today)
    const bookings = await Booking.find({
      status: 'approved'
    }).populate('roomId', 'name').populate('userId', 'name email');

    for (const booking of bookings) {
      // Skip if userId or userId.email is null
      if (!booking.userId || !booking.userId.email) {
        console.log(`Skipping feedback email for booking ${booking._id} - no user email`);
        continue;
      }

      // Calculate booking end datetime
      const bookingDate = new Date(booking.date);
      const [endHour, endMin] = booking.endTime.split(':').map(Number);
      bookingDate.setHours(endHour, endMin, 0, 0);

      // Add 1 hour buffer after booking ends
      const bookingEndWithBuffer = new Date(bookingDate.getTime() + 60 * 60 * 1000);

      // Only process bookings that have ended
      if (bookingEndWithBuffer < now) {
        // Check if feedback already submitted
        const existingFeedback = await Feedback.findOne({
          bookingId: booking._id,
          rating: { $gt: 0 }
        });

        if (!existingFeedback) {
          // Dedupe: skip if we've ALREADY sent a feedback-request email for this booking.
          // The Notification collection tracks any email we sent for this booking.
          const alreadySent = await Notification.findOne({
            bookingId: booking._id,
            type: 'feedback_request'
          });

          if (alreadySent) {
            continue;
          }

          // Build feedback URL - use the configured frontend URL or fallback
          const frontendUrl = process.env.FRONTEND_URL || 'https://roomify-v2-frontend-xv85.vercel.app';
          const feedbackUrl = `${frontendUrl}/requester/feedback?bookingId=${booking._id}`;

          console.log(`Sending feedback request for booking ${booking._id} - ended at ${bookingEndWithBuffer}`);

          await sendFeedbackRequestEmail(
            booking.userId.email,
            booking.userId.name,
            {
              roomName: booking.roomId.name,
              date: new Date(booking.date).toLocaleDateString(),
              startTime: booking.startTime,
              endTime: booking.endTime,
              purpose: booking.purpose,
              bookingId: booking.bookingId,
              feedbackUrl
            }
          );

          // Record that we sent the feedback request so the next cron tick won't resend.
          await Notification.create({
            userId: booking.userId._id,
            bookingId: booking._id,
            type: 'feedback_request',
            title: 'Feedback Request',
            message: `Feedback request sent for ${booking.roomId.name} on ${new Date(booking.date).toLocaleDateString()}`
          });

          console.log(`Feedback request email sent for booking ${booking._id}`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking completed bookings:', error);
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
  // Check upcoming bookings every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await checkUpcomingBookings();
  });

  // Check for completed bookings every 10 minutes to send feedback emails
  cron.schedule('*/10 * * * *', async () => {
    await checkCompletedBookingsAndSendFeedbackEmail();
  });

  console.log('Notification scheduler started - checks every 5 minutes for upcoming bookings, every 10 minutes for completed bookings');
};

module.exports = { startNotificationScheduler };
