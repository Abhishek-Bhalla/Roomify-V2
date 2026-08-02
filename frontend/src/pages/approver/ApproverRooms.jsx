import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, Eye, Power, X, Wrench } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { roomAPI, userAPI, maintenanceAPI } from '../../services/api';

const CATEGORIES = ['electrical', 'hvac', 'furniture', 'cleaning', 'renovation', 'plumbing', 'internet', 'projector', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const ApproverRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', search: '' });

  // Maintenance modal state
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceRoom, setMaintenanceRoom] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    issueCategory: 'electrical',
    priority: 'medium',
    description: '',
    assignedTo: '',
    expectedCompletion: '',
  });
  const [maintenanceUsers, setMaintenanceUsers] = useState([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    facilities: [],
    customFacility: '',
    building: '',
    floor: '',
    roomCode: ''
  });
  const [generatedRoomId, setGeneratedRoomId] = useState('');

  const facilityOptions = ['Wi-Fi', 'Smart Board', 'Extension Sockets', 'Projector', 'AC', 'Whiteboard', 'TV', 'Computer', 'Video Conferencing', 'Audio System'];

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
    return `${buildingInitial}-${floorAbbr}-${roomCode}`;
  };

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

  const fetchMaintenanceUsers = async () => {
    try {
      const res = await userAPI.getAll();
      const users = (res.data.data.users || []).filter(
        (u) => u.role === 'maintenance' && u.status === 'active'
      );
      setMaintenanceUsers(users);
    } catch (err) {
      console.error('Failed to fetch maintenance users:', err);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchMaintenanceUsers();
  }, []);

  const handleAdd = () => {
    setEditingRoom(null);
    setFormData({ name: '', capacity: '', facilities: [], customFacility: '', building: '', floor: '', roomCode: '' });
    setGeneratedRoomId('');
    setShowModal(true);
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity?.toString() || '',
      facilities: room.facilities || [],
      customFacility: '',
      building: room.building || '',
      floor: room.floor || '',
      roomCode: room.roomCode || ''
    });
    setGeneratedRoomId(room.roomId || '');
    setShowModal(true);
  };

  const handleView = (room) => {
    setSelectedRoom(room);
    setShowViewModal(true);
  };

  const handleFormChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

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
        facilities: formData.facilities,
        building: formData.building,
        floor: formData.floor,
        roomCode: formData.roomCode
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
      await roomAPI.toggleStatus(room._id, newStatus);
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update room status');
    }
  };

  const handleOpenMaintenance = (room) => {
    if (room.maintenanceStatus && room.maintenanceStatus !== 'none') {
      alert('Room is already in maintenance.');
      return;
    }
    setMaintenanceRoom(room);
    setMaintenanceForm({
      issueCategory: 'electrical',
      priority: 'medium',
      description: '',
      assignedTo: '',
      expectedCompletion: '',
    });
    setShowMaintenanceModal(true);
  };

  const handleSubmitMaintenance = async () => {
    if (!maintenanceRoom) return;
    try {
      setMaintenanceLoading(true);
      const payload = {
        roomId: maintenanceRoom._id,
        issueCategory: maintenanceForm.issueCategory,
        priority: maintenanceForm.priority,
        description: maintenanceForm.description,
      };
      if (maintenanceForm.assignedTo) payload.assignedTo = maintenanceForm.assignedTo;
      if (maintenanceForm.expectedCompletion) payload.expectedCompletion = maintenanceForm.expectedCompletion;
      await maintenanceAPI.create(payload);
      setShowMaintenanceModal(false);
      setMaintenanceRoom(null);
      fetchRooms();
      alert('Room marked under maintenance. A task has been assigned.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create maintenance task');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room => {
    if (filters.status !== 'all' && room.status !== filters.status) return false;
    if (filters.search && !room.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !room.building?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const handleFacilityToggle = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleAddCustomFacility = () => {
    if (formData.customFacility.trim()) {
      setFormData(prev => ({
        ...prev,
        facilities: prev.facilities.includes(formData.customFacility.trim())
          ? prev.facilities
          : [...prev.facilities, formData.customFacility.trim()],
        customFacility: ''
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Rooms</h1>
          <p className="text-gray-500 text-sm mt-1">Add, edit, and manage all rooms</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            Filters
          </Button>
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

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E5E7EB' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Room name, building..."
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
                <option value="maintenance">Maintenance (legacy)</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="maintenance_assigned">Maintenance Assigned</option>
                <option value="maintenance_in_progress">Maintenance In Progress</option>
                <option value="maintenance_review_pending">Review Pending</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setFilters({ status: 'all', search: '' })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {isLoading ? (
          <p className="col-span-full text-center text-gray-500 py-12">Loading rooms...</p>
        ) : filteredRooms.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 py-12">No rooms found</p>
        ) : (
          filteredRooms.map((room) => (
            <div
              key={room._id}
              className="bg-white rounded-xl border p-4 md:p-5"
              style={{ borderColor: '#E5E7EB' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ background: '#2563EB' }}
                >
                  {room.name.charAt(0)}
                </div>
                <StatusBadge status={room.status} />
              </div>

              <p className="text-xs text-gray-400 mb-1">Room ID: {room.roomId || 'N/A'}</p>
              <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-1">{room.name}</h3>
              <p className="text-sm text-gray-500 mb-3">
                {room.building} - {room.floor} - {room.roomCode}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span>Capacity: {room.capacity}</span>
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleView(room)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-gray-50 flex items-center justify-center gap-1"
                  style={{ border: '1px solid #E5E7EB', color: '#374151' }}
                >
                  <Eye size={14} />
                  View
                </button>
                <button
                  onClick={() => handleEdit(room)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-blue-50 text-blue-600 flex items-center justify-center gap-1"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleOpenMaintenance(room)}
                  disabled={room.maintenanceStatus && room.maintenanceStatus !== 'none'}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-orange-50 text-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  title={room.maintenanceStatus && room.maintenanceStatus !== 'none' ? 'Already under maintenance' : 'Mark under maintenance'}
                >
                  <Wrench size={14} />
                </button>
                <button
                  onClick={() => toggleStatus(room)}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-yellow-50 text-yellow-600"
                  title="Quick toggle legacy status"
                >
                  <Power size={14} />
                </button>
                <button
                  onClick={() => handleDelete(room._id)}
                  className="px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-red-50 text-red-600"
                >
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
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Room ID (Auto-generated)</p>
                <p className="font-semibold text-blue-600">{generatedRoomId || 'Fill Building, Floor & Room Code'}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Building *</label>
                  <input
                    type="text"
                    value={formData.building}
                    onChange={(e) => handleFormChange('building', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => handleFormChange('floor', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First Floor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Code *</label>
                  <input
                    type="text"
                    value={formData.roomCode}
                    onChange={(e) => handleFormChange('roomCode', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="101"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Conference Room A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Facilities</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {facilityOptions.map(facility => (
                    <label key={facility} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.facilities.includes(facility)}
                        onChange={() => handleFacilityToggle(facility)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{facility}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.customFacility}
                    onChange={(e) => setFormData({ ...formData, customFacility: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomFacility())}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add custom facility..."
                  />
                  <Button variant="outline" onClick={handleAddCustomFacility}>Add</Button>
                </div>
                {formData.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.facilities.map(facility => (
                      <span key={facility} className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                        {facility}
                        <button onClick={() => handleFacilityToggle(facility)} className="hover:text-blue-900">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} className="flex-1">
                {editingRoom ? 'Update' : 'Add Room'}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
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
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Room Name</p>
                <p className="font-medium text-gray-800">{selectedRoom.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Building</p>
                <p className="font-medium text-gray-800">{selectedRoom.building || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Floor</p>
                <p className="font-medium text-gray-800">{selectedRoom.floor || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="font-medium text-gray-800">{selectedRoom.capacity} people</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Facilities</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedRoom.facilities?.map((facility, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs rounded-full"
                      style={{ background: '#E5E7EB', color: '#374151' }}
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <StatusBadge status={selectedRoom.status} />
              </div>
            </div>
            <div className="mt-6">
              <Button variant="outline" onClick={() => setShowViewModal(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    {/* Mark Under Maintenance Modal */}
      {showMaintenanceModal && maintenanceRoom && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Mark Under Maintenance</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {maintenanceRoom.name} • {maintenanceRoom.building} - {maintenanceRoom.floor}
                </p>
              </div>
              <button
                onClick={() => setShowMaintenanceModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Category *</label>
                  <select
                    value={maintenanceForm.issueCategory}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, issueCategory: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <select
                    value={maintenanceForm.priority}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Briefly describe the issue..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={maintenanceForm.assignedTo}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Auto-assign (least busy)</option>
                  {maintenanceUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.employeeId || u.email})
                    </option>
                  ))}
                </select>
                {maintenanceUsers.length === 0 && (
                  <p className="text-xs text-yellow-700 mt-1">
                    No active maintenance incharge found — ask an admin to create one.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion</label>
                <input
                  type="date"
                  value={maintenanceForm.expectedCompletion}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, expectedCompletion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-sm text-orange-800">
                The room will be hidden from requester searches until maintenance is approved and the room is restored.
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleSubmitMaintenance} disabled={maintenanceLoading} className="flex-1">
                {maintenanceLoading ? 'Creating...' : 'Mark Under Maintenance'}
              </Button>
              <Button variant="outline" onClick={() => setShowMaintenanceModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApproverRooms;
