import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Layouts
import DashboardLayout from '../layouts/DashboardLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Admissions Public Form
import OnlineApplicationForm from '../pages/admissions/OnlineApplicationForm';

// Dashboards
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import WardenDashboard from '../pages/dashboard/WardenDashboard';

// Admin / Staff Pages
import StudentList from '../pages/students/StudentList';
import StudentDetail from '../pages/students/StudentDetail';
import RoomManagement from '../pages/rooms/RoomManagement';
import AdmissionReview from '../pages/admissions/AdmissionReview';
import FeeManagement from '../pages/fees/FeeManagement';
import DailyAttendance from '../pages/attendance/DailyAttendance';
import ComplaintList from '../pages/complaints/ComplaintList';
import MaintenanceList from '../pages/maintenance/MaintenanceList';
import VisitorLog from '../pages/visitors/VisitorLog';
import LeaveList from '../pages/leaves/LeaveList';
import MessManagement from '../pages/mess/MessManagement';
import StaffDirectory from '../pages/staff/StaffDirectory';
import ReportsAnalytics from '../pages/reports/ReportsAnalytics';
import SettingsPage from '../pages/settings/SettingsPage';

// Student Portal Pages
import StudentPortalDashboard from '../pages/student-portal/StudentPortalDashboard';
import StudentRoomView from '../pages/student-portal/StudentRoomView';
import StudentProfileView from '../pages/student-portal/StudentProfileView';
import StudentMessView from '../pages/student-portal/StudentMessView';

// Error Page
import NotFound from '../pages/NotFound';

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'warden') return <Navigate to="/warden/dashboard" replace />;
  return <Navigate to="/admin/dashboard" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root entry point */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* Public Online Admission Application */}
      <Route path="/apply-admission" element={<OnlineApplicationForm />} />

      {/* Admin / Operations Routes */}
      <Route element={<ProtectedRoute allowedRoles={['super_admin', 'hostel_admin', 'warden', 'accountant']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/warden/dashboard" element={<WardenDashboard />} />
          <Route path="/admin/students" element={<StudentList />} />
          <Route path="/admin/students/:id" element={<StudentDetail />} />
          <Route path="/admin/rooms" element={<RoomManagement />} />
          <Route path="/admin/admissions" element={<AdmissionReview />} />
          <Route path="/admin/fees" element={<FeeManagement />} />
          <Route path="/admin/attendance" element={<DailyAttendance />} />
          <Route path="/admin/complaints" element={<ComplaintList />} />
          <Route path="/admin/maintenance" element={<MaintenanceList />} />
          <Route path="/admin/visitors" element={<VisitorLog />} />
          <Route path="/admin/leaves" element={<LeaveList />} />
          <Route path="/admin/mess" element={<MessManagement />} />
          <Route path="/admin/staff" element={<StaffDirectory />} />
          <Route path="/admin/reports" element={<ReportsAnalytics />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Student Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student/dashboard" element={<StudentPortalDashboard />} />
          <Route path="/student/profile" element={<StudentProfileView />} />
          <Route path="/student/room" element={<StudentRoomView />} />
          <Route path="/student/fees" element={<FeeManagement />} />
          <Route path="/student/attendance" element={<StudentDetail />} />
          <Route path="/student/complaints" element={<ComplaintList />} />
          <Route path="/student/leaves" element={<LeaveList />} />
          <Route path="/student/mess" element={<StudentMessView />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
