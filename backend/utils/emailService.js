const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP) or Gmail
  // For production, use a real SMTP service like SendGrid, AWS SES, etc.

  if (process.env.EMAIL_HOST === 'ethereal') {
    // Ethereal Email - perfect for development
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Gmail or other SMTP
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  bookingCreated: (data) => ({
    subject: `📚 Booking Request Submitted - ${data.roomName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Request Submitted</h2>
        <p>Hello ${data.userName},</p>
        <p>Your booking request has been <strong>submitted successfully</strong> and is pending approval.</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking Details:</strong></p>
          <p>📍 <strong>Room:</strong> ${data.roomName}</p>
          <p>📅 <strong>Date:</strong> ${data.date}</p>
          <p>🕐 <strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          <p>📝 <strong>Purpose:</strong> ${data.purpose}</p>
          <p>🎫 <strong>Booking ID:</strong> ${data.bookingId}</p>
        </div>

        <p>You will receive an email notification once your booking is approved or rejected.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">Roomify - College Room Booking System</p>
      </div>
    `
  }),

  bookingApproved: (data) => ({
    subject: `✅ Booking Approved - ${data.roomName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎉 Booking Approved!</h2>
        <p>Hello ${data.userName},</p>
        <p>Great news! Your booking request has been <strong>approved</strong>.</p>

        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking Details:</strong></p>
          <p>📍 <strong>Room:</strong> ${data.roomName}</p>
          <p>📅 <strong>Date:</strong> ${data.date}</p>
          <p>🕐 <strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          <p>📝 <strong>Purpose:</strong> ${data.purpose}</p>
          <p>🎫 <strong>Booking ID:</strong> ${data.bookingId}</p>
        </div>

        <p>Please arrive on time. If you need to cancel, do so at least 1 hour before the booking time.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">Roomify - College Room Booking System</p>
      </div>
    `
  }),

  bookingRejected: (data) => ({
    subject: `❌ Booking Rejected - ${data.roomName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Booking Rejected</h2>
        <p>Hello ${data.userName},</p>
        <p>Unfortunately, your booking request has been <strong>rejected</strong>.</p>

        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Rejected Booking:</strong></p>
          <p>📍 <strong>Room:</strong> ${data.roomName}</p>
          <p>📅 <strong>Date:</strong> ${data.date}</p>
          <p>🕐 <strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          <p>📝 <strong>Purpose:</strong> ${data.purpose}</p>
          <p>🎫 <strong>Booking ID:</strong> ${data.bookingId}</p>
          ${data.remarks ? `<p style="color: #dc2626;"><strong>Reason:</strong> ${data.remarks}</p>` : ''}
        </div>

        <p>Please contact the administrator for more details or submit a new booking request.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">Roomify - College Room Booking System</p>
      </div>
    `
  }),

  bookingReminder: (data) => ({
    subject: `⏰ Reminder: Your booking starts in 1 hour - ${data.roomName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">⏰ Booking Reminder</h2>
        <p>Hello ${data.userName},</p>
        <p>This is a friendly reminder that your booking starts in <strong>1 hour</strong>.</p>

        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Upcoming Booking:</strong></p>
          <p>📍 <strong>Room:</strong> ${data.roomName}</p>
          <p>📅 <strong>Date:</strong> ${data.date}</p>
          <p>🕐 <strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          <p>📝 <strong>Purpose:</strong> ${data.purpose}</p>
        </div>

        <p>Please make your way to the room. See you soon!</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">Roomify - College Room Booking System</p>
      </div>
    `
  })
};

// Main send email function
const sendEmail = async (to, templateName, data) => {
  try {
    // Skip if no email configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`📧 Email skipped (not configured): ${templateName} to ${to}`);
      return { success: false, reason: 'Email not configured' };
    }

    const transporter = createTransporter();
    const template = emailTemplates[templateName](data);

    const info = await transporter.sendMail({
      from: `"Roomify System" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: template.subject,
      html: template.html
    });

    console.log(`📧 Email sent: ${templateName} to ${to}`);

    // For ethereal, log the preview URL
    if (process.env.EMAIL_HOST === 'ethereal' && info.messageId) {
      console.log(`   Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`📧 Email failed: ${templateName} to ${to}`, error.message);
    return { success: false, error: error.message };
  }
};

// Convenience functions
const sendBookingCreatedEmail = (userEmail, userName, bookingData) => {
  return sendEmail(userEmail, 'bookingCreated', {
    userName,
    ...bookingData
  });
};

const sendBookingApprovedEmail = (userEmail, userName, bookingData) => {
  return sendEmail(userEmail, 'bookingApproved', {
    userName,
    ...bookingData
  });
};

const sendBookingRejectedEmail = (userEmail, userName, bookingData) => {
  return sendEmail(userEmail, 'bookingRejected', {
    userName,
    ...bookingData
  });
};

const sendBookingReminderEmail = (userEmail, userName, bookingData) => {
  return sendEmail(userEmail, 'bookingReminder', {
    userName,
    ...bookingData
  });
};

module.exports = {
  sendEmail,
  sendBookingCreatedEmail,
  sendBookingApprovedEmail,
  sendBookingRejectedEmail,
  sendBookingReminderEmail
};