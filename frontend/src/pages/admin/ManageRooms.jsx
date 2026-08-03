import { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Plus, Edit2, Trash2, Power, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { roomAPI } from '../../services/api';

const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({ name: '', capacity: '', facilities: '', building: '', floor: '', roomCode: '' });
  const [filters, setFilters] = useState({ status: 'all', capacityMin: '', capacityMax: '', search: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [affectedBookings, setAffectedBookings] = useState([]);
  const [alternativeRooms, setAlternativeRooms] = useState([]);
  const [showAffectedModal, setShowAffectedModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [relocatingRoom, setRelocatingRoom] = useState(null);

  // Generate room ID preview
  const generateRoomIdPreview = (building, floor, roomCode) => {
    if (!building || !floor || !roomCode) return '';
    const buildingInitial = building.charAt(0).toUpperCase();
    const floorMappings = {
      'ground floor': 'GF', 'first floor': 'FF', 'second floor': 'SF', 'third floor': 'TF',
      'ground': 'GF', 'first': 'FF', 'second': 'SF', 'third': 'TF'
    };
    const floorLower = floor.toLowerCase();
    let floorAbbr = floorMappings[floorLower] || (floor.length <= 2 ? floor.toUpperCase() : floor.substring(0, 2).toUpperCase());
    if (/^\d/.test(floor)) {
      floorAbbr = floor.charAt(0) + 'F';
    }
    return `${buildingInitial}${floorAbbr}${roomCode}`;
  };

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await roomAPI.getAll();
      setRooms(response.data.data.rooms);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch rooms');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleAdd = () => {
    setEditingRoom(null);
    setFormData({ name: '', capacity: '', facilities: '', building: '', floor: '', roomCode: '' });
    setGeneratedRoomId('');
    setShowModal(true);
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity.toString(),
      facilities: room.facilities.join(', '),
      building: room.building || '',
      floor: room.floor || '',
      roomCode: room.roomCode || '',
    });
    setGeneratedRoomId(room.roomId || '');
    setShowModal(true);
  };

  const handleFormChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Update room ID preview when building, floor, or roomCode changes
    if (field === 'building' || field === 'floor' || field === 'roomCode') {
      const preview = generateRoomIdPreview(
        field === 'building' ? value : newFormData.building,
        field === 'floor' ? value : newFormData.floor,
        field === 'roomCode' ? value : newFormData.roomCode
      );
      setGeneratedRoomId(preview);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.capacity || !formData.building || !formData.floor || !formData.roomCode) {
        alert('Please fill in all required fields (Building, Floor, Room Code)');
        return;
      }

      const roomData = {
        name: formData.name,
        capacity: parseInt(formData.capacity),
        facilities: formData.facilities.split(',').map(f => f.trim()).filter(Boolean),
        building: formData.building,
        floor: formData.floor,
        roomCode: formData.roomCode,
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

      // If setting to maintenance, check affected bookings first (preview only, don't apply)
      if (newStatus === 'maintenance') {
        const response = await roomAPI.getAffectedBookings(room._id);
        const responseData = response.data?.data || {};
        const bookings = responseData.affectedBookings || [];
        const alternatives = responseData.alternativeRooms || [];

        setSelectedRoom(room);
        setAffectedBookings(bookings);
        setAlternativeRooms(alternatives);
        setRelocatingRoom(null);
        setShowAffectedModal(true);
        return;
      }

      // For available status (re-enabling), just toggle directly
      await roomAPI.toggleStatus(room._id, newStatus);
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update room status');
    }
  };

  const handleRelocateAndMaintain = async () => {
    if (!selectedRoom) return;

    try {
      if (alternativeRooms.length > 0 && !relocatingRoom) {
        alert('Please select an alternative room to relocate bookings');
        return;
      }

      // Relocate bookings if alternative room selected
      if (relocatingRoom && affectedBookings.length > 0) {
        await roomAPI.relocateBookings(
          selectedRoom._id,
          relocatingRoom._id,
          affectedBookings.map(b => b._id)
        );
      }

      // Now set room to maintenance
      await roomAPI.toggleStatus(selectedRoom._id, 'maintenance');

      setShowAffectedModal(false);
      fetchRooms();
      alert(
        affectedBookings.length > 0 && relocatingRoom
          ? `Room set to maintenance. ${affectedBookings.length} bookings relocated to ${relocatingRoom.name}.`
          : 'Room set to maintenance successfully.'
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete operation');
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (filters.status !== 'all' && room.status !== filters.status) return false;
    if (filters.capacityMin && room.capacity < parseInt(filters.capacityMin)) return false;
    if (filters.capacityMax && room.capacity > parseInt(filters.capacityMax)) return false;
    if (filters.search && !room.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !room.building?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !room.location?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Rooms</h1>
          <p className="text-gray-500">Add, edit, or manage rooms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            Filters
          </Button>
          <Button variant="outline" onClick={fetchRooms}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
          <Button onClick={handleAdd}>
            <Plus size={18} className="mr-2" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border p-4 lg:p-6" style={{ borderColor: '#E5E7EB' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Room name, building, location..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Capacity</label>
              <input
                type="number"
                value={filters.capacityMin}
                onChange={(e) => setFilters({ ...filters, capacityMin: e.target.value })}
                placeholder="Min"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
              <input
                type="number"
                value={filters.capacityMax}
                onChange={(e) => setFilters({ ...filters, capacityMax: e.target.value })}
                placeholder="Max"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setFilters({ status: 'all', capacityMin: '', capacityMax: '', search: '' })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && <p>Loading rooms...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {!isLoading && !error && filteredRooms.length === 0 && <p>No rooms found.</p>}
        {filteredRooms.map((room) => (
          <Card key={room._id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">{room.name.charAt(0)}</span>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                room.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {room.status}
              </span>
            </div>

            <div className="mb-2">
              <p className="text-xs text-gray-400">Room ID: {room.roomId || 'N/A'}</p>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{room.name}</h3>
            <p className="text-sm text-gray-500 mb-1">Capacity: {room.capacity} people</p>
            <p className="text-sm text-gray-500 mb-3">
              {room.building} - {room.floor} - {room.roomCode}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {room.facilities.map((facility, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {facility}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleEdit(room)} className="flex-1 text-sm py-1.5">
                <Edit2 size={14} className="mr-1" />
                Edit
              </Button>
              <Button
                variant={room.status === 'available' ? 'danger' : 'success'}
                onClick={() => toggleStatus(room)}
                className="flex-1 text-sm py-1.5"
              >
                <Power size={14} className="mr-1" />
                {room.status === 'available' ? 'Disable' : 'Enable'}
              </Button>
              <button
                onClick={() => handleDelete(room._id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingRoom ? 'Edit Room' : 'Add New Room'}
            </h2>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Room ID (Auto-generated)</p>
                <p className="font-semibold text-blue-600">{generatedRoomId || 'Fill Building, Floor & Room Code'}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  label="Building *"
                  value={formData.building}
                  onChange={(e) => handleFormChange('building', e.target.value)}
                  placeholder="A"
                />
                <Input
                  label="Floor *"
                  value={formData.floor}
                  onChange={(e) => handleFormChange('floor', e.target.value)}
                  placeholder="First Floor"
                />
                <Input
                  label="Room Code *"
                  value={formData.roomCode}
                  onChange={(e) => handleFormChange('roomCode', e.target.value)}
                  placeholder="101"
                />
              </div>
              <Input
                label="Room Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
              <Input
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleFormChange('capacity', e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
                <div className="grid grid-cols-2 gap-2 border p-3 rounded-lg">
                  {['Wi-Fi', 'Smart Board', 'Extension Sockets', 'Projector', 'AC', 'Whiteboard', 'TV', 'Computer', 'Video Conferencing', 'Audio System'].map((f) => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.facilities.split(',').map(item => item.trim()).includes(f)}
                        onChange={(e) => {
                          const currentFacilities = formData.facilities.split(',').map(item => item.trim()).filter(Boolean);
                          const newFacilities = e.target.checked
                            ? [...currentFacilities, f]
                            : currentFacilities.filter(item => item !== f);
                          handleFormChange('facilities', newFacilities.join(', '));
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="flex-1">Save</Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>

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
            {affectedBookings.length > 0
              ? <>The following bookings are affected by setting <strong>{selectedRoom.name}</strong> to maintenance. {alternativeRooms.length > 0 ? 'You can relocate them to an available room.' : 'No alternative rooms with sufficient capacity are available.'}</>
              : <>No bookings are affected. <strong>{selectedRoom.name}</strong> will be set to maintenance.</>
            }
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
              onClick={handleRelocateAndMaintain}
              className="flex-1"
              disabled={alternativeRooms.length > 0 && !relocatingRoom}
            >
              {alternativeRooms.length > 0 ? 'Reallocate & Set Maintenance' : 'Set Maintenance'}
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

export default ManageRooms;