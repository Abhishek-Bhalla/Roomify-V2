import { useState, useEffect } from 'react';
import { RefreshCw, Eye, Check, X } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { bookingAPI } from '../../services/api';

const AdminBookingRequests = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleApprove = async (id) => {
    try {
      await bookingAPI.approve(id);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve booking');
    }
  };

  const handleReject = async (id) => {
    try {
      await bookingAPI.reject(id, 'Rejected by admin');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject booking');
    }
  };

  const handleView = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
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

      {/* Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Requester</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Room</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">No bookings found</td></tr>
              ) : (
                bookings.map((booking, index) => (
                  <tr key={booking._id} className="border-b hover:bg-gray-50" style={{ borderColor: '#F3F4F6' }}>
                    <td className="px-4 py-4 text-sm text-gray-700">#{index + 1}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{booking.userId?.name || 'Unknown'}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{booking.roomId?.name || 'Unknown'}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{new Date(booking.date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{booking.startTime} - {booking.endTime}</td>
                    <td className="px-4 py-4"><StatusBadge status={booking.status} /></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleView(booking)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                          <Eye size={16} />
                        </button>
                        {booking.status === 'pending' && (
                          <>
                            <button onClick={() => handleApprove(booking._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                              <Check size={16} />
                            </button>
                            <button onClick={() => handleReject(booking._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors">
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
        ) : bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No bookings found</div>
        ) : (
          bookings.map((booking, index) => (
            <div key={booking._id} className="bg-white rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">#{index + 1}</p>
                  <p className="font-medium text-gray-800">{booking.userId?.name || 'Unknown'}</p>
                  <p className="text-sm text-gray-500">{booking.roomId?.name || 'Unknown'}</p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              <div className="text-sm text-gray-600 space-y-1 mb-3">
                <p>{new Date(booking.date).toLocaleDateString()} • {booking.startTime} - {booking.endTime}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleView(booking)} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center justify-center gap-1" style={{ border: '1px solid #E5E7EB', color: '#374151' }}>
                  <Eye size={14} /> View
                </button>
                {booking.status === 'pending' && (
                  <>
                    <button onClick={() => handleApprove(booking._id)} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center gap-1">
                      <Check size={14} /> Approve
                    </button>
                    <button onClick={() => handleReject(booking._id)} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center gap-1">
                      <X size={14} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Booking Details</h2>
            <div className="space-y-3">
              <div><p className="text-sm text-gray-500">Requester</p><p className="font-medium text-gray-800">{selectedBooking.userId?.name || 'Unknown'}</p></div>
              <div><p className="text-sm text-gray-500">Room</p><p className="font-medium text-gray-800">{selectedBooking.roomId?.name || 'Unknown'}</p></div>
              <div><p className="text-sm text-gray-500">Date</p><p className="font-medium text-gray-800">{new Date(selectedBooking.date).toLocaleDateString()}</p></div>
              <div><p className="text-sm text-gray-500">Time</p><p className="font-medium text-gray-800">{selectedBooking.startTime} - {selectedBooking.endTime}</p></div>
              <div><p className="text-sm text-gray-500">Purpose</p><p className="font-medium text-gray-800">{selectedBooking.purpose}</p></div>
              <div><p className="text-sm text-gray-500">Status</p><StatusBadge status={selectedBooking.status} /></div>
              {selectedBooking.remarks && <div><p className="text-sm text-gray-500">Remarks</p><p className="font-medium text-gray-800">{selectedBooking.remarks}</p></div>}
            </div>
            <div className="mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingRequests;
