const { body, param } = require('express-validator');
const Maintenance = require('../models/Maintenance');
const Room = require('../models/Room');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { createNotification } = require('./notificationController');

// Maintenance lifecycle states that block booking/maintenance. Legacy
// rooms (created before the maintenanceStatus field) are treated as
// 'none' (i.e. not in any maintenance state).
const MAINTENANCE_ACTIVE = ['under_maintenance', 'maintenance_assigned', 'in_progress', 'review_pending'];

// Helper: append an audit log entry atomically.
const addAuditLog = async (maintenanceId, action, byUser, note = '') => {
  await Maintenance.findByIdAndUpdate(maintenanceId, {
    $push: {
      auditLog: { action, byUser, at: new Date(), note }
    }
  });
};

// Helper: find the next active Maintenance Incharge (round-robin by oldest assignment).
const pickMaintenanceIncharge = async () => {
  const incharges = await User.find({ role: 'maintenance', status: 'active' }).sort({ createdAt: 1 });
  if (incharges.length === 0) return null;
  // Count active tasks per Incharge; pick the one with the fewest active tasks.
  const counts = await Promise.all(incharges.map(async (u) => {
    const count = await Maintenance.countDocuments({
      assignedTo: u._id,
      status: { $in: ['assigned', 'in_progress', 'waiting_for_parts', 'review_pending', 'additional_work_required'] }
    });
    return { user: u, count };
  }));
  counts.sort((a, b) => a.count - b.count || a.user.createdAt - b.user.createdAt);
  return counts[0].user;
};

// POST /api/maintenance  (approver) — mark room under maintenance
const createMaintenance = async (req, res, next) => {
  try {
    const { roomId, issueCategory, priority, description, expectedCompletion } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return errorResponse(res, 'Room not found', 404);
    }

    if (MAINTENANCE_ACTIVE.includes(room.maintenanceStatus)) {
      return errorResponse(res, `Room is already in maintenance (${room.maintenanceStatus})`, 400);
    }

    if (req.user.role !== 'approver' && req.user.role !== 'admin') {
      return errorResponse(res, 'Only approvers or admins can mark rooms under maintenance', 403);
    }

    // Use the requested assignedTo if provided, otherwise round-robin.
    let assignedToUser = null;
    if (req.body.assignedTo) {
      assignedToUser = await User.findById(req.body.assignedTo);
      if (!assignedToUser || assignedToUser.role !== 'maintenance' || assignedToUser.status !== 'active') {
        return errorResponse(res, 'assignedTo must be an active maintenance user', 400);
      }
    } else {
      assignedToUser = await pickMaintenanceIncharge();
      if (!assignedToUser) {
        return errorResponse(res, 'No active maintenance user available. Create a maintenance user first.', 400);
      }
    }

    const seq = await Maintenance.getNextSequence();
    const maintenanceId = `MT-${String(seq).padStart(5, '0')}`;

    const maintenance = await Maintenance.create({
      maintenanceId,
      roomId,
      assignedTo: assignedToUser._id,
      reportedBy: req.user._id,
      issueCategory,
      priority: priority || 'medium',
      description: description || '',
      expectedCompletion: expectedCompletion || null,
      auditLog: [{
        action: 'created',
        byUser: req.user._id,
        at: new Date(),
        note: `Marked by ${req.user.name} (${req.user.role})`
      }]
    });

    // Update room state
    room.status = 'maintenance_assigned';
    room.maintenanceStatus = 'maintenance_assigned';
    await room.save();

    // Notify the assigned Incharge
    await createNotification(
      assignedToUser._id,
      null,
      'maintenance_assigned',
      'New Maintenance Task Assigned',
      `You have been assigned a ${priority || 'medium'} priority ${issueCategory} issue for ${room.name}.`
    );

    // Notify all admins
    const admins = await User.find({ role: 'admin', status: 'active' });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        null,
        'maintenance_assigned',
        'Maintenance Task Created',
        `${req.user.name} marked ${room.name} under maintenance (${issueCategory}, ${priority || 'medium'}).`
      );
    }

    await maintenance.populate('roomId', 'name roomId building floor');
    await maintenance.populate('assignedTo', 'name email employeeId');
    await maintenance.populate('reportedBy', 'name email');

    return successResponse(res, { maintenance }, 'Maintenance task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// GET /api/maintenance/my-tasks  (maintenance incharge) — tasks assigned to me
const getMyTasks = async (req, res, next) => {
  try {
    if (req.user.role !== 'maintenance' && req.user.role !== 'admin') {
      return errorResponse(res, 'Only maintenance or admin can view their tasks', 403);
    }

    const { status } = req.query;
    const filter = { assignedTo: req.user._id };
    if (status) filter.status = status;

    const tasks = await Maintenance.find(filter)
      .populate('roomId', 'name roomId building floor capacity')
      .populate('reportedBy', 'name email')
      .sort({ priority: 1, createdAt: -1 });

    return successResponse(res, { tasks }, 'Your tasks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/maintenance  (admin) — all tasks with filters
const getAllMaintenance = async (req, res, next) => {
  try {
    const { status, priority, assignedTo, roomId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (roomId) filter.roomId = roomId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Maintenance.find(filter)
        .populate('roomId', 'name roomId building floor')
        .populate('assignedTo', 'name email employeeId')
        .populate('reportedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Maintenance.countDocuments(filter)
    ]);

    return successResponse(res, {
      tasks,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
    }, 'Maintenance tasks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/maintenance/:id  (any role that has access)
const getMaintenanceById = async (req, res, next) => {
  try {
    const task = await Maintenance.findById(req.params.id)
      .populate('roomId', 'name roomId building floor capacity facilities')
      .populate('assignedTo', 'name email employeeId')
      .populate('reportedBy', 'name email')
      .populate('auditLog.byUser', 'name email role');

    if (!task) {
      return errorResponse(res, 'Maintenance task not found', 404);
    }

    return successResponse(res, { task }, 'Maintenance task retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// GET /api/maintenance/room/:roomId  (any) — history for a room
const getRoomMaintenanceHistory = async (req, res, next) => {
  try {
    const tasks = await Maintenance.find({ roomId: req.params.roomId })
      .populate('assignedTo', 'name email employeeId')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, { tasks }, 'Room maintenance history retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/maintenance/:id/accept  (maintenance)
const acceptTask = async (req, res, next) => {
  try {
    if (req.user.role !== 'maintenance' && req.user.role !== 'admin') {
      return errorResponse(res, 'Only maintenance users can accept tasks', 403);
    }

    const task = await Maintenance.findById(req.params.id);
    if (!task) return errorResponse(res, 'Task not found', 404);

    if (task.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'This task is not assigned to you', 403);
    }

    if (task.status !== 'assigned' && task.status !== 'additional_work_required') {
      return errorResponse(res, `Cannot accept task in status ${task.status}`, 400);
    }

    task.status = 'in_progress';
    task.startedAt = new Date();
    await task.save();

    await Room.findByIdAndUpdate(task.roomId, {
      status: 'maintenance_in_progress',
      maintenanceStatus: 'in_progress'
    });

    await addAuditLog(task._id, 'accepted', req.user._id, 'Task accepted by maintenance');

    // Notify approver (who reported) and admin
    await createNotification(
      task.reportedBy,
      null,
      'maintenance_started',
      'Maintenance Started',
      'Maintenance work has started on the room you marked.'
    );
    const admins = await User.find({ role: 'admin', status: 'active' });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        null,
        'maintenance_started',
        'Maintenance Started',
        'Maintenance task status changed to in-progress.'
      );
    }

    return successResponse(res, { task }, 'Task accepted');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/maintenance/:id/status  (maintenance) — update progress
const updateStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'maintenance' && req.user.role !== 'admin') {
      return errorResponse(res, 'Only maintenance users can update status', 403);
    }

    const { status, note } = req.body;
    const allowed = ['in_progress', 'waiting_for_parts', 'review_pending'];
    if (!allowed.includes(status)) {
      return errorResponse(res, `Status must be one of: ${allowed.join(', ')}`, 400);
    }

    const task = await Maintenance.findById(req.params.id);
    if (!task) return errorResponse(res, 'Task not found', 404);

    if (task.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not your task', 403);
    }

    task.status = status;
    if (status === 'review_pending') {
      task.completedAt = new Date();
      await Room.findByIdAndUpdate(task.roomId, {
        status: 'maintenance_review_pending',
        maintenanceStatus: 'review_pending'
      });
    } else if (status === 'in_progress') {
      await Room.findByIdAndUpdate(task.roomId, {
        status: 'maintenance_in_progress',
        maintenanceStatus: 'in_progress'
      });
    }
    await task.save();

    await addAuditLog(task._id, `status:${status}`, req.user._id, note || '');

    if (status === 'review_pending') {
      await createNotification(
        task.reportedBy,
        null,
        'maintenance_completed',
        'Maintenance Pending Review',
        'Maintenance report is awaiting your review.'
      );
    }

    return successResponse(res, { task }, 'Status updated');
  } catch (error) {
    next(error);
  }
};

// POST /api/maintenance/:id/report  (maintenance) — submit final report
const submitReport = async (req, res, next) => {
  try {
    if (req.user.role !== 'maintenance' && req.user.role !== 'admin') {
      return errorResponse(res, 'Only maintenance users can submit reports', 403);
    }

    const { engineerName, workPerformed, completionDate, cost, remarks, beforeImages, afterImages } = req.body;

    const task = await Maintenance.findById(req.params.id);
    if (!task) return errorResponse(res, 'Task not found', 404);

    if (task.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not your task', 403);
    }

    task.report = {
      engineerName: engineerName || '',
      workPerformed: workPerformed || '',
      completionDate: completionDate ? new Date(completionDate) : new Date(),
      cost: cost ?? null,
      remarks: remarks || ''
    };
    task.status = 'review_pending';
    task.completedAt = new Date();
    if (beforeImages) task.beforeImages = beforeImages;
    if (afterImages) task.afterImages = afterImages;
    await task.save();

    await Room.findByIdAndUpdate(task.roomId, {
      status: 'maintenance_review_pending',
      maintenanceStatus: 'review_pending'
    });

    await addAuditLog(task._id, 'report_submitted', req.user._id, `Engineer: ${engineerName || ''}`);

    await createNotification(
      task.reportedBy,
      null,
      'maintenance_completed',
      'Maintenance Report Submitted',
      'A maintenance report has been submitted for your review.'
    );

    return successResponse(res, { task }, 'Report submitted');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/maintenance/:id/approve-completion  (approver or admin)
const approveCompletion = async (req, res, next) => {
  try {
    if (req.user.role !== 'approver' && req.user.role !== 'admin') {
      return errorResponse(res, 'Only approvers or admins can approve completion', 403);
    }

    const task = await Maintenance.findById(req.params.id);
    if (!task) return errorResponse(res, 'Task not found', 404);

    if (task.status !== 'review_pending') {
      return errorResponse(res, `Cannot approve task in status ${task.status}`, 400);
    }

    task.status = 'completed';
    task.approvedAt = new Date();
    await task.save();

    const room = await Room.findByIdAndUpdate(task.roomId, {
      status: 'available',
      maintenanceStatus: 'none',
      lastMaintenanceDate: new Date(),
      $push: { maintenanceHistory: task._id }
    }, { new: true });

    await addAuditLog(task._id, 'approved', req.user._id, 'Completion approved — room available');

    await createNotification(
      task.assignedTo,
      null,
      'maintenance_approved',
      'Maintenance Approved',
      `Maintenance for ${room?.name || 'the room'} has been approved. Room is available again.`
    );

    const admins = await User.find({ role: 'admin', status: 'active' });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        null,
        'maintenance_approved',
        'Room Available Again',
        `${room?.name || 'A room'} is now available for booking.`
      );
    }

    return successResponse(res, { task, room }, 'Maintenance completed and room restored');
  } catch (error) {
    next(error);
  }
};

// PATCH /api/maintenance/:id/request-additional-work  (approver or admin)
const requestAdditionalWork = async (req, res, next) => {
  try {
    if (req.user.role !== 'approver' && req.user.role !== 'admin') {
      return errorResponse(res, 'Only approvers or admins can request additional work', 403);
    }

    const { comments } = req.body;
    if (!comments || !comments.trim()) {
      return errorResponse(res, 'comments is required', 400);
    }

    const task = await Maintenance.findById(req.params.id);
    if (!task) return errorResponse(res, 'Task not found', 404);

    if (task.status !== 'review_pending') {
      return errorResponse(res, `Cannot request additional work in status ${task.status}`, 400);
    }

    task.status = 'additional_work_required';
    task.remarks = comments;
    await task.save();

    await Room.findByIdAndUpdate(task.roomId, {
      status: 'maintenance_in_progress',
      maintenanceStatus: 'in_progress'
    });

    await addAuditLog(task._id, 'additional_work_requested', req.user._id, comments);

    await createNotification(
      task.assignedTo,
      null,
      'maintenance_additional_work',
      'Additional Work Requested',
      `Approver requested additional work: ${comments}`
    );

    return successResponse(res, { task }, 'Additional work requested');
  } catch (error) {
    next(error);
  }
};

// GET /api/maintenance/analytics  (admin) — overview stats
const getAnalytics = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return errorResponse(res, 'Admin only', 403);
    }

    const totalRequests = await Maintenance.countDocuments({});

    const activeMaintenance = await Maintenance.countDocuments({
      status: { $in: ['assigned', 'in_progress', 'waiting_for_parts', 'review_pending', 'additional_work_required'] }
    });

    // Average repair time = completedAt - startedAt for completed tasks
    const completed = await Maintenance.find({ status: 'completed', completedAt: { $ne: null }, startedAt: { $ne: null } });
    let avgRepairTimeMs = 0;
    if (completed.length > 0) {
      const totalMs = completed.reduce((acc, t) => acc + (new Date(t.completedAt) - new Date(t.startedAt)), 0);
      avgRepairTimeMs = totalMs / completed.length;
    }
    const avgRepairTimeDays = +(avgRepairTimeMs / (1000 * 60 * 60 * 24)).toFixed(2);

    // Most problematic rooms (top 5)
    const problematicAgg = await Maintenance.aggregate([
      { $group: { _id: '$roomId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const roomIds = problematicAgg.map(r => r._id);
    const rooms = await Room.find({ _id: { $in: roomIds } }).select('name roomId building');
    const problematicRooms = problematicAgg.map(p => {
      const room = rooms.find(r => r._id.toString() === p._id.toString());
      return { roomId: p._id, name: room?.name, roomCode: room?.roomId, building: room?.building, count: p.count };
    });

    // Monthly maintenance cost (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyAgg = await Maintenance.aggregate([
      { $match: { 'report.cost': { $ne: null }, updatedAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$updatedAt' }, month: { $month: '$updatedAt' } },
          total: { $sum: '$report.cost' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const monthlyCosts = monthlyAgg.map(m => ({
      month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
      total: m.total
    }));

    return successResponse(res, {
      totalRequests,
      activeMaintenance,
      avgRepairTimeDays,
      problematicRooms,
      monthlyCosts
    }, 'Maintenance analytics retrieved');
  } catch (error) {
    next(error);
  }
};

// Validation rules
const createMaintenanceValidation = [
  body('roomId').isMongoId().withMessage('Invalid room ID'),
  body('issueCategory').isIn(['electrical', 'hvac', 'furniture', 'cleaning', 'renovation', 'plumbing', 'internet', 'projector', 'other']).withMessage('Invalid category'),
  body('priority').optional().isIn(['critical', 'high', 'medium', 'low']).withMessage('Invalid priority'),
  body('description').optional().isLength({ max: 1000 }),
  body('assignedTo').optional().isMongoId(),
  body('expectedCompletion').optional().isISO8601()
];

const updateStatusValidation = [
  body('status').isIn(['in_progress', 'waiting_for_parts', 'review_pending']).withMessage('Invalid status'),
  body('note').optional().isLength({ max: 500 })
];

const submitReportValidation = [
  body('engineerName').optional().isLength({ max: 100 }),
  body('workPerformed').optional().isLength({ max: 2000 }),
  body('completionDate').optional().isISO8601(),
  body('cost').optional().isFloat({ min: 0 }),
  body('remarks').optional().isLength({ max: 1000 }),
  body('beforeImages').optional().isArray(),
  body('afterImages').optional().isArray()
];

const additionalWorkValidation = [
  body('comments').trim().notEmpty().withMessage('Comments are required')
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid task ID')
];

module.exports = {
  createMaintenance,
  getMyTasks,
  getAllMaintenance,
  getMaintenanceById,
  getRoomMaintenanceHistory,
  acceptTask,
  updateStatus,
  submitReport,
  approveCompletion,
  requestAdditionalWork,
  getAnalytics,
  createMaintenanceValidation,
  updateStatusValidation,
  submitReportValidation,
  additionalWorkValidation,
  idValidation
};
