import { useState, useEffect } from 'react';
import { Star, MessageSquare, Calendar, MapPin, User, RefreshCw, Filter } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Avatar from '../../components/common/Avatar';
import { feedbackAPI } from '../../services/api';

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, 5, 4, 3, 2, 1

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const [feedbackRes, statsRes] = await Promise.all([
        feedbackAPI.getAll(),
        feedbackAPI.getStats()
      ]);
      setFeedbacks(feedbackRes.data.data.feedback);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const filteredFeedback = filter === 'all'
    ? feedbacks
    : feedbacks.filter(f => f.rating === parseInt(filter));

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Feedback & Reviews</h1>
          <p className="text-gray-500 text-sm mt-1">View feedback from completed meetings</p>
        </div>
        <Button variant="outline" onClick={fetchFeedback} disabled={loading} className="w-full sm:w-auto">
          <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
          <Card className="p-4">
            <p className="text-sm text-gray-500">Total Feedback</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalFeedback}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Average Rating</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-gray-800">{stats.averageRating}</p>
              <Star size={20} className="text-yellow-400 fill-yellow-400" />
            </div>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">5-Star Reviews</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {stats.ratingDistribution.find(r => r.rating === 5)?.count || 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-500">Rooms Rated</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.roomRatings?.length || 0}</p>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {[5, 4, 3, 2, 1].map(rating => (
          <button
            key={rating}
            onClick={() => setFilter(rating)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
              filter === rating
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {rating} <Star size={14} className="text-yellow-400 fill-yellow-400" />
          </button>
        ))}
      </div>

      {/* Feedback List */}
      <Card className="p-4 md:p-5">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw size={24} className="animate-spin mx-auto text-primary" />
            <p className="text-gray-500 mt-2">Loading feedback...</p>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={48} className="mx-auto text-gray-300" />
            <p className="text-gray-500 mt-2">No feedback found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeedback.map((feedback) => (
              <div
                key={feedback._id}
                className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Avatar user={feedback.userId} size={40} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-800">{feedback.userId?.name || 'Unknown User'}</p>
                        {renderStars(feedback.rating)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {feedback.roomId?.name || 'Unknown Room'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {feedback.bookingId?.date
                            ? new Date(feedback.bookingId.date).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      {feedback.comment && (
                        <p className="mt-2 text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                          "{feedback.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 ml-13 sm:ml-0">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Room Ratings */}
      {stats?.roomRatings && stats.roomRatings.length > 0 && (
        <Card className="p-4 md:p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Room Ratings</h2>
          <div className="space-y-3">
            {stats.roomRatings.map((room) => (
              <div key={room._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{room.roomName}</p>
                  <p className="text-sm text-gray-500">{room.count} reviews</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-gray-800">{room.averageRating.toFixed(1)}</p>
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default FeedbackList;
