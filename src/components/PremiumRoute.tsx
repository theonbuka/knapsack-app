import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PremiumRouteProps {
  children: React.ReactNode;
  fallbackTo?: string;
}

export function PremiumRoute({ children, fallbackTo = '/premium' }: PremiumRouteProps) {
  const { isPremium } = useAuth();

  if (!isPremium) {
    return <Navigate to={fallbackTo} replace />;
  }

  return <>{children}</>;
}