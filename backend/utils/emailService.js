const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { Resend } = require('resend');

// Initialize API providers at startup so misconfig surfaces early.
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Lazy-initialized SMTP transporter (kept alive across sends on the same Railway instance).
// Used for both Brevo and Gmail — pick based on which env vars are set.
let smtpTransporter = null;
const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;

  const hasBrevo = !!(process.env.BREVO_USER && process.env.BREVO_PASS);
  // host + auth.user/pass: where we AUTH to send. Different from the From address.
  const host = hasBrevo
    ? (process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com')
    : 'smtp.gmail.com';
  const user = hasBrevo ? process.env.BREVO_USER : process.env.EMAIL_USER;
  const pass = hasBrevo ? process.env.BREVO_PASS : process.env.EMAIL_PASS;
  // Brevo defaults to 587 (STARTTLS). Gmail fallback defaults to 587 too —
  // 465 sometimes times out from Railway egress IPs.
  const port = Number(process.env.EMAIL_PORT) || 587;

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    pool: true,
    maxConnections: 3,
    family: 4,                  // Railway's NAT has no IPv6 outbound — force IPv4
    connectionTimeout: 20000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
    tls: { rejectUnauthorized: true },
    auth: {
      user: (user || '').trim(),
      pass: (pass || '').trim()
    }
  });
  return smtpTransporter;
};

// Resolve the visible "From" address: explicit override > Brevo/Gmail user > fallback.
// If using Resend (HTTPS provider), unverified external domains like gmail.com
// get rejected with 403, so when no override is set we default to Resend's
// allowed-by-default onboarding sender.
const getFromAddress = () => {
  if (process.env.BREVO_FROM) return process.env.BREVO_FROM.trim();
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM.trim();
  // On Resend, if the configured user is a gmail.com/outlook.com/etc address,
  // Resend will reject it as unverified domain. Route around that by using
  // the onboarding sender unless the user is on a verified custom domain.
  if (process.env.RESEND_API_KEY) {
    const configured = (process.env.BREVO_USER || process.env.EMAIL_USER || '').trim();
    if (!configured || /(@gmail\.com|@googlemail\.com|@yahoo\.com|@outlook\.com|@hotmail\.com|@live\.com)$/i.test(configured)) {
      return 'onboarding@resend.dev';
    }
    return configured;
  }
  return (process.env.BREVO_USER || process.env.EMAIL_USER || 'noreply@roomify.com').trim();
};

// Send email using Resend → SendGrid → Brevo SMTP → Gmail SMTP (in that order).
// HTTPS-based providers run first because they're never blocked by cloud egress rules.
// SMTP fallbacks only kick in if all HTTP providers fail.
const sendEmail = async (to, templateName, data) => {
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSendGrid = !!process.env.SENDGRID_API_KEY;
  const hasBrevo = !!(process.env.BREVO_USER && process.env.BREVO_PASS);
  const hasGmail = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

  if (!hasResend && !hasSendGrid && !hasBrevo && !hasGmail) {
    console.log(`📧 Email skipped (not configured): ${templateName} to ${to}`);
    return { success: false, reason: 'Email not configured' };
  }

  const template = emailTemplates[templateName](data);
  const fromAddress = getFromAddress();
  const displayName = process.env.EMAIL_FROM_NAME || 'Roomify System';
  const fromHeader = `"${displayName}" <${fromAddress}>`;

  // Priority 1: Resend HTTPS API — never blocked by Railway/firewall rules.
  if (hasResend && resend) {
    try {
      const result = await resend.emails.send({
        from: fromHeader,
        to,
        subject: template.subject,
        html: template.html
      });
      const messageId = result?.data?.id || result?.id || 'unknown';
      console.log(`📧 Email sent via Resend: ${templateName} to ${to} from=${fromAddress} (id=${messageId})`);
      return { success: true, messageId };
    } catch (error) {
      console.error(`📧 Resend failed: ${error.message} — falling through`);
    }
  }

  // Priority 2: SendGrid HTTPS API.
  if (hasSendGrid) {
    try {
      const msg = {
        to,
        from: fromAddress,
        subject: template.subject,
        html: template.html
      };
      const [resp] = await sgMail.send(msg);
      console.log(`📧 Email sent via SendGrid: ${templateName} to ${to} (status=${resp.statusCode})`);
      return { success: true, messageId: resp.headers['x-message-id'] };
    } catch (error) {
      const status = error.code || error.response?.statusCode;
      const isFallbackable = [401, 403, 429].includes(status) ||
        (error.response && error.response.body &&
         /credit|quota|exceeded|revoked|denied/i.test(JSON.stringify(error.response.body)));
      console.error(`📧 SendGrid failed (${status || 'unknown'}): ${error.message} — ${isFallbackable ? 'falling through' : 'giving up'}`);
      if (!isFallbackable) {
        return { success: false, error: error.message };
      }
    }
  }

  // Priority 3: Brevo SMTP.
  if (hasBrevo) {
    try {
      const info = await getSmtpTransporter().sendMail({
        from: fromHeader,
        to,
        subject: template.subject,
        html: template.html
      });
      console.log(`📧 Email sent via Brevo SMTP: ${templateName} to ${to} from=${fromAddress} (id=${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`📧 Brevo SMTP failed: ${error.message} — trying Gmail`);
    }
  }

  // Priority 4: Gmail SMTP — last resort.
  if (hasGmail) {
    const info = await getSmtpTransporter().sendMail({
      from: fromHeader,
      to,
      subject: template.subject,
      html: template.html
    });
    console.log(`📧 Email sent via Gmail SMTP: ${templateName} to ${to} from=${fromAddress} (id=${info.messageId})`);
    return { success: true, messageId: info.messageId };
  }

  return { success: false, error: 'All providers failed' };
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
