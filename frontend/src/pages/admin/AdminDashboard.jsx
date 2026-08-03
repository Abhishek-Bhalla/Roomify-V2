import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, DoorOpen, Users, RefreshCw, Wrench, ArrowRight } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import { bookingAPI, roomAPI, userAPI, maintenanceAPI } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedBookings: 0,
    activeRooms: 0,
    totalUsers: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [maintenanceOverview, setMaintenanceOverview] = useState({ active: 0, reviewPending: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bookingsRes, roomsRes, usersRes, maintenanceRes] = await Promise.all([
        bookingAPI.getAll(),
        roomAPI.getAll({ includeMaintenance: 'true' }),
        userAPI.getAll(),
        maintenanceAPI.getAll({ limit: 50 }).catch(() => null),
      ]);

      const allBookings = bookingsRes.data.data.bookings;
      const rooms = roomsRes.data.data.rooms;
      const users = usersRes.data.data.users;
      const maintenanceTasks = maintenanceRes?.data?.data?.tasks || [];

      const activeStatuses = ['assigned', 'in_progress', 'waiting_for_parts', 'review_pending', 'additional_work_required'];
      setMaintenanceOverview({
        active: maintenanceTasks.filter((t) => activeStatuses.includes(t.status)).length,
        reviewPending: maintenanceTasks.filter((t) => t.status === 'review_pending').length,
      });

      setStats({
        pendingRequests: allBookings.filter(b => b.status === 'pending').length,
        approvedBookings: allBookings.filter(b => b.status === 'approved').length,
        activeRooms: rooms.filter(r => r.status === 'available').length,
        totalUsers: users.length,
      });

      setRecentBookings(allBookings.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage users and view all bookings</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={isLoading} className="w-full sm:w-auto">
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={Clock}
          iconBg="#FEF3C7"
        />
        <StatCard
          title="Approved Bookings"
          value={stats.approvedBookings}
          icon={CheckCircle}
          iconBg="#D1FAE5"
        />
        <StatCard
          title="Active Rooms"
          value={stats.activeRooms}
          icon={DoorOpen}
          iconBg="#DBEAFE"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          iconBg="#EDE9FE"
        />
      </div>

      {/* Recent Booking Requests */}
      <div className="bg-white rounded-xl border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Booking Requests</h2>

        <div className="space-y-3">
          {recentBookings.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No booking requests yet</p>
          ) : (
            recentBookings.map((booking) => (
              <div
                key={booking._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg"
                style={{ background: '#F9FAFB' }}
              >
                <div className="flex items-center gap-3">
                  <Avatar user={booking.userId} size={40} />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">{booking.userId?.name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {booking.roomId?.name} • {new Date(booking.date).toLocaleDateString()} • {booking.startTime} - {booking.endTime}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{booking.purpose}</p>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-auto sm:ml-0">
                  <StatusBadge status={booking.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Maintenance Overview */}
      <div className="bg-white rounded-xl border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Wrench size={18} className="text-orange-500" />
            Maintenance Overview
          </h2>
          <Link
            to="/admin/maintenance"
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl" style={{ background: '#FFF7ED' }}>
            <p className="text-sm text-gray-600">Active Tasks</p>
            <p className="text-3xl font-bold text-orange-700 mt-1">{maintenanceOverview.active}</p>
            <p className="text-xs text-gray-500 mt-1">Assigned, in progress, waiting for parts</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: '#FFE4E6' }}>
            <p className="text-sm text-gray-600">Review Pending</p>
            <p className="text-3xl font-bold text-rose-700 mt-1">{maintenanceOverview.reviewPending}</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting approver sign-off</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
