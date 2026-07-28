import { useState, useEffect } from 'react';
import { RefreshCw, Eye } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { bookingAPI } from '../../services/api';

const AdminBookingsView = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

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

  const handleView = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const filteredBookings = filterStatus === 'all'
    ? bookings
    : bookings.filter(b => b.status === filterStatus);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">View all booking requests (read-only)</p>
        </div>
        <Button variant="outline" onClick={fetchBookings} className="w-full sm:w-auto">
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs - Horizontal scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-200 ${
              filterStatus === tab.id
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            style={{
              background: filterStatus === tab.id ? '#2563EB' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Purpose</th>
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
                  <td colSpan="8" className="text-center py-8 text-gray-500">No bookings found</td>
                </tr>
              ) : (
                filteredBookings.map((booking, index) => (
                  <tr key={booking._id} className="border-b hover:bg-gray-50" style={{ borderColor: '#F3F4F6' }}>
                    <td className="px-4 py-4 text-sm text-gray-700">#{index + 1}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{booking.userId?.name || 'Unknown'}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{booking.roomId?.name || 'Unknown'}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{new Date(booking.date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{booking.startTime} - {booking.endTime}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 truncate max-w-[150px]">{booking.purpose}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleView(booking)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
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
          <div className="text-center py-8 text-gray-500">No bookings found</div>
        ) : (
          filteredBookings.map((booking, index) => (
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
                <p className="text-gray-500 truncate">{booking.purpose}</p>
              </div>
              <button
                onClick={() => handleView(booking)}
                className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-50"
                style={{ border: '1px solid #E5E7EB', color: '#374151' }}
              >
                <Eye size={16} className="inline mr-2" />
                View Details
              </button>
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
              <div>
                <p className="text-sm text-gray-500">Requester</p>
                <p className="font-medium text-gray-800">{selectedBooking.userId?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Room</p>
                <p className="font-medium text-gray-800">{selectedBooking.roomId?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium text-gray-800">{new Date(selectedBooking.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium text-gray-800">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Purpose</p>
                <p className="font-medium text-gray-800">{selectedBooking.purpose}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={selectedBooking.status} />
              </div>
              {selectedBooking.remarks && (
                <div>
                  <p className="text-sm text-gray-500">Remarks</p>
                  <p className="font-medium text-gray-800">{selectedBooking.remarks}</p>
                </div>
              )}
            </div>
            <div className="mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookingsView;
