import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, Eye, Power, X, AlertTriangle, ArrowRight } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { roomAPI } from '../../services/api';

const AdminRoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [affectedBookings, setAffectedBookings] = useState([]);
  const [alternativeRooms, setAlternativeRooms] = useState([]);
  const [showAffectedModal, setShowAffectedModal] = useState(false);
  const [relocatingRoom, setRelocatingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    facilities: '',
    location: '',
    floor: '',
    building: ''
  });

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

  const handleAdd = () => {
    setEditingRoom(null);
    setFormData({ name: '', capacity: '', facilities: '', location: '', floor: '', building: '' });
    setShowModal(true);
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity?.toString() || '',
      facilities: room.facilities?.join(', ') || '',
      location: room.location || '',
      floor: room.floor || '',
      building: room.building || ''
    });
    setShowModal(true);
  };

  const handleView = (room) => {
    setSelectedRoom(room);
    setShowViewModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.capacity) {
        alert('Please fill in all required fields');
        return;
      }

      const roomData = {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        facilities: formData.facilities.split(',').map(f => f.trim()).filter(Boolean),
        location: formData.location,
        floor: formData.floor,
        building: formData.building
      };

      if (editingRoom) {
        await roomAPI.update(editingRoom._id, roomData);
      } else {
        await roomAPI.create(roomData);
      }
      fetchRooms();
      setShowModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save room');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await roomAPI.delete(id);
        fetchRooms();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete room');
      }
    }
  };

  const toggleStatus = async (room) => {
    try {
      const newStatus = room.status === 'available' ? 'maintenance' : 'available';
      const response = await roomAPI.toggleStatus(room._id, newStatus);

      // If setting to maintenance and there are affected bookings, show modal
      if (newStatus === 'maintenance' && response.data.data.affectedBookings?.length > 0) {
        setSelectedRoom(room);
        setAffectedBookings(response.data.data.affectedBookings);
        setAlternativeRooms(response.data.data.alternativeRooms || []);
        setShowAffectedModal(true);
      }

      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update room status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Room Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all rooms and their availability</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="outline" onClick={fetchRooms} className="flex-1 sm:flex-none">
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAdd} className="flex-1 sm:flex-none">
            <Plus size={18} className="mr-2" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: '#E5E7EB' }}>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Building</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Floor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Capacity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">Loading...</td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">No rooms found</td>
                </tr>
              ) : (
                rooms.map((room, index) => (
                  <tr key={room._id} className="border-b hover:bg-gray-50" style={{ borderColor: '#F3F4F6' }}>
                    <td className="px-4 py-4 text-sm text-gray-700">#{index + 1}</td>
                    <td className="px-4 py-4 text-sm text-gray-700 font-medium">{room.name}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{room.building || '-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{room.floor || '-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-700">{room.capacity}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={room.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleView(room)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleEdit(room)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => toggleStatus(room)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors">
                          <Power size={16} />
                        </button>
                        <button onClick={() => handleDelete(room._id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
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
        ) : rooms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No rooms found</div>
        ) : (
          rooms.map((room) => (
            <div key={room._id} className="bg-white rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800">{room.name}</p>
                  <p className="text-sm text-gray-500">{room.building || '-'} - {room.floor || '-'}</p>
                </div>
                <StatusBadge status={room.status} />
              </div>
              <div className="text-sm text-gray-600 mb-3">
                <p>Capacity: {room.capacity}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleView(room)} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center justify-center gap-1" style={{ border: '1px solid #E5E7EB', color: '#374151' }}>
                  <Eye size={14} /> View
                </button>
                <button onClick={() => handleEdit(room)} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-50 text-blue-600 flex items-center justify-center gap-1">
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={() => toggleStatus(room)} className="px-3 py-2 rounded-lg text-xs font-medium hover:bg-yellow-50 text-yellow-600">
                  <Power size={14} />
                </button>
                <button onClick={() => handleDelete(room._id)} className="px-3 py-2 rounded-lg text-xs font-medium hover:bg-red-50 text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Conference Room A" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                  <input type="text" value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Main Building" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <input type="text" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="1st Floor" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facilities (comma-separated)</label>
                <input type="text" value={formData.facilities} onChange={(e) => setFormData({ ...formData, facilities: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Wi-Fi, Smart Board, Projector" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="flex-1">{editingRoom ? 'Update' : 'Add Room'}</Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedRoom && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Room Details</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div><p className="text-sm text-gray-500">Room Name</p><p className="font-medium text-gray-800">{selectedRoom.name}</p></div>
              <div><p className="text-sm text-gray-500">Building</p><p className="font-medium text-gray-800">{selectedRoom.building || '-'}</p></div>
              <div><p className="text-sm text-gray-500">Floor</p><p className="font-medium text-gray-800">{selectedRoom.floor || '-'}</p></div>
              <div><p className="text-sm text-gray-500">Capacity</p><p className="font-medium text-gray-800">{selectedRoom.capacity} people</p></div>
              <div>
                <p className="text-sm text-gray-500">Facilities</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedRoom.facilities?.map((facility, i) => (
                    <span key={i} className="px-2 py-1 text-xs rounded-md" style={{ background: '#E5E7EB', color: '#374151' }}>{facility}</span>
                  ))}
                </div>
              </div>
              <div><p className="text-sm text-gray-500">Status</p><StatusBadge status={selectedRoom.status} /></div>
            </div>
            <div className="mt-6">
              <Button variant="outline" onClick={() => setShowViewModal(false)} className="w-full">Close</Button>
            </div>
          </div>
        </div>
      )}

      {/* Affected Bookings Modal */}
      {showAffectedModal && selectedRoom && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-yellow-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Bookings in Queue</h2>
              </div>
              <button onClick={() => setShowAffectedModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              The following bookings are affected by setting <strong>{selectedRoom.name}</strong> to maintenance.
              {alternativeRooms.length > 0 && ' You can relocate them to an available room.'}
              {alternativeRooms.length === 0 && ' No alternative rooms with sufficient capacity are available.'}
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {affectedBookings.map((booking) => (
                <div key={booking._id} className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{booking.userId?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{booking.userId?.employeeId || 'N/A'} &bull; {new Date(booking.date).toLocaleDateString()} &bull; {booking.startTime} - {booking.endTime}</p>
                      <p className="text-sm text-gray-600 mt-1">{booking.purpose}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${booking.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {alternativeRooms.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2">Select alternative room to relocate all bookings:</p>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={relocatingRoom?._id || ''}
                  onChange={(e) => {
                    const room = alternativeRooms.find(r => r._id === e.target.value);
                    setRelocatingRoom(room || null);
                  }}
                >
                  <option value="">-- Select Room --</option>
                  {alternativeRooms.map((room) => (
                    <option key={room._id} value={room._id}>
                      {room.name} (Capacity: {room.capacity})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                onClick={async () => {
                  if (!relocatingRoom && alternativeRooms.length > 0) {
                    alert('Please select an alternative room');
                    return;
                  }
                  // TODO: Call backend to relocate bookings
                  alert('Booking relocation feature coming soon. Affected requestors will be notified.');
                  setShowAffectedModal(false);
                }}
                className="flex-1"
                disabled={alternativeRooms.length > 0 && !relocatingRoom}
              >
                {alternativeRooms.length > 0 ? 'Reallocate & Notify' : 'Close'}
              </Button>
              <Button variant="outline" onClick={() => setShowAffectedModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoomManagement;
