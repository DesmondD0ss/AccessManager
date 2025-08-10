import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const RootRedirect: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Debug: Afficher les informations de l'utilisateur
  console.log('RootRedirect - User:', user);
  console.log('RootRedirect - Role:', user?.role);
  console.log('RootRedirect - IsAuthenticated:', isAuthenticated);
  console.log('RootRedirect - IsLoading:', isLoading);

  if (isLoading) {
    console.log('RootRedirect - Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-default">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('RootRedirect - Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    console.log('RootRedirect - Admin user detected, redirecting to admin dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }

  console.log('RootRedirect - Regular user, redirecting to user dashboard');
  return <Navigate to="/dashboard" replace />;
};

export default RootRedirect;
