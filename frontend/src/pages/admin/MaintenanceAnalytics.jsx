import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  TrendingUp,
  DoorOpen,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import { maintenanceAPI } from '../../services/api';

const MaintenanceAnalytics = () => {
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeMaintenance: 0,
    avgRepairTimeDays: 0,
    problematicRooms: [],
    monthlyCosts: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await maintenanceAPI.getAnalytics();
      setStats(res.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const maxCost = Math.max(1, ...stats.monthlyCosts.map((m) => m.total));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={22} /> Maintenance Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Overview of maintenance performance and trends</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link to="/admin/maintenance">
            <Button variant="outline">All Tasks</Button>
          </Link>
          <Button variant="outline" onClick={fetchAnalytics} disabled={isLoading}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <StatCard title="Total Requests" value={stats.totalRequests} icon={Wrench} iconBg="#DBEAFE" />
        <StatCard title="Active Maintenance" value={stats.activeMaintenance} icon={AlertTriangle} iconBg="#FFE4E6" />
        <StatCard title="Avg Repair Time" value={`${stats.avgRepairTimeDays}d`} icon={Clock} iconBg="#FEF3C7" />
        <StatCard title="Completed" value={stats.totalRequests - stats.activeMaintenance} icon={CheckCircle} iconBg="#DCFCE7" />
      </div>

      {/* Problematic rooms */}
      <div className="bg-white rounded-xl border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-2 mb-4">
          <DoorOpen size={18} className="text-red-500" />
          <h2 className="text-lg font-semibold text-gray-800">Most Problematic Rooms</h2>
        </div>
        {stats.problematicRooms.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No maintenance history yet</p>
        ) : (
          <div className="space-y-3">
            {stats.problematicRooms.map((r, i) => {
              const max = stats.problematicRooms[0].count;
              const pct = (r.count / max) * 100;
              return (
                <div key={r.roomId || i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-800 truncate">
                        {r.name || 'Unknown Room'}
                        <span className="text-xs text-gray-400 font-mono ml-2">{r.roomCode}</span>
                      </p>
                      <span className="text-sm font-medium text-gray-700 ml-3 flex-shrink-0">
                        {r.count} request{r.count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: '#EF4444' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly costs */}
      <div className="bg-white rounded-xl border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">Monthly Maintenance Cost (Last 6 Months)</h2>
        </div>
        {stats.monthlyCosts.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No cost data yet</p>
        ) : (
          <div className="space-y-3">
            {stats.monthlyCosts.map((m, i) => {
              const pct = (m.total / maxCost) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-24 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-700">{m.month}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: '#2563EB' }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 ml-3 flex-shrink-0">
                        ₹{m.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceAnalytics;