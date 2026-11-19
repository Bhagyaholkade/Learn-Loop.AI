
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/api';
import { getAccessToken } from '../api/axios';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  const token = getAccessToken();

  // Check authentication
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const user = getCurrentUser();

  // A protected role-based route requires a valid stored user.
  if (!user || !user.role) {
    logout();

    return <Navigate to="/login" replace />;
  }

  const userRole = user.role.toLowerCase();

  // Check authorization
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    }

    if (userRole === 'student') {
      return <Navigate to="/student" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
