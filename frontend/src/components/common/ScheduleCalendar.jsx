import { useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import Button from './Button';

const ScheduleCalendar = ({ bookings, isLoading, onRefresh, title, subtitle }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [expandedDay, setExpandedDay] = useState(null);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    const startPadding = firstDay.getDay();
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getBookingsForDate = (date) => {
    if (!date) return [];
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return bookings.filter(booking => {
      const bookingDateStr = booking.date.includes('T')
        ? booking.date.split('T')[0]
        : booking.date;
      const [bYear, bMonth, bDay] = bookingDateStr.split('-').map(Number);
      return bYear === year && bMonth === month + 1 && bDay === day;
    });
  };

  const days = getDaysInMonth(currentDate);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
      case 'rejected':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      default:
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh} className="w-full sm:w-auto text-sm">
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-base sm:text-lg font-semibold text-gray-800 min-w-[140px] sm:min-w-[160px] text-center">
              {monthYear}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b hidden sm:grid" style={{ borderColor: '#E5E7EB' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className="px-2 py-3 text-center text-xs sm:text-sm font-semibold text-gray-500 bg-gray-50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day Headers - Mobile */}
        <div className="grid grid-cols-7 border-b sm:hidden" style={{ borderColor: '#E5E7EB' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div
              key={i}
              className="px-1 py-2 text-center text-xs font-semibold text-gray-500 bg-gray-50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayBookings = getBookingsForDate(day);
            const isToday = day && day.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-[80px] sm:min-h-[100px] md:min-h-[120px] border-b border-r p-1 sm:p-2 ${
                  !day ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                }`}
                style={{ borderColor: '#F3F4F6' }}
              >
                {day && (
                  <>
                    <div className={`text-xs sm:text-sm font-medium mb-1 ${
                      isToday ? 'w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-500 text-white flex items-center justify-center' : 'text-gray-700'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, expandedDay === index ? dayBookings.length : 2).map(booking => {
                        const colors = getStatusColor(booking.status);
                        return (
                        <div
                          key={booking._id}
                          className={`text-xs p-1 rounded ${colors.bg} ${colors.text} truncate hidden sm:block cursor-pointer border ${colors.border}`}
                          onMouseEnter={(e) => {
                            setHoveredBooking(booking);
                            setTooltipPosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredBooking(null)}
                        >
                          {booking.startTime} {booking.roomId?.name}
                        </div>
                        );
                      })}
                      {dayBookings.slice(0, 1).map(booking => {
                        const colors = getStatusColor(booking.status);
                        return (
                        <div
                          key={booking._id}
                          className={`text-xs p-1 rounded ${colors.bg} ${colors.text} truncate sm:hidden cursor-pointer border ${colors.border}`}
                          onMouseEnter={(e) => {
                            setHoveredBooking(booking);
                            setTooltipPosition({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredBooking(null)}
                        >
                          {booking.startTime}
                        </div>
                        );
                      })}
                      {dayBookings.length > 1 && (
                        <div className="text-xs text-gray-500 sm:hidden">
                          +{dayBookings.length - 1}
                        </div>
                      )}
                      {dayBookings.length > 2 && expandedDay !== index && (
                        <button
                          onClick={() => setExpandedDay(expandedDay === index ? null : index)}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          +{dayBookings.length - 2} more
                        </button>
                      )}
                      {dayBookings.length > 2 && expandedDay === index && (
                        <button
                          onClick={() => setExpandedDay(null)}
                          className="text-xs text-primary font-medium hover:underline"
                        >
                          Show less
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredBooking && (
        <div
          className="fixed z-50 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y + 10,
            pointerEvents: 'none',
          }}
        >
          <div className="font-semibold">{hoveredBooking.roomId?.name || 'Room'}</div>
          <div className="text-gray-300">
            {hoveredBooking.startTime} - {hoveredBooking.endTime}
          </div>
          <div className="text-xs mt-1">
            Status: <span className={`px-2 py-0.5 rounded-full text-white ${
              hoveredBooking.status === 'approved' ? 'bg-green-500' :
              hoveredBooking.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {hoveredBooking.status}
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Duration: {
              (() => {
                const [startH, startM] = hoveredBooking.startTime.split(':').map(Number);
                const [endH, endM] = hoveredBooking.endTime.split(':').map(Number);
                const durationMins = (endH * 60 + endM) - (startH * 60 + startM);
                const hours = Math.floor(durationMins / 60);
                const mins = durationMins % 60;
                return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
              })()
            }
          </div>
          {hoveredBooking.purpose && (
            <div className="text-xs text-gray-400 mt-1 max-w-[200px] truncate">
              {hoveredBooking.purpose}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
          <span className="text-sm text-gray-600">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200"></div>
          <span className="text-sm text-gray-600">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
          <span className="text-sm text-gray-600">Rejected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">15</div>
          <span className="text-sm text-gray-600">Today</span>
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;
