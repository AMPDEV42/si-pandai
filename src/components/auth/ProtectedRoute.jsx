import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useEffect } from 'react';

/**
 * ProtectedRoute Component
 * 
 * Handles route protection and role-based access control.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if access is granted
 * @param {string[]} [props.allowedRoles=[]] - Array of allowed roles for the route
 * @param {boolean} [props.requireVerification=false] - Whether to require email verification
 * @returns {React.ReactNode} - Rendered component or redirect
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireVerification = false 
}) => {
  const { user, loading, session } = useAuth();
  const location = useLocation();

  // Check user role from both possible locations
  const userRole = user?.role || user?.user_metadata?.role;

  // Show loading state
  if (loading || (session === undefined)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if email verification is required
  if (requireVerification && !session?.user?.email_confirmed_at) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has any of them
  if (allowedRoles.length > 0) {
    const hasRequiredRole = userRole && allowedRoles.some(role => {
      // Admin master has access to all routes
      if (userRole === 'admin-master') {
        return true;
      }
      // Handle role aliases
      if (role === 'admin') {
        return ['admin-master', 'admin-unit'].includes(userRole);
      }
      return userRole === role;
    });

    if (!hasRequiredRole) {
      // Log unauthorized access attempt
      console.warn(`Unauthorized access attempt by ${user.email} (${userRole}) to ${location.pathname}`);
      
      // Redirect based on user role
      const redirectPath = {
        'user': '/pengajuan/baru',
        'admin-unit': '/dashboard/admin-unit',
        'admin-master': '/dashboard/admin-master'
      }[userRole] || '/unauthorized';
      
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Add user activity logging
  // User access logging moved to server-side for better security and reduced console noise

  // If user is authenticated and has required role, render children
  return children;
};

export default ProtectedRoute;
