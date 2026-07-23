import { useState, useEffect } from 'react';
import { RefreshCw, Check, X, XCircle, Eye } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { bookingAPI } from '../../services/api';

const BookingRequests = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await bookingAPI.getAll();
      setBookings(response.data.data.bookings);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!booking.userId?.name?.toLowerCase().includes(search) &&
          !booking.roomId?.name?.toLowerCase().includes(search) &&
          !booking.purpose?.toLowerCase().includes(search)) return false;
    }
    return true;
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      await bookingAPI.approve(id);
      await fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = (booking) => {
    setSelectedBooking(booking);
    setShowRemarksModal(true);
  };

  const handleSaveRemarks = async () => {
    if (!selectedBooking) return;
    try {
      setActionLoading(true);
      await bookingAPI.reject(selectedBooking._id, remarks);
      setShowRemarksModal(false);
      setSelectedBooking(null);
      setRemarks('');
      await fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject booking');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Booking Requests</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage all booking requests</p>
        </div>
        <Button variant="outline" onClick={fetchBookings} className="w-full sm:w-auto">
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by requester, room, purpose..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Booking ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Requester</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employee ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">Loading...</td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">No booking requests found</td>
                </tr>
              ) : (
                filteredBookings.map((booking, index) => (
                  <tr key={booking._id} className="border-b hover:bg-gray-50" style={{ borderColor: '#F3F4F6' }}>
                    <td className="px-4 py-4 text-sm text-gray-700">{booking.bookingId || `#${index + 1}`}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{booking.userId?.name || 'Unknown'}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{booking.userId?.employeeId || '-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{booking.roomId?.name || 'Unknown'}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{new Date(booking.date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{booking.startTime} - {booking.endTime}</td>
                    <td className="px-4 py-4"><StatusBadge status={booking.status} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <div className="relative group">
                          <button
                            onMouseEnter={() => setHoveredBooking(booking._id)}
                            onMouseLeave={() => setHoveredBooking(null)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-600 transition-colors cursor-help"
                            title="View Purpose"
                          >
                            <Eye size={16} />
                          </button>
                          {hoveredBooking === booking._id && (
                            <div className="absolute left-0 top-full mt-1 z-50 bg-gray-800 text-white text-sm rounded-lg p-3 w-64 shadow-lg">
                              <p className="font-medium mb-1">Purpose:</p>
                              <p className="text-gray-300">{booking.purpose || 'No purpose provided'}</p>
                            </div>
                          )}
                        </div>
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(booking._id)}
                              disabled={actionLoading}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600 transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleReject(booking)}
                              disabled={actionLoading}
                              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No booking requests found</div>
        ) : (
          filteredBookings.map((booking, index) => (
            <div key={booking._id} className="bg-white rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">Booking ID: {booking.bookingId || 'N/A'}</p>
                  <p className="font-medium text-gray-800">{booking.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-400">Emp ID: {booking.userId?.employeeId || '-'}</p>
                  <p className="text-sm text-gray-500">Room: {booking.roomId?.name || 'Unknown'}</p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              <div className="text-sm text-gray-600 space-y-1 mb-3">
                <p>{new Date(booking.date).toLocaleDateString()} • {booking.startTime} - {booking.endTime}</p>
                <p className="text-gray-500 truncate">{booking.purpose}</p>
              </div>
              <div className="flex gap-2">
                {booking.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(booking._id)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      <Check size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(booking)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Remarks Modal */}
      {showRemarksModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="text-red-500" size={24} />
              <h2 className="text-xl font-bold text-gray-800">Reject Booking</h2>
            </div>
            <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Enter reason for rejection..."
            />
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSaveRemarks} className="flex-1" disabled={actionLoading}>
                Reject Booking
              </Button>
              <Button variant="outline" onClick={() => setShowRemarksModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BookingRequests;
