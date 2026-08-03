import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';

import Login from './pages/auth/Login';
import DashboardLayout from './components/layout/DashboardLayout';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import AdminBulkUpload from './pages/admin/AdminBulkUpload';
import AdminBookingsView from './pages/admin/AdminBookingsView';
import AdminRoomsView from './pages/admin/AdminRoomsView';
import AdminScheduleView from './pages/admin/AdminScheduleView';
import AdminMaintenanceView from './pages/admin/AdminMaintenanceView';
import MaintenanceAnalytics from './pages/admin/MaintenanceAnalytics';

import ApproverDashboard from './pages/approver/ApproverDashboard';
import ApproverRooms from './pages/approver/ApproverRooms';
import BookingRequests from './pages/approver/BookingRequests';
import ApproverScheduleView from './pages/approver/ApproverScheduleView';
import FeedbackList from './pages/approver/FeedbackList';

import RequesterDashboard from './pages/requester/RequesterDashboard';
import SearchRooms from './pages/requester/SearchRooms';
import MyBookings from './pages/requester/MyBookings';
import RequesterScheduleView from './pages/requester/RequesterScheduleView';
import MyFeedback from './pages/requester/MyFeedback';

import MaintenanceDashboard from './pages/maintenance/MaintenanceDashboard';
import MaintenanceTasks from './pages/maintenance/MaintenanceTasks';
import MaintenanceTaskDetails from './pages/maintenance/MaintenanceTaskDetails';
import MaintenanceHistory from './pages/maintenance/MaintenanceHistory';

import Profile from './pages/common/Profile';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="bulk-upload" element={<AdminBulkUpload />} />
            <Route path="bookings" element={<AdminBookingsView />} />
            <Route path="rooms" element={<AdminRoomsView />} />
            <Route path="maintenance" element={<AdminMaintenanceView />} />
            <Route path="maintenance/analytics" element={<MaintenanceAnalytics />} />
            <Route path="schedule" element={<AdminScheduleView />} />
          </Route>

          {/* Approver Routes */}
          <Route
            path="/approver"
            element={
              <ProtectedRoute allowedRoles={['approver']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ApproverDashboard />} />
            <Route path="rooms" element={<ApproverRooms />} />
            <Route path="requests" element={<BookingRequests />} />
            <Route path="schedule" element={<ApproverScheduleView />} />
            <Route path="feedback" element={<FeedbackList />} />
          </Route>

          {/* Requester Routes */}
          <Route
            path="/requester"
            element={
              <ProtectedRoute allowedRoles={['requester']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RequesterDashboard />} />
            <Route path="search" element={<SearchRooms />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="schedule" element={<RequesterScheduleView />} />
            <Route path="feedback" element={<MyFeedback />} />
          </Route>

          {/* Maintenance Incharge Routes */}
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute allowedRoles={['maintenance', 'admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<MaintenanceDashboard />} />
            <Route path="tasks" element={<MaintenanceTasks />} />
            <Route path="tasks/:id" element={<MaintenanceTaskDetails />} />
            <Route path="history" element={<MaintenanceHistory />} />
          </Route>

          {/* Profile — accessible to any authenticated user */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['admin', 'approver', 'requester', 'maintenance']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Profile />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
