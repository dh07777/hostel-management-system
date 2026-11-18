import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, token, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required
  if (allowedRoles.length > 0) {
    const role = user.role;
    const isSuperAdmin = role === 'super_admin';
    const isAllowed = isSuperAdmin || allowedRoles.includes(role);

    if (!isAllowed) {
      // If student trying to access admin
      if (role === 'student') {
        return <Navigate to="/student/dashboard" replace />;
      }
      if (role === 'warden') {
        return <Navigate to="/warden/dashboard" replace />;
      }
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
