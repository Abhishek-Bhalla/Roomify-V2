import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardCheck,
  DoorOpen,
  Calendar,
  LogOut,
  Search,
  BookOpen,
  Users,
  Upload,
  X,
  Star,
} from 'lucide-react';
import RLogo from '../../assets/R.png';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const links = {
    admin: [
      { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/admin/users', icon: Users, label: 'Manage Users' },
      { to: '/admin/bulk-upload', icon: Upload, label: 'Bulk Upload' },
      { to: '/admin/bookings', icon: ClipboardCheck, label: 'View Bookings' },
      { to: '/admin/rooms', icon: DoorOpen, label: 'View Rooms' },
      { to: '/admin/schedule', icon: Calendar, label: 'Schedule' },
    ],
    approver: [
      { to: '/approver', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/approver/rooms', icon: DoorOpen, label: 'Manage Rooms' },
      { to: '/approver/requests', icon: ClipboardCheck, label: 'Booking Requests' },
      { to: '/approver/schedule', icon: Calendar, label: 'Schedule' },
      { to: '/approver/feedback', icon: Star, label: 'Feedback' },
    ],
    requester: [
      { to: '/requester', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/requester/search', icon: Search, label: 'Search Rooms' },
      { to: '/requester/bookings', icon: BookOpen, label: 'My Bookings' },
      { to: '/requester/schedule', icon: Calendar, label: 'My Schedule' },
      { to: '/requester/feedback', icon: Star, label: 'Feedback' },
    ],
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <aside
      className="h-screen flex flex-col bg-white border-r overflow-y-auto"
      style={{
        width: '240px',
        borderColor: '#E5E7EB'
      }}
    >
      {/* Top Branding */}
      <div className="p-5 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={RLogo} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
          <h1 className="text-lg font-bold text-gray-800 whitespace-nowrap">Roomify</h1>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links[user?.role]?.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === `/${user?.role}`}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-blue-500 text-white rounded-lg'
                  : 'text-gray-700 hover:bg-gray-100 rounded-lg'
              }`
            }
          >
            <link.icon size={20} className="flex-shrink-0" />
            <span className="whitespace-nowrap">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
