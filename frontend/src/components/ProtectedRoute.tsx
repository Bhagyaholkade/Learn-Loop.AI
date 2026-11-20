
import { Navigate, Outlet } from 'react-router-dom';
import {
  getCurrentUser,
  isAuthenticated,
  logout,
} from '../services/api';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  allowedRoles,
}: ProtectedRouteProps) {
  // Supports both localStorage and sessionStorage.
  const authenticated = isAuthenticated();

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  const user = getCurrentUser();

  // A protected role-based route requires a valid stored user.
  if (!user || !user.role) {
    logout();

    return <Navigate to="/login" replace />;
  }

  const userRole = user.role.toLowerCase();

  // Check authorization.
  if (
    allowedRoles &&
    !allowedRoles.map((role) => role.toLowerCase()).includes(userRole)
  ) {
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    }

    if (userRole === 'student') {
      return <Navigate to="/student" replace />;
    }

    logout();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
