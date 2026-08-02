const mongoose = require('mongoose');
const Counter = require('./Counter');

const maintenanceSchema = new mongoose.Schema({
  maintenanceId: {
    type: String,
    unique: true,
    required: [true, 'Maintenance ID is required']
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Room is required']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Maintenance Incharge is required']
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required']
  },
  issueCategory: {
    type: String,
    enum: ['electrical', 'hvac', 'furniture', 'cleaning', 'renovation', 'plumbing', 'internet', 'projector', 'other'],
    required: [true, 'Issue category is required']
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'waiting_for_parts', 'review_pending', 'completed', 'additional_work_required'],
    default: 'assigned'
  },
  startedAt: {
    type: Date,
    default: null
  },
  expectedCompletion: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  report: {
    engineerName: { type: String, trim: true, default: '' },
    workPerformed: { type: String, trim: true, default: '' },
    completionDate: { type: Date, default: null },
    cost: { type: Number, default: null },
    remarks: { type: String, trim: true, default: '' }
  },
  beforeImages: [{ type: String }],
  afterImages: [{ type: String }],
  attachments: [{
    url: { type: String },
    name: { type: String },
    type: { type: String }
  }],
  cost: {
    type: Number,
    default: null
  },
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  auditLog: [{
    action: { type: String, required: true },
    byUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  }]
}, {
  timestamps: true
});

maintenanceSchema.index({ roomId: 1, createdAt: -1 });
maintenanceSchema.index({ assignedTo: 1, status: 1 });
maintenanceSchema.index({ status: 1, priority: 1 });

maintenanceSchema.statics.getNextSequence = async function () {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'maintenanceId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

maintenanceSchema.statics.initializeCounter = async function () {
  const lastMaintenance = await this.findOne().sort({ maintenanceId: -1 });
  let seq = 0;
  if (lastMaintenance && lastMaintenance.maintenanceId) {
    const num = parseInt(lastMaintenance.maintenanceId.replace('MT-', ''));
    if (!isNaN(num)) seq = num;
  }
  await Counter.findByIdAndUpdate(
    { _id: 'maintenanceId' },
    { $set: { seq } },
    { upsert: true }
  );
  return seq;
};

module.exports = mongoose.model('Maintenance', maintenanceSchema);
