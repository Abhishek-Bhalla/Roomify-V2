const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key if available
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Lazy-initialized Gmail SMTP transporter (kept alive across sends on the same Railway instance).
let smtpTransporter = null;
const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;
  // Port 587 + STARTTLS is the path that consistently works from Railway egress IPs.
  // Port 465 sometimes times out depending on the Railway gateway, even though it's listed as supported.
  const port = Number(process.env.EMAIL_PORT) || 587;
  smtpTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port,
    secure: port === 465,       // 465 = implicit TLS, 587 = STARTTLS (both encrypted either way)
    requireTLS: port === 587,   // upgrade STARTTLS so we still get TLS on port 587
    pool: true,                 // reuse connections so cron-triggered sends are fast
    maxConnections: 3,
    family: 4,                  // Railway's NAT has no IPv6 outbound — force IPv4 to Google's SMTP
    connectionTimeout: 20000,   // 20s — fail fast instead of hanging the cron for 5+ min
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: {
      // Don't fail just because the cert chain looks unusual on some gateway IPs
      rejectUnauthorized: true
    },
    auth: {
      user: (process.env.EMAIL_USER || '').trim(),
      pass: (process.env.EMAIL_PASS || '').trim()
    }
  });
  return smtpTransporter;
};

// Send email using Gmail SMTP (primary on Railway) or SendGrid API (fallback).
const sendEmail = async (to, templateName, data) => {
  try {
    // Skip if no email configured at all
    const hasSmtp = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    const hasSendGrid = !!process.env.SENDGRID_API_KEY;
    if (!hasSmtp && !hasSendGrid) {
      console.log(`📧 Email skipped (not configured): ${templateName} to ${to}`);
      return { success: false, reason: 'Email not configured' };
    }

    const template = emailTemplates[templateName](data);

    // Primary: Gmail SMTP (works on Railway; SendGrid was unreliable/timing-out there).
    if (hasSmtp) {
      const info = await getSmtpTransporter().sendMail({
        from: `"Roomify System" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: template.subject,
        html: template.html
      });
      console.log(`📧 Email sent via Gmail SMTP: ${templateName} to ${to} (id=${info.messageId})`);
      return { success: true, messageId: info.messageId };
    }

    // Fallback: SendGrid API
    const msg = {
      to: to,
      from: process.env.EMAIL_USER || 'noreply@roomify.com',
      subject: template.subject,
      html: template.html
    };
    await sgMail.send(msg);
    console.log(`📧 Email sent via SendGrid: ${templateName} to ${to}`);
    return { success: true };
  } catch (error) {
    console.error(`📧 Email failed: ${templateName} to ${to}`, error.message);
    return { success: false, error: error.message };
  }
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
  }),

  bookingRequestForApproval: (data) => ({
    subject: `📋 New Booking Request - ${data.roomName} - ${data.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">📋 New Booking Request</h2>
        <p>Hello ${data.approverName},</p>
        <p>A new booking request requires your <strong>approval</strong>.</p>

        <div style="background: #eef2ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking Details:</strong></p>
          <p>🎫 <strong>Booking ID:</strong> ${data.bookingId}</p>
          <p>📍 <strong>Room:</strong> ${data.roomName}</p>
          <p>📅 <strong>Date:</strong> ${data.date}</p>
          <p>🕐 <strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          <p>📝 <strong>Purpose:</strong> ${data.purpose}</p>
          <p>👤 <strong>Requested By:</strong> ${data.requesterName} (${data.requesterEmail})</p>
        </div>

        <p>Please login to the Roomify system to approve or reject this request.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">Roomify - College Room Booking System</p>
      </div>
    `
  }),

  feedbackRequest: (data) => ({
    subject: `📝 Share your feedback for your recent ${data.roomName} booking`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">📝 We Value Your Feedback!</h2>
        <p>Hello ${data.userName},</p>
        <p>Your booking for <strong>${data.roomName}</strong> has been completed.</p>
        <p>We'd appreciate your feedback to help us improve our service.</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Booking Details:</strong></p>
          <p>📍 <strong>Room:</strong> ${data.roomName}</p>
          <p>📅 <strong>Date:</strong> ${data.date}</p>
          <p>🕐 <strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>
          <p>📝 <strong>Purpose:</strong> ${data.purpose}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="margin-bottom: 15px; font-size: 16px;"><strong>Rate your experience:</strong></p>
          <div style="font-size: 32px; color: #fbbf24;">
            ★★★★★
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.feedbackUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Give Feedback</a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">It only takes a minute! Your feedback helps us serve you better.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">Roomify - College Room Booking System</p>
      </div>
    `
  })
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

const sendBookingRequestForApprovalEmail = (approverEmail, approverName, bookingData) => {
  return sendEmail(approverEmail, 'bookingRequestForApproval', {
    approverName,
    ...bookingData
  });
};

const sendFeedbackRequestEmail = (userEmail, userName, bookingData) => {
  return sendEmail(userEmail, 'feedbackRequest', {
    userName,
    ...bookingData
  });
};

module.exports = {
  sendEmail,
  sendBookingCreatedEmail,
  sendBookingApprovedEmail,
  sendBookingRejectedEmail,
  sendBookingReminderEmail,
  sendBookingRequestForApprovalEmail,
  sendFeedbackRequestEmail
};
