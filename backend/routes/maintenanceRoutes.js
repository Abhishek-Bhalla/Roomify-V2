const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
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
} = require('../controllers/maintenanceController');

// All maintenance routes require authentication and one of the three roles.
router.use(protect);
router.use(authorize('admin', 'approver', 'maintenance'));

// Analytics (admin only — controller enforces again)
router.get('/analytics', getAnalytics);

// My tasks (for maintenance incharge)
router.get('/my-tasks', getMyTasks);

// Room history
router.get('/room/:roomId', getRoomMaintenanceHistory);

// CRUD
router.route('/')
  .get(getAllMaintenance)
  .post(createMaintenanceValidation, createMaintenance);

router.route('/:id')
  .get(idValidation, getMaintenanceById);

// Lifecycle endpoints
router.patch('/:id/accept', idValidation, acceptTask);
router.patch('/:id/status', idValidation, updateStatusValidation, updateStatus);
router.post('/:id/report', idValidation, submitReportValidation, submitReport);
router.patch('/:id/approve-completion', idValidation, approveCompletion);
router.patch('/:id/request-additional-work', idValidation, additionalWorkValidation, requestAdditionalWork);

module.exports = router;