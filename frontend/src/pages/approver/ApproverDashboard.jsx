import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw, DoorOpen, FileText } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import { bookingAPI, roomAPI } from '../../services/api';

const ApproverDashboard = () => {
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedBookings: 0,
    activeRooms: 0,
    totalRequests: 0,
  });
  const [recentPending, setRecentPending] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const pendingRes = await bookingAPI.getPending();
      const allBookingsRes = await bookingAPI.getAll();
      const roomsRes = await roomAPI.getAll();

      const pendingBookings = pendingRes.data.data.bookings;
      const allBookings = allBookingsRes.data.data.bookings;
      const rooms = roomsRes.data.data.rooms;
      const activeRooms = rooms.filter(r => r.status === 'available').length;

      setStats({
        pendingRequests: pendingBookings.length,
        approvedBookings: allBookings.filter(b => b.status === 'approved').length,
        activeRooms: activeRooms,
        totalRequests: allBookings.length,
      });

      setRecentPending(pendingBookings.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch approver stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Review and manage booking requests</p>
        </div>
        <Button variant="outline" onClick={fetchStats} disabled={isLoading} className="w-full sm:w-auto">
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
          iconBg="#FEF9C3"
        />
        <StatCard
          title="Approved Bookings"
          value={stats.approvedBookings}
          icon={CheckCircle}
          iconBg="#DCFCE7"
        />
        <StatCard
          title="Active Rooms"
          value={stats.activeRooms}
          icon={DoorOpen}
          iconBg="#DBEAFE"
        />
        <StatCard
          title="Total Requests"
          value={stats.totalRequests}
          icon={FileText}
          iconBg="#E5E7EB"
        />
      </div>

      {/* Pending Reviews */}
      <div className="bg-white rounded-xl border p-4 md:p-5" style={{ borderColor: '#E5E7EB' }}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Pending Reviews</h2>

        <div className="space-y-3">
          {recentPending.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No pending requests</p>
          ) : (
            recentPending.map((booking) => (
              <div
                key={booking._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl"
                style={{ background: '#FFFBEB' }}
              >
                <div className="flex items-center gap-3">
                  <Avatar user={booking.userId} size={40} />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800">{booking.userId?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {booking.roomId?.name} • {new Date(booking.date).toLocaleDateString()} • {booking.startTime} - {booking.endTime}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-auto sm:ml-0">
                  <StatusBadge status="pending" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ApproverDashboard;
