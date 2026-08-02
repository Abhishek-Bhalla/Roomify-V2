const { body, param } = require('express-validator');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getAllRooms = async (req, res, next) => {
  try {
    const { status, minCapacity, includeMaintenance } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (minCapacity) filter.capacity = { $gte: parseInt(minCapacity) };
    // By default, hide rooms currently in any maintenance lifecycle
    // (admin/approver views can opt-in with ?includeMaintenance=true)
    if (!includeMaintenance || includeMaintenance !== 'true') {
      filter.maintenanceStatus = 'none';
    }

    const rooms = await Room.find(filter).sort({ createdAt: -1 });
    return successResponse(res, { rooms }, 'Rooms retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// Generate abbreviation from floor name
const getFloorAbbreviation = (floor) => {
  if (!floor) return '';
  const floorLower = floor.toLowerCase();

  // Common floor mappings
  const floorMappings = {
    'ground floor': 'GF',
    'first floor': 'FF',
    'second floor': 'SF',
    'third floor': 'TF',
    'fourth floor': '4F',
    'fifth floor': '5F',
    'sixth floor': '6F',
    'seventh floor': '7F',
    'ground': 'GF',
    'first': 'FF',
    'second': 'SF',
    'third': 'TF',
    'fourth': '4F',
    'fifth': '5F',
    'sixth': '6F',
    'seventh': '7F',
  };

  // Check for exact match
  if (floorMappings[floorLower]) {
    return floorMappings[floorLower];
  }

  // Check if starts with a number
  if (/^\d/.test(floor)) {
    return floor.charAt(0) + 'F';
  }

  // Default: take first 2 characters
  return floor.substring(0, 2).toUpperCase();
};

// Generate room ID: BuildingInitial-FloorAbbreviation-RoomCode
const generateRoomId = (building, floor, roomCode) => {
  const buildingInitial = building ? building.charAt(0).toUpperCase() : 'B';
  const floorAbbr = getFloorAbbreviation(floor);
  const code = roomCode || '';

  return `${buildingInitial}${floorAbbr}${code}`;
};

const createRoom = async (req, res, next) => {
  try {
    const { name, capacity, facilities, building, floor, roomCode } = req.body;

    if (!building || !floor || !roomCode) {
      return errorResponse(res, 'Building, Floor, and Room Code are required', 400);
    }

    const generatedRoomId = generateRoomId(building, floor, roomCode);

    const existingRoom = await Room.findOne({ roomId: generatedRoomId });
    if (existingRoom) {
      return errorResponse(res, `Room ID ${generatedRoomId} already exists. Please use a different room code.`, 400);
    }

    const existingRoomName = await Room.findOne({ name });
    if (existingRoomName) {
      return errorResponse(res, 'Room name already exists', 400);
    }

    const room = await Room.create({
      roomId: generatedRoomId,
      name,
      capacity,
      facilities: facilities || [],
      building,
      floor,
      roomCode
    });

    return successResponse(res, { room }, 'Room created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, capacity, facilities, building, floor, roomCode, status } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return errorResponse(res, 'Room not found', 404);
    }

    // Generate new roomId if building, floor, or roomCode changed
    if (building || floor || roomCode) {
      const newBuilding = building || room.building;
      const newFloor = floor || room.floor;
      const newRoomCode = roomCode || room.roomCode;
      const newRoomId = generateRoomId(newBuilding, newFloor, newRoomCode);

      if (newRoomId !== room.roomId) {
        const existingRoom = await Room.findOne({ roomId: newRoomId });
        if (existingRoom) {
          return errorResponse(res, `Room ID ${newRoomId} already exists`, 400);
        }
        room.roomId = newRoomId;
      }
    }

    if (name && name !== room.name) {
      const existingRoom = await Room.findOne({ name });
      if (existingRoom) {
        return errorResponse(res, 'Room name already in use', 400);
      }
    }

    if (name) room.name = name;
    if (capacity) room.capacity = capacity;
    if (facilities) room.facilities = facilities;
    if (building !== undefined) room.building = building;
    if (floor !== undefined) room.floor = floor;
    if (roomCode !== undefined) room.roomCode = roomCode;
    if (status) room.status = status;

    await room.save();

    return successResponse(res, { room }, 'Room updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;

    const room = await Room.findByIdAndDelete(id);
    if (!room) {
      return errorResponse(res, 'Room not found', 404);
    }

    return successResponse(res, null, 'Room deleted successfully');
  } catch (error) {
    next(error);
  }
};

const toggleRoomStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return errorResponse(res, 'Room not found', 404);
    }

    if (!['available', 'maintenance'].includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    room.status = status;
    await room.save();

    return successResponse(res, { room }, `Room status changed to ${status}`);
  } catch (error) {
    next(error);
  }
};

const checkAffectedBookings = async (req, res, next) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);
    if (!room) {
      return errorResponse(res, 'Room not found', 404);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const affectedBookings = await Booking.find({
      roomId: id,
      date: { $gte: today },
      status: { $in: ['approved', 'pending'] }
    }).populate('userId', 'name email employeeId');

    const availableRooms = await Room.find({
      _id: { $ne: id },
      status: 'available',
      maintenanceStatus: 'none',
      capacity: { $gte: room.capacity }
    }).sort({ capacity: 1 });

    return successResponse(res, {
      room,
      affectedBookings,
      alternativeRooms: availableRooms
    }, 'Affected bookings checked');
  } catch (error) {
    next(error);
  }
};

const relocateBookings = async (req, res, next) => {
  try {
    const { id } = req.params; // current room (going to maintenance)
    const { targetRoomId, bookingIds } = req.body;

    const currentRoom = await Room.findById(id);
    if (!currentRoom) {
      return errorResponse(res, 'Source room not found', 404);
    }

    const targetRoom = await Room.findById(targetRoomId);
    if (!targetRoom) {
      return errorResponse(res, 'Target room not found', 404);
    }

    if (targetRoom.status !== 'available' || targetRoom.maintenanceStatus !== 'none') {
      return errorResponse(res, 'Target room must be available and not under maintenance', 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find bookings to relocate (only future bookings that are approved/pending)
    const query = {
      roomId: id,
      date: { $gte: today },
      status: { $in: ['approved', 'pending'] }
    };

    if (bookingIds && bookingIds.length > 0) {
      query._id = { $in: bookingIds };
    }

    const bookingsToRelocate = await Booking.find(query);

    if (bookingsToRelocate.length === 0) {
      return errorResponse(res, 'No bookings found to relocate', 404);
    }

    // Check capacity for approved bookings
    for (const booking of bookingsToRelocate) {
      if (booking.status === 'approved') {
        const conflicting = await Booking.findOne({
          roomId: targetRoomId,
          _id: { $ne: booking._id },
          date: booking.date,
          status: 'approved',
          $or: [
            { startTime: { $lt: booking.endTime }, endTime: { $gt: booking.startTime } }
          ]
        });
        if (conflicting) {
          return errorResponse(res, `Booking ${booking.bookingId} conflicts with existing booking in target room`, 400);
        }
      }
    }

    // Relocate bookings
    const updatedBookings = [];
    for (const booking of bookingsToRelocate) {
      booking.roomId = targetRoomId;
      booking.remarks = booking.remarks
        ? `${booking.remarks}\n[Relocated from ${currentRoom.name} to ${targetRoom.name} on ${new Date().toLocaleDateString()}]`
        : `[Relocated from ${currentRoom.name} to ${targetRoom.name} on ${new Date().toLocaleDateString()}]`;
      await booking.save();
      updatedBookings.push(booking);
    }

    return successResponse(res, {
      relocatedCount: updatedBookings.length,
      bookings: updatedBookings
    }, `${updatedBookings.length} bookings relocated to ${targetRoom.name}`);
  } catch (error) {
    next(error);
  }
};

const createRoomValidation = [
  body('name').trim().notEmpty().withMessage('Room name is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('building').trim().notEmpty().withMessage('Building is required'),
  body('floor').trim().notEmpty().withMessage('Floor is required'),
  body('roomCode').trim().notEmpty().withMessage('Room code is required'),
  body('facilities').optional().isArray().withMessage('Facilities must be an array')
];

const updateRoomValidation = [
  body('name').optional().trim().notEmpty().withMessage('Room name cannot be empty'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('facilities').optional().isArray().withMessage('Facilities must be an array'),
  body('status').optional().isIn(['available', 'maintenance', 'under_maintenance', 'maintenance_assigned', 'maintenance_in_progress', 'maintenance_review_pending']).withMessage('Invalid status')
];

const roomIdValidation = [
  param('id').isMongoId().withMessage('Invalid room ID')
];

module.exports = {
  getAllRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  toggleRoomStatus,
  checkAffectedBookings,
  relocateBookings,
  createRoomValidation,
  updateRoomValidation,
  roomIdValidation
};