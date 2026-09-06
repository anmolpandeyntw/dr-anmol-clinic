import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { AppRole } from '../../context/AuthContext';
import { FullPageLoader } from '../common/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    // Redirect unauthenticated user to admin login
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // If user role is not permitted (e.g. staff accessing admin-only route), redirect to dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
