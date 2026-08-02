import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { maintenanceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MaintenanceDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    reviewPending: 0,
    completed: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await maintenanceAPI.getMyTasks({});
      const tasks = res.data.data.tasks || [];
      setStats({
        assigned: tasks.filter((t) => t.status === 'assigned').length,
        inProgress: tasks.filter((t) => t.status === 'in_progress').length,
        reviewPending: tasks.filter((t) => t.status === 'review_pending').length,
        completed: tasks.filter((t) => t.status === 'completed').length,
      });
      setRecentTasks(tasks.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch maintenance tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maintenance Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back{user?.name ? `, ${user.name}` : ''}. Here are your open tasks.
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={isLoading} className="w-full sm:w-auto">
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <StatCard title="Assigned" value={stats.assigned} icon={Wrench} iconBg="#DBEAFE" />
        <StatCard title="In Progress" value={stats.inProgress} icon={Clock} iconBg="#FEF3C7" />
        <StatCard title="Review Pending" value={stats.reviewPending} icon={AlertTriangle} iconBg="#FFE4E6" />
        <StatCard title="Completed" value={stats.completed} icon={CheckCircle} iconBg="#DCFCE7" />
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-xl border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Tasks</h2>
          <Link
            to="/maintenance/tasks"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="space-y-3">
          {recentTasks.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No tasks assigned to you</p>
          ) : (
            recentTasks.map((task) => (
              <Link
                key={task._id}
                to={`/maintenance/tasks/${task._id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                style={{ background: '#F9FAFB' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0"
                    style={{ background: '#2563EB' }}
                  >
                    {task.roomId?.name?.charAt(0) || 'R'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{task.roomId?.name || 'Unknown Room'}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {task.issueCategory} • Reported by {task.reportedBy?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;