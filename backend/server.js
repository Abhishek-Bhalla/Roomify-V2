/* eslint-disable no-undef */

const dotenv = require('dotenv');
const connectDB = require('./config/db.js');
const app = require('./app.js');
const { startNotificationScheduler } = require('./scheduler/notifications');
dotenv.config();
connectDB().then(async () => {
  const Booking = require('./models/Booking');
  await Booking.initializeCounter();
  const PORT = process.env.PORT || 5000;
  // Railway/Render require binding to 0.0.0.0
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    startNotificationScheduler();
  });
});