import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowAuthenticated?: boolean; // New prop to allow authenticated users on public routes
}

const ProtectedRoute = ({ children, requireAuth = true, allowAuthenticated = false }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore();

  if (requireAuth && !isAuthenticated) {
    // If user is not authenticated and trying to access protected route, redirect to home
    return <Navigate to="/" replace />;
  }

  if (!requireAuth && isAuthenticated && !allowAuthenticated) {
    // If user is authenticated and trying to access public route that doesn't allow authenticated users, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
