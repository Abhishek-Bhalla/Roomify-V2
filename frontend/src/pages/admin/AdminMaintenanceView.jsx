import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  RefreshCw,
  Wrench,
  Eye,
  ClipboardList,
} from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { maintenanceAPI } from '../../services/api';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_for_parts', label: 'Waiting for Parts' },
  { value: 'review_pending', label: 'Review Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'additional_work_required', label: 'Additional Work' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const AdminMaintenanceView = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', priority: 'all', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchTasks = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 50 };
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.priority !== 'all') params.priority = filters.priority;
      const res = await maintenanceAPI.getAll(params);
      setTasks(res.data.data.tasks || []);
      if (res.data.data.pagination) setPagination(res.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch maintenance tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((t) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !t.maintenanceId?.toLowerCase().includes(q) &&
        !t.roomId?.name?.toLowerCase().includes(q) &&
        !t.assignedTo?.name?.toLowerCase().includes(q) &&
        !t.issueCategory?.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList size={22} /> All Maintenance Tasks
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination.total || tasks.length} total task{pagination.total === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link to="/admin/maintenance/analytics">
            <Button variant="outline">Analytics</Button>
          </Link>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} className="mr-2" />
            Filters
          </Button>
          <Button variant="outline" onClick={() => fetchTasks()}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl border p-4 lg:p-6" style={{ borderColor: '#E5E7EB' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Task ID, room, assignee, category..."
                  className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setFilters({ status: 'all', priority: 'all', search: '' })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Tasks table-ish list */}
      <div className="bg-white rounded-xl border" style={{ borderColor: '#E5E7EB' }}>
        {isLoading ? (
          <p className="text-center text-gray-500 py-12">Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No maintenance tasks found</p>
        ) : (
          <div className="divide-y" style={{ borderColor: '#E5E7EB' }}>
            {filteredTasks.map((task) => (
              <div key={task._id} className="p-4 md:p-5 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ background: '#2563EB' }}
                    >
                      <Wrench size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs text-gray-500">{task.maintenanceId}</span>
                        <StatusBadge status={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                      <p className="font-medium text-gray-800">
                        {task.roomId?.name || 'Unknown Room'}
                        <span className="text-sm text-gray-500 font-normal ml-2">({task.issueCategory})</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Assigned to: <span className="font-medium text-gray-700">{task.assignedTo?.name || 'Unknown'}</span>
                        {' '} • Reported by {task.reportedBy?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created {new Date(task.createdAt).toLocaleDateString()}
                        {task.completedAt ? ` • Completed ${new Date(task.completedAt).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/maintenance/tasks/${task._id}`}
                    className="px-3 py-2 rounded-lg text-sm font-medium border hover:bg-blue-50 text-blue-600 flex items-center gap-1 self-start sm:self-center"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <Eye size={14} />
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMaintenanceView;