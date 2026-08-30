import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store';
import { ROUTES } from '../config/routes.config';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.PROTECTED.DASHBOARD} replace />;
  }

  return <>{children}</>;
};
