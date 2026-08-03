import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import NotificationBell from '../common/NotificationBell';
import { Menu, X } from 'lucide-react';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  const roleLabels = {
    admin: 'Administrator',
    approver: 'Approver',
    requester: 'Requester',
    maintenance: 'Maintenance Incharge',
  };

  return (
    <header
      className="fixed top-0 right-0 z-10 bg-white border-b md:border-b-0"
      style={{
        left: 0,
        height: '64px',
        borderColor: '#E5E7EB'
      }}
    >
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>

        {/* Spacer for mobile */}
        <div className="lg:hidden w-10" />

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          <NotificationBell />
          <Link
            to="/profile"
            className="flex items-center gap-2 pl-2 md:pl-3 border-l border-gray-200 hover:opacity-80"
            title="Open my profile"
          >
            <Avatar user={user} size={32} />
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">{roleLabels[user?.role]}</p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
