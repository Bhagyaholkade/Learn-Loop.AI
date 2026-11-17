
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../services/api';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  const token = localStorage.getItem('accessToken');

  // Check authentication
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const user = getCurrentUser();

  // A protected role-based route requires a valid stored user.
  if (!user || !user.role) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');

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
