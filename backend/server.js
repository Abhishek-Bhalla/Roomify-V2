/* eslint-disable no-undef */

const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db.js');
const app = require('./app.js');
const { startNotificationScheduler } = require('./scheduler/notifications');
dotenv.config();

// Ensure the uploads directory exists at boot so the first upload request
// (and the express.static mount above) never fail with ENOENT. On Railway the
// container filesystem is ephemeral, but mkdirSync is cheap and idempotent.
fs.mkdirSync(path.join(process.cwd(), 'uploads', 'avatars'), { recursive: true });

connectDB().then(async () => {
  const Booking = require('./models/Booking');
  const Maintenance = require('./models/Maintenance');
  await Booking.initializeCounter();
  await Maintenance.initializeCounter();
  const PORT = process.env.PORT || 5000;
  // Railway/Render require binding to 0.0.0.0
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    startNotificationScheduler();
  });
});