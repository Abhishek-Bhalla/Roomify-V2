import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, MessageSquare, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { feedbackAPI } from '../../services/api';

const MyFeedback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingIdFromUrl = searchParams.get('bookingId');

  const [completedBookings, setCompletedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Smart dynamic feedback fields
  const [impressedWith, setImpressedWith] = useState([]);
  const [couldImprove, setCouldImprove] = useState([]);
  const [missing, setMissing] = useState([]);
  const [issues, setIssues] = useState([]);
  const [otherFeedback, setOtherFeedback] = useState('');
  const [wantsFollowUp, setWantsFollowUp] = useState(false);

  const fetchCompletedBookings = async () => {
    setLoading(true);
    try {
      const res = await feedbackAPI.getCompletedBookings();
      setCompletedBookings(res.data.data.bookings);

      // If bookingId in URL, auto-select that booking
      if (bookingIdFromUrl) {
        const booking = res.data.data.bookings.find(b => b._id === bookingIdFromUrl);
        if (booking && !booking.hasFeedback) {
          setSelectedBooking(booking);
        }
      }
    } catch (error) {
      console.error('Failed to fetch completed bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedBookings();
  }, [bookingIdFromUrl]);

  const resetForm = () => {
    setRating(0);
    setComment('');
    setImpressedWith([]);
    setCouldImprove([]);
    setMissing([]);
    setIssues([]);
    setOtherFeedback('');
    setWantsFollowUp(false);
  };

  const handleSelectOption = (field, value) => {
    const current = field === 'impressedWith' ? impressedWith
      : field === 'couldImprove' ? couldImprove
      : field === 'missing' ? missing
      : issues;

    const setter = field === 'impressedWith' ? setImpressedWith
      : field === 'couldImprove' ? setCouldImprove
      : field === 'missing' ? setMissing
      : setIssues;

    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking || rating === 0) return;

    setSubmitting(true);
    setError('');
    try {
      await feedbackAPI.submit({
        bookingId: selectedBooking._id,
        rating,
        comment,
        impressedWith: rating === 5 ? impressedWith : [],
        couldImprove: rating === 4 ? couldImprove : [],
        missing: rating === 3 ? missing : [],
        issues: rating <= 2 ? issues : [],
        otherFeedback,
        wantsFollowUp
      });
      setSuccessMessage('Thank you! Your feedback has been submitted.');
      setSelectedBooking(null);
      resetForm();
      fetchCompletedBookings();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarOptions = () => {
    if (rating === 5) {
      return (
        <div className="space-y-3">
          <p className="font-medium text-gray-700">What impressed you most?</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'easy_booking', label: 'Easy booking' },
              { value: 'fast_approval', label: 'Fast approval' },
              { value: 'clean_facility', label: 'Clean facility' },
              { value: 'well_maintained_equipment', label: 'Well-maintained equipment' },
              { value: 'friendly_staff', label: 'Friendly staff' },
              { value: 'everything_smooth', label: 'Everything was smooth' }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectOption('impressedWith', opt.value)}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  impressedWith.includes(opt.value)
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (rating === 4) {
      return (
        <div className="space-y-3">
          <p className="font-medium text-gray-700">What could make it even better?</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'faster_approval', label: 'Faster approval' },
              { value: 'better_equipment', label: 'Better equipment' },
              { value: 'cleaner_room', label: 'Cleaner room' },
              { value: 'more_time_slots', label: 'More available time slots' },
              { value: 'better_internet', label: 'Better internet' }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectOption('couldImprove', opt.value)}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  couldImprove.includes(opt.value)
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (rating === 3) {
      return (
        <div className="space-y-3">
          <p className="font-medium text-gray-700">What was missing?</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'equipment_quality', label: 'Equipment quality' },
              { value: 'cleanliness', label: 'Cleanliness' },
              { value: 'approval_speed', label: 'Approval speed' },
              { value: 'room_comfort', label: 'Room comfort' },
              { value: 'booking_process', label: 'Booking process' }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectOption('missing', opt.value)}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  missing.includes(opt.value)
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (rating <= 2) {
      return (
        <div className="space-y-3">
          <p className="font-medium text-gray-700">What went wrong?</p>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'equipment_failure', label: 'Equipment failure' },
              { value: 'room_unavailable', label: 'Room unavailable' },
              { value: 'booking_conflict', label: 'Booking conflict' },
              { value: 'long_approval_time', label: 'Long approval time' },
              { value: 'staff_issue', label: 'Staff issue' },
              { value: 'room_not_clean', label: "Room wasn't clean" },
              { value: 'internet_issue', label: 'Internet issue' },
              { value: 'incorrect_booking', label: 'Incorrect booking' }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectOption('issues', opt.value)}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  issues.includes(opt.value)
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Follow-up option for low ratings */}
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <p className="font-medium text-gray-700 mb-3">Would you like us to follow up on this issue?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWantsFollowUp(true)}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  wantsFollowUp
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-700 border border-red-200 hover:bg-red-100'
                }`}
              >
                Yes, please follow up
              </button>
              <button
                type="button"
                onClick={() => setWantsFollowUp(false)}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  !wantsFollowUp
                    ? 'bg-gray-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                No, that's okay
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const getRatingLabel = () => {
    const labels = {
      5: 'Excellent - We\'re thrilled!',
      4: 'Very Good - Almost perfect!',
      3: 'Good - There\'s room for improvement',
      2: 'Fair - We can do better',
      1: 'Poor - We\'re sorry about your experience'
    };
    return labels[rating] || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Feedback</h1>
        <p className="text-gray-500 text-sm mt-1">Rate your completed meetings</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="text-green-600" size={24} />
          <p className="text-green-700 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Feedback Form */}
      {selectedBooking && (
        <Card className="p-4 md:p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Submit Feedback</h2>
          <div className="bg-gray-50 p-4 rounded-xl mb-4">
            <p className="font-medium text-gray-800">{selectedBooking.roomId?.name}</p>
            <p className="text-sm text-gray-500">
              {new Date(selectedBooking.date).toLocaleDateString()} • {selectedBooking.startTime} - {selectedBooking.endTime}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setRating(star);
                      // Reset dynamic fields when rating changes
                      setImpressedWith([]);
                      setCouldImprove([]);
                      setMissing([]);
                      setIssues([]);
                      setWantsFollowUp(false);
                    }}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      size={36}
                      className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className={`text-sm mt-2 font-medium ${
                  rating === 5 ? 'text-green-600' :
                  rating === 4 ? 'text-blue-600' :
                  rating === 3 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {getRatingLabel()}
                </p>
              )}
            </div>

            {/* Dynamic Questions based on rating */}
            {rating > 0 && renderStarOptions()}

            {/* Additional Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Comments (Optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share any additional thoughts..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">{comment.length}/500</p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={rating === 0 || submitting}>
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
              <Button type="button" variant="outline" onClick={() => {
                setSelectedBooking(null);
                resetForm();
              }}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Completed Bookings List */}
      <Card className="p-4 md:p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Completed Meetings</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading...</p>
          </div>
        ) : completedBookings.length === 0 ? (
          <div className="text-center py-8">
            <Calendar size={48} className="mx-auto text-gray-300" />
            <p className="text-gray-500 mt-2">No completed meetings yet</p>
            <p className="text-sm text-gray-400">Your completed bookings will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedBookings.map((booking) => (
              <div
                key={booking._id}
                className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium flex-shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{booking.roomId?.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(booking.date).toLocaleDateString()}
                        </span>
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{booking.purpose}</p>
                    </div>
                  </div>
                  <div className="ml-13 sm:ml-0">
                    {booking.hasFeedback ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                        <CheckCircle size={14} />
                        Rated
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Star size={16} className="mr-1" />
                        Rate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MyFeedback;
