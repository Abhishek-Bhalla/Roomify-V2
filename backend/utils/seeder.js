require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

// Generate room ID: BuildingInitial-FloorAbbreviation-RoomCode
const generateRoomId = (building, floor, roomCode) => {
  const buildingInitial = building ? building.charAt(0).toUpperCase() : 'B';
  const floorLower = floor.toLowerCase();

  const floorMappings = {
    'ground floor': 'GF', 'first floor': 'FF', 'second floor': 'SF', 'third floor': 'TF',
    'ground': 'GF', 'first': 'FF', 'second': 'SF', 'third': 'TF'
  };
  let floorAbbr = floorMappings[floorLower] || (floor.length <= 2 ? floor.toUpperCase() : floor.substring(0, 2).toUpperCase());
  if (/^\d/.test(floor)) {
    floorAbbr = floor.charAt(0) + 'F';
  }

  return `${buildingInitial}${floorAbbr}${roomCode}`;
};

// Generate booking ID
const generateBookingId = (num) => {
  return `BK-${String(num).padStart(5, '0')}`;
};

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Room.deleteMany({});
    await Booking.deleteMany({});
    console.log('Cleared existing data');

    // Create Users
    const users = await User.create([
      { employeeId: 'EMP001', name: 'Admin User', email: 'admin@roomify.com', password: 'admin123', role: 'admin', status: 'active' },
      { employeeId: 'EMP002', name: 'Approver User', email: 'approver@roomify.com', password: 'approver123', role: 'approver', status: 'active' },
      { employeeId: 'EMP003', name: 'Requester User', email: 'requester@roomify.com', password: 'requester123', role: 'requester', status: 'active' },
      { employeeId: 'EMP004', name: 'John Smith', email: 'john@roomify.com', password: 'john123', role: 'requester', status: 'active' },
      { employeeId: 'EMP005', name: 'Sarah Johnson', email: 'sarah@roomify.com', password: 'sarah123', role: 'requester', status: 'active' },
      { employeeId: 'EMP006', name: 'Mike Wilson', email: 'mike@roomify.com', password: 'mike123', role: 'requester', status: 'active' },
      { employeeId: 'EMP007', name: 'Emily Brown', email: 'emily@roomify.com', password: 'emily123', role: 'requester', status: 'active' }
    ]);
    console.log('Users created:', users.length);

    // Create Rooms
    const roomsData = [
      { name: 'Computer Lab 101', building: 'A', floor: 'First Floor', roomCode: '101', capacity: 30, facilities: ['Projector', 'AC', 'Computers', 'Extension Sockets'], status: 'available' },
      { name: 'Computer Lab 102', building: 'A', floor: 'First Floor', roomCode: '102', capacity: 60, facilities: ['Projector', 'AC', 'Computers', 'Extension Sockets'], status: 'available' },
      { name: 'Conference Room A', building: 'A', floor: 'Second Floor', roomCode: '201', capacity: 30, facilities: ['Projector', 'Video Conferencing', 'AC', 'Extension Sockets'], status: 'available' },
      { name: 'Conference Room B', building: 'A', floor: 'Second Floor', roomCode: '202', capacity: 40, facilities: ['Projector', 'AC', 'Whiteboard', 'Extension Sockets'], status: 'available' },
      { name: 'Research Lab 205', building: 'B', floor: 'Second Floor', roomCode: '205', capacity: 30, facilities: ['Lab Equipment', 'AC', 'Extension Sockets'], status: 'available' },
      { name: 'Research Lab 206', building: 'B', floor: 'Second Floor', roomCode: '206', capacity: 30, facilities: ['Lab Equipment', 'AC', 'Computers', 'Extension Sockets'], status: 'available' },
      { name: 'Seminar Hall', building: 'A', floor: 'Ground Floor', roomCode: 'G01', capacity: 120, facilities: ['Projector', 'Audio System', 'AC', 'Extension Sockets'], status: 'available' },
      { name: 'Seminar Hall 2', building: 'A', floor: 'Ground Floor', roomCode: 'G02', capacity: 80, facilities: ['Projector', 'Audio System', 'AC', 'Extension Sockets'], status: 'available' },
      { name: 'Study Room 301', building: 'A', floor: 'Third Floor', roomCode: '301', capacity: 10, facilities: ['Whiteboard', 'AC', 'Extension Sockets'], status: 'available' },
      { name: 'Study Room 302', building: 'A', floor: 'Third Floor', roomCode: '302', capacity: 8, facilities: ['Whiteboard', 'AC', 'Extension Sockets'], status: 'available' }
    ];

    const rooms = await Room.create(
      roomsData.map(room => ({
        ...room,
        roomId: generateRoomId(room.building, room.floor, room.roomCode)
      }))
    );
    console.log('Rooms created:', rooms.length);

    // Create Bookings (use dates relative to today for variety)
    const today = new Date();
    const addDays = (days) => {
      const d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const bookings = await Booking.create([
      // Pending bookings
      {
        bookingId: generateBookingId(1),
        userId: users[3]._id, // John
        roomId: rooms[0]._id, // Computer Lab 101
        date: new Date(addDays(1) + 'T12:00:00.000'),
        startTime: '09:00',
        endTime: '11:00',
        purpose: 'Java Programming Class',
        status: 'pending'
      },
      {
        bookingId: generateBookingId(2),
        userId: users[4]._id, // Sarah
        roomId: rooms[2]._id, // Conference Room A
        date: new Date(addDays(2) + 'T12:00:00.000'),
        startTime: '14:00',
        endTime: '16:00',
        purpose: 'Team Meeting with Client',
        status: 'pending'
      },
      {
        bookingId: generateBookingId(3),
        userId: users[5]._id, // Mike
        roomId: rooms[6]._id, // Seminar Hall
        date: new Date(addDays(3) + 'T12:00:00.000'),
        startTime: '10:00',
        endTime: '12:00',
        purpose: 'Guest Lecture on AI',
        status: 'pending'
      },
      {
        bookingId: generateBookingId(4),
        userId: users[6]._id, // Emily
        roomId: rooms[8]._id, // Study Room 301
        date: new Date(addDays(1) + 'T12:00:00.000'),
        startTime: '13:00',
        endTime: '15:00',
        purpose: 'Group Study Session',
        status: 'pending'
      },
      // Approved bookings
      {
        bookingId: generateBookingId(5),
        userId: users[2]._id, // Requester User
        roomId: rooms[4]._id, // Research Lab 205
        date: new Date(addDays(-1) + 'T12:00:00.000'),
        startTime: '09:00',
        endTime: '12:00',
        purpose: 'Chemistry Lab Experiment',
        status: 'approved'
      },
      {
        bookingId: generateBookingId(6),
        userId: users[3]._id, // John
        roomId: rooms[1]._id, // Computer Lab 102
        date: new Date(addDays(-2) + 'T12:00:00.000'),
        startTime: '14:00',
        endTime: '17:00',
        purpose: 'Python Workshop',
        status: 'approved'
      },
      {
        bookingId: generateBookingId(7),
        userId: users[4]._id, // Sarah
        roomId: rooms[3]._id, // Conference Room B
        date: new Date(addDays(-3) + 'T12:00:00.000'),
        startTime: '10:00',
        endTime: '11:30',
        purpose: 'Project Presentation',
        status: 'approved'
      },
      // Rejected bookings
      {
        bookingId: generateBookingId(8),
        userId: users[5]._id, // Mike
        roomId: rooms[0]._id, // Computer Lab 101
        date: new Date(addDays(-5) + 'T12:00:00.000'),
        startTime: '09:00',
        endTime: '12:00',
        purpose: 'Exam Practice',
        status: 'rejected',
        remarks: 'Room under maintenance'
      },
      {
        bookingId: generateBookingId(9),
        userId: users[6]._id, // Emily
        roomId: rooms[6]._id, // Seminar Hall
        date: new Date(addDays(-4) + 'T12:00:00.000'),
        startTime: '15:00',
        endTime: '17:00',
        purpose: 'Cultural Event',
        status: 'rejected',
        remarks: 'Conflicting university event'
      }
    ]);
    console.log('Bookings created:', bookings.length);

    console.log('\n--- Demo Credentials ---');
    console.log('Admin: admin@roomify.com / admin123');
    console.log('Approver: approver@roomify.com / approver123');
    console.log('Requester: requester@roomify.com / requester123');
    console.log('John: john@roomify.com / john123');
    console.log('Sarah: sarah@roomify.com / sarah123');
    console.log('Mike: mike@roomify.com / mike123');
    console.log('Emily: emily@roomify.com / emily123');

    console.log('\n--- Room IDs ---');
    rooms.forEach(room => {
      console.log(`${room.name}: ${room.roomId}`);
    });

    console.log('\n--- Booking IDs ---');
    bookings.forEach(booking => {
      console.log(`${booking.bookingId} (${booking.status})`);
    });

    await mongoose.disconnect();
    console.log('\nDatabase seeded successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();