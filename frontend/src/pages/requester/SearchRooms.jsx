import { useState, useEffect } from 'react';
import { Search, Calendar, Clock, Users, RefreshCw, X, Filter, CheckCircle, MapPin } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { roomAPI, bookingAPI } from '../../services/api';

const FACILITIES = ['Wi-Fi', 'Smart Board', 'Extension Sockets', 'Projector', 'AC', 'Whiteboard', 'TV', 'Computer', 'Video Conferencing', 'Audio System'];

const SearchRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    capacityMin: '',
    date: '',
    startTime: '',
    facilities: [],
  });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [roomBookings, setRoomBookings] = useState([]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await roomAPI.getAll();
      setRooms(response.data.data.rooms);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleFacilityToggle = (facility) => {
    setFilters(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const clearFilters = () => {
    setFilters({ capacityMin: '', date: '', startTime: '', facilities: [] });
  };

  const filteredRooms = rooms.filter((room) => {
    if (filters.capacityMin && room.capacity < parseInt(filters.capacityMin)) return false;
    if (filters.facilities.length > 0) {
      const hasAllFacilities = filters.facilities.every(f => room.facilities?.includes(f));
      if (!hasAllFacilities) return false;
    }
    return room.status === 'available';
  });

  const handleViewDetails = async (room) => {
    setSelectedRoom(room);
    setShowRequestModal(true);
    // Pre-fill booking form with filter values
    setBookingForm({
      date: filters.date || '',
      startTime: filters.startTime || '',
      endTime: '',
      purpose: ''
    });
    try {
      const response = await bookingAPI.getAll();
      const today = new Date().toISOString().split('T')[0];
      const roomBookings = response.data.data.bookings.filter(
        b => b.roomId._id === room._id && b.status === 'approved' && b.date.split('T')[0] >= today
      );
      setRoomBookings(roomBookings);
    } catch (err) {
      console.error('Failed to fetch room bookings:', err);
      setRoomBookings([]);
    }
  };

  const handleSubmitBooking = async () => {
    if (!bookingForm.date || !bookingForm.startTime || !bookingForm.endTime || !bookingForm.purpose) {
      alert('Please fill all fields');
      return;
    }
    try {
      setBookingLoading(true);
      await bookingAPI.create({
        roomId: selectedRoom._id,
        date: bookingForm.date,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime,
        purpose: bookingForm.purpose,
      });
      setShowRequestModal(false);
      setShowSuccessModal(true);
      setBookingForm({ date: '', startTime: '', endTime: '', purpose: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit booking request');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Search Rooms</h1>
          <p className="text-gray-500 text-sm mt-1">Find and book available rooms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRooms} className="flex-1 sm:flex-none">
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Panel - Desktop (left) */}
        <aside className="hidden lg:block lg:col-span-1">
          <div
            className="bg-white rounded-xl border p-5 lg:p-6 sticky top-20 shadow-sm"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: '#F3F4F6' }}>
              <Filter size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">Filters</h2>
            </div>

            <div className="space-y-4">
              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seating Capacity (Min: {filters.capacityMin || 10})
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={filters.capacityMin}
                  onChange={(e) => handleFilterChange('capacityMin', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min capacity"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-xs text-blue-500">(auto-filled in booking)</span>
                </label>
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time <span className="text-xs text-blue-500">(auto-filled in booking)</span>
                </label>
                <input
                  type="time"
                  value={filters.startTime}
                  onChange={(e) => handleFilterChange('startTime', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Facilities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border p-2 rounded-lg">
                  {FACILITIES.map((f) => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.facilities.includes(f)}
                        onChange={() => handleFacilityToggle(f)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Button */}
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Filters Panel - Mobile */}
        {showFilters && (
          <div className="lg:hidden col-span-1">
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-500" />
                  <h2 className="font-semibold text-gray-800">Filters</h2>
                </div>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seating Capacity (Min: {filters.capacityMin || 10})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={filters.capacityMin}
                    onChange={(e) => handleFilterChange('capacityMin', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Min capacity"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-xs text-blue-500">(auto-filled in booking)</span>
                  </label>
                  <input
                    type="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time <span className="text-xs text-blue-500">(auto-filled in booking)</span>
                  </label>
                  <input
                    type="time"
                    value={filters.startTime}
                    onChange={(e) => handleFilterChange('startTime', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded-lg">
                    {FACILITIES.map((f) => (
                      <label key={f} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.facilities.includes(f)}
                          onChange={() => handleFacilityToggle(f)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{f}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Room Cards Grid - right */}
        <section className={`col-span-1 ${showFilters ? 'lg:col-span-2' : 'lg:col-span-2'} grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5`}>
          {isLoading ? (
            <p className="col-span-full text-center text-gray-500 py-12">Loading rooms...</p>
          ) : filteredRooms.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border p-12 text-center" style={{ borderColor: '#E5E7EB' }}>
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No rooms found matching your criteria</p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div
                key={room._id}
                className="bg-white rounded-xl border p-4 md:p-5 transition-all duration-200 hover:shadow-md"
                style={{ borderColor: '#E5E7EB' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Room ID: {room.roomId || 'N/A'}</p>
                    <h3 className="font-semibold text-gray-800 text-base md:text-lg">{room.name}</h3>
                    <p className="text-sm text-gray-500">
                      {room.building || 'Main Building'} - {room.floor || 'Floor 1'}
                    </p>
                  </div>
                  <StatusBadge status={room.status} />
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Users size={16} />
                    {room.capacity} seats
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {room.facilities?.slice(0, 3).map((facility, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ background: '#E5E7EB', color: '#374151' }}
                    >
                      {facility}
                    </span>
                  ))}
                  {room.facilities?.length > 3 && (
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ background: '#E5E7EB', color: '#374151' }}
                    >
                      +{room.facilities.length - 3}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleViewDetails(room)}
                  className="w-full px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:opacity-90"
                  style={{ background: '#2563EB' }}
                >
                  View Details
                </button>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Request Booking Modal */}
      {showRequestModal && selectedRoom && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Room Details</h2>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Room Information */}
            <div className="mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
                  style={{ background: '#2563EB' }}
                >
                  {selectedRoom.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Room ID: {selectedRoom.roomId || 'N/A'}</p>
                  <h3 className="font-semibold text-gray-800 text-lg">{selectedRoom.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin size={14} />
                    {[selectedRoom.building, selectedRoom.floor, selectedRoom.location].filter(Boolean).join(' - ') || 'Location not specified'}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Users size={14} />
                    Capacity: {selectedRoom.capacity} seats
                  </p>
                </div>
                <StatusBadge status={selectedRoom.status} />
              </div>

              {/* Facilities */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Facilities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRoom.facilities?.map((facility, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm rounded-full flex items-center gap-1"
                      style={{ background: '#DCFCE7', color: '#166534' }}
                    >
                      <CheckCircle size={12} />
                      {facility}
                    </span>
                  ))}
                  {!selectedRoom.facilities?.length && (
                    <span className="text-sm text-gray-500">No facilities listed</span>
                  )}
                </div>
              </div>

              {/* Availability Calendar */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Availability Calendar</h4>
                <div className="border rounded-lg p-3" style={{ borderColor: '#E5E7EB' }}>
                  {roomBookings.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No upcoming bookings for this room</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {roomBookings.map(booking => (
                        <div key={booking._id} className="flex items-center justify-between p-2 rounded bg-green-50 text-sm">
                          <div>
                            <span className="font-medium">{new Date(booking.date).toLocaleDateString()}</span>
                            <span className="text-gray-500 ml-2">{booking.startTime} - {booking.endTime}</span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded">Booked</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Form */}
              <div className="border-t pt-4" style={{ borderColor: '#E5E7EB' }}>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Request Booking</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time *</label>
                      <input
                        type="time"
                        value={bookingForm.startTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time *</label>
                      <input
                        type="time"
                        value={bookingForm.endTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
                    <textarea
                      value={bookingForm.purpose}
                      onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Describe the purpose of your booking..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSubmitBooking} className="flex-1" disabled={bookingLoading}>
                {bookingLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button variant="outline" onClick={() => setShowRequestModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#DCFCE7' }}>
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Booking Request Submitted!</h2>
            <p className="text-gray-500 mb-6">Your booking request has been submitted successfully and is pending approval.</p>
            <Button onClick={() => setShowSuccessModal(false)} className="w-full">
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchRooms;
