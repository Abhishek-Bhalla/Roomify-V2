import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  X,
  Wrench,
  FileText,
  History,
  Save,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { maintenanceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MaintenanceTaskDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Update-status modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: 'in_progress', note: '' });

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    engineerName: '',
    workPerformed: '',
    completionDate: new Date().toISOString().split('T')[0],
    cost: '',
    remarks: '',
  });

  const fetchTask = async () => {
    setIsLoading(true);
    try {
      const res = await maintenanceAPI.getById(id);
      setTask(res.data.data.task);
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const isIncharge = user?.role === 'maintenance' && String(task?.assignedTo?._id) === String(user?.id);
  const isApprover = user?.role === 'approver' || user?.role === 'admin';

  const handleAccept = async () => {
    if (!window.confirm('Accept this task? Your status will move to In Progress.')) return;
    try {
      setActionLoading(true);
      await maintenanceAPI.accept(id);
      await fetchTask();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveStatus = async () => {
    try {
      setActionLoading(true);
      await maintenanceAPI.updateStatus(id, statusForm);
      setShowStatusModal(false);
      await fetchTask();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!reportForm.workPerformed.trim()) {
      alert('Please describe the work performed.');
      return;
    }
    try {
      setActionLoading(true);
      await maintenanceAPI.submitReport(id, {
        ...reportForm,
        cost: reportForm.cost ? parseFloat(reportForm.cost) : null,
      });
      setShowReportModal(false);
      await fetchTask();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve and mark room as available?')) return;
    try {
      setActionLoading(true);
      await maintenanceAPI.approveCompletion(id);
      await fetchTask();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve completion');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return <p className="text-center text-gray-500 py-12">Loading task...</p>;
  }
  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Task not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  const canAccept = isIncharge && (task.status === 'assigned' || task.status === 'additional_work_required');
  const canUpdateStatus = isIncharge && ['in_progress', 'waiting_for_parts'].includes(task.status);
  const canSubmitReport = isIncharge && ['in_progress', 'waiting_for_parts'].includes(task.status);
  const canApprove = isApprover && task.status === 'review_pending';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-800">{task.maintenanceId}</h1>
              <StatusBadge status={task.priority} />
              <StatusBadge status={task.status} />
            </div>
            <p className="text-gray-500 text-sm mt-1">{task.issueCategory} • {task.roomId?.name}</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchTask}>
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Task Details */}
          <div className="bg-white rounded-xl border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Task Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Detail label="Room" value={task.roomId?.name || '-'} sub={task.roomId?.roomId} />
              <Detail label="Category" value={task.issueCategory} />
              <Detail label="Reported By" value={task.reportedBy?.name || '-'} sub={task.reportedBy?.email} />
              <Detail label="Assigned To" value={task.assignedTo?.name || '-'} sub={task.assignedTo?.employeeId} />
              <Detail label="Created" value={new Date(task.createdAt).toLocaleString()} />
              <Detail
                label="Expected Completion"
                value={task.expectedCompletion ? new Date(task.expectedCompletion).toLocaleDateString() : '-'}
              />
              <Detail label="Started At" value={task.startedAt ? new Date(task.startedAt).toLocaleString() : '-'} />
              <Detail label="Completed At" value={task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'} />
              <Detail label="Approved At" value={task.approvedAt ? new Date(task.approvedAt).toLocaleString() : '-'} />
            </div>
            {task.description && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}
          </div>

          {/* Final Report (if any) */}
          {task.report && (task.report.engineerName || task.report.workPerformed) && (
            <div className="bg-white rounded-xl border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Maintenance Report</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Detail label="Engineer" value={task.report.engineerName || '-'} />
                <Detail label="Completion Date" value={task.report.completionDate ? new Date(task.report.completionDate).toLocaleDateString() : '-'} />
                <Detail label="Cost" value={task.report.cost != null ? `₹${task.report.cost}` : '-'} />
              </div>
              {task.report.workPerformed && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Work Performed</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.report.workPerformed}</p>
                </div>
              )}
              {task.report.remarks && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Remarks</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.report.remarks}</p>
                </div>
              )}
            </div>
          )}

          {/* Approver remarks (request for additional work) */}
          {task.remarks && task.status === 'additional_work_required' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 md:p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={18} className="text-yellow-700" />
                <h2 className="text-lg font-semibold text-yellow-800">Approver Comments</h2>
              </div>
              <p className="text-sm text-yellow-900 whitespace-pre-wrap">{task.remarks}</p>
            </div>
          )}

          {/* Audit log */}
          <div className="bg-white rounded-xl border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }}>
            <div className="flex items-center gap-2 mb-4">
              <History size={18} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Audit Log</h2>
            </div>
            {task.auditLog && task.auditLog.length > 0 ? (
              <div className="space-y-3">
                {task.auditLog.slice().reverse().map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: '#2563EB' }} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800">
                        {entry.action}
                        <span className="text-gray-400 font-normal"> by {entry.byUser?.name || 'Unknown'}</span>
                      </p>
                      <p className="text-xs text-gray-500">{new Date(entry.at).toLocaleString()}</p>
                      {entry.note && <p className="text-gray-600 mt-1">{entry.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No audit entries yet</p>
            )}
          </div>
        </div>

        {/* Sidebar with actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions</h2>
            <div className="space-y-3">
              {canAccept && (
                <Button onClick={handleAccept} disabled={actionLoading} className="w-full">
                  <Wrench size={16} className="mr-2" />
                  Accept & Start
                </Button>
              )}
              {canUpdateStatus && (
                <Button variant="outline" onClick={() => setShowStatusModal(true)} className="w-full">
                  <RefreshCw size={16} className="mr-2" />
                  Update Status
                </Button>
              )}
              {canSubmitReport && (
                <Button variant="success" onClick={() => setShowReportModal(true)} className="w-full">
                  <FileText size={16} className="mr-2" />
                  Submit Report
                </Button>
              )}
              {canApprove && (
                <>
                  <Button onClick={handleApprove} disabled={actionLoading} className="w-full">
                    <CheckCircle size={16} className="mr-2" />
                    Approve Completion
                  </Button>
                  <RequestAdditionalWorkButton taskId={id} onDone={fetchTask} />
                </>
              )}
              {!canAccept && !canUpdateStatus && !canSubmitReport && !canApprove && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No actions available for your role in the current status.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Room Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{task.roomId?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Building</span><span className="font-medium">{task.roomId?.building || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Floor</span><span className="font-medium">{task.roomId?.floor || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Capacity</span><span className="font-medium">{task.roomId?.capacity || '-'}</span></div>
              {task.roomId?.roomId && (
                <div className="flex justify-between"><span className="text-gray-500">Room Code</span><span className="font-mono text-xs">{task.roomId.roomId}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Update Status</h2>
              <button onClick={() => setShowStatusModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_parts">Waiting for Parts</option>
                  <option value="review_pending">Submit for Review</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <textarea
                  rows={3}
                  value={statusForm.note}
                  onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a brief note..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSaveStatus} disabled={actionLoading} className="flex-1">
                <Save size={16} className="mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setShowStatusModal(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Submit Maintenance Report</h2>
              <button onClick={() => setShowReportModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engineer Name</label>
                <input
                  type="text"
                  value={reportForm.engineerName}
                  onChange={(e) => setReportForm({ ...reportForm, engineerName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={user?.name || 'Your name'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Performed *</label>
                <textarea
                  rows={4}
                  value={reportForm.workPerformed}
                  onChange={(e) => setReportForm({ ...reportForm, workPerformed: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what was repaired/replaced..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
                  <input
                    type="date"
                    value={reportForm.completionDate}
                    onChange={(e) => setReportForm({ ...reportForm, completionDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
                  <input
                    type="number"
                    value={reportForm.cost}
                    onChange={(e) => setReportForm({ ...reportForm, cost: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={reportForm.remarks}
                  onChange={(e) => setReportForm({ ...reportForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSaveReport} disabled={actionLoading} className="flex-1">
                <Save size={16} className="mr-2" />
                Submit Report
              </Button>
              <Button variant="outline" onClick={() => setShowReportModal(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value, sub }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-medium text-gray-800">{value}</p>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);

// Inline component for "Request Additional Work" — needs taskId from parent
const RequestAdditionalWorkButton = ({ taskId, onDone }) => {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!comments.trim()) {
      alert('Comments are required.');
      return;
    }
    try {
      setLoading(true);
      await maintenanceAPI.requestAdditionalWork(taskId, { comments });
      setOpen(false);
      setComments('');
      onDone?.();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request additional work');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)} className="w-full">
        <AlertTriangle size={16} className="mr-2" />
        Request Additional Work
      </Button>
      {open && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Request Additional Work</h2>
              <button onClick={() => setOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comments *</label>
              <textarea
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What needs to be done further?"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="danger" onClick={submit} disabled={loading} className="flex-1">
                Submit Request
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MaintenanceTaskDetails;