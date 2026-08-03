const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const bulkUploadRoutes = require('./routes/bulkUploadRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded avatars (and other uploads) as static files.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bulk-upload', bulkUploadRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/maintenance', maintenanceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: true, message: 'CampusSpace Backend API is running' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  // Map multer errors to clean 4xx responses.
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File too large. Maximum size is 5 MB.';
  } else if (err.code === 'INVALID_FILE_TYPE' || status === 400) {
    status = 400;
  }

  res.status(status).json({
    success: false,
    message,
  });
});

module.exports = app;