import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLocalization } from '../hooks/useLocalization';

interface ProtectedRouteProps {
  children: React.ReactElement;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLocalization();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return (
      <div className="text-center p-8">
        <h1 className="text-3xl text-red-500 font-cinzel">{t('accessDenied')}</h1>
        <p className="text-gray-400 mt-2">{t('adminOnly')}</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;