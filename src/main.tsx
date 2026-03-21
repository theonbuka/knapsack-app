import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element not found');
}

createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter future={routerFuture}>
        <App />
        <SpeedInsights />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
