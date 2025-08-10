import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-default">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    // Redirect non-admin users from admin routes
    console.log('ProtectedRoute - Non-admin user trying to access admin route, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>
}
