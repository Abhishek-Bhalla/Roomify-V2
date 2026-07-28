const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Room = require('./models/Room');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Room.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = await User.create([
      {
        name: 'Admin User',
        employeeId: 'EMP001',
        email: 'admin@roomify.com',
        password: 'admin123',
        role: 'admin',
        status: 'active'
      },
      {
        name: 'Approver User',
        employeeId: 'EMP002',
        email: 'approver@roomify.com',
        password: 'approver123',
        role: 'approver',
        status: 'active'
      },
      {
        name: 'Requester One',
        employeeId: 'EMP003',
        email: 'requester1@roomify.com',
        password: 'requester123',
        role: 'requester',
        status: 'active'
      },
      {
        name: 'Requester Two',
        employeeId: 'EMP004',
        email: 'requester2@roomify.com',
        password: 'requester123',
        role: 'requester',
        status: 'active'
      }
    ]);
    console.log('Created users:', users.map(u => u.email).join(', '));

    // Create rooms
    const rooms = await Room.create([
      {
        name: 'Conference Room A',
        capacity: 20,
        facilities: ['Projector', 'Whiteboard', 'AC', 'Video Conference', 'Extension Sockets'],
        location: 'Building A, Floor 2',
        status: 'available'
      },
      {
        name: 'Computer Lab 101',
        capacity: 30,
        facilities: ['Computers', 'Projector', 'AC', 'Internet', 'Extension Sockets'],
        location: 'Building B, Floor 1',
        status: 'available'
      },
      {
        name: 'Meeting Room B',
        capacity: 10,
        facilities: ['TV Screen', 'Whiteboard', 'AC', 'Extension Sockets'],
        location: 'Building A, Floor 3',
        status: 'available'
      },
      {
        name: 'Seminar Hall',
        capacity: 100,
        facilities: ['Projector', 'Microphone', 'AC', 'Stage', 'Sound System', 'Extension Sockets'],
        location: 'Main Building, Floor 1',
        status: 'available'
      },
      {
        name: 'Research Lab 205',
        capacity: 15,
        facilities: ['Lab Equipment', 'Computers', 'AC', 'Internet', 'Extension Sockets'],
        location: 'Building C, Floor 2',
        status: 'available'
      },
      {
        name: 'Training Room',
        capacity: 25,
        facilities: ['Projector', 'Computers', 'AC', 'Whiteboard', 'Extension Sockets'],
        location: 'Building B, Floor 2',
        status: 'maintenance'
      }
    ]);
    console.log('Created rooms:', rooms.map(r => r.name).join(', '));

    console.log('\nSeed completed successfully!');
    console.log('\nDemo Credentials:');
    console.log('Admin: admin@roomify.com / admin123');
    console.log('Approver: approver@roomify.com / approver123');
    console.log('Requester 1: requester1@roomify.com / requester123');
    console.log('Requester 2: requester2@roomify.com / requester123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
