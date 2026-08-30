import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import { ROUTES } from '../config/routes.config';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.PUBLIC.LOGIN} replace />;
  }

  return <>{children}</>;
};
