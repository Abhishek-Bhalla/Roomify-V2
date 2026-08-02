import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Eye, Wrench } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/common/Button';
import { roomAPI } from '../../services/api';

const AdminRoomsView = () => {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      // Admin view: include rooms currently in maintenance
      const response = await roomAPI.getAll({ includeMaintenance: 'true' });
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

  const handleView = (room) => {
    setSelectedRoom(room);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Rooms</h1>
          <p className="text-gray-500 text-sm mt-1">View all rooms (read-only)</p>
        </div>
        <Button variant="outline" onClick={fetchRooms} className="w-full sm:w-auto">
          <RefreshCw size={18} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {isLoading ? (
          <p className="col-span-full text-center text-gray-500 py-12">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p className="col-span-full text-center text-gray-500 py-12">No rooms found</p>
        ) : (
          rooms.map((room) => (
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

              <h3 className="font-semibold text-gray-800 text-base md:text-lg mb-1">{room.name}</h3>
              <p className="text-sm text-gray-500 mb-3">
                {room.building || 'Main Building'} - {room.floor || 'Floor 1'}
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
                <Link
                  to={`/admin/maintenance?roomId=${room._id}`}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-orange-50 text-orange-600 flex items-center justify-center gap-1"
                  style={{ border: '1px solid #E5E7EB' }}
                  title="View maintenance history"
                >
                  <Wrench size={14} />
                  History
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Modal */}
      {showModal && selectedRoom && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Room Details</h2>
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
              {selectedRoom.maintenanceStatus && selectedRoom.maintenanceStatus !== 'none' && (
                <div>
                  <p className="text-sm text-gray-500">Maintenance Status</p>
                  <StatusBadge status={selectedRoom.maintenanceStatus} />
                  {selectedRoom.lastMaintenanceDate && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last maintained: {new Date(selectedRoom.lastMaintenanceDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoomsView;
