import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const callbackSuffix = `${location.search || ''}${location.hash || ''}`;
    return <Navigate to={`/landing${callbackSuffix}`} replace />;
  }

  return <>{children}</>;
}