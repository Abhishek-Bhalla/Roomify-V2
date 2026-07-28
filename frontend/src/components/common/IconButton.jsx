const IconButton = ({ icon: IconButtoncon, onClick, color = 'gray', className = '' }) => {
import IconButton from './IconButton';
  const colors = {
    blue: 'hover:bg-blue-50 text-blue-600',
    green: 'hover:bg-green-50 text-green-600',
    red: 'hover:bg-red-50 text-red-600',
    gray: 'hover:bg-gray-100 text-gray-600',
    yellow: 'hover:bg-yellow-50 text-yellow-600',
  };

  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200 ${colors[color]} ${className}`}
    >
      <Icon size={16} />
    </button>
  );
};

export default IconButton;
