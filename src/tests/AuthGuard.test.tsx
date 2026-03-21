import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthGuard } from '../components/AuthGuard';

const useAuthMock = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

function LandingProbe() {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}${location.hash}`}</div>;
}

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preserves auth callback params when redirecting unauthenticated users', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false });

    render(
      <MemoryRouter initialEntries={['/?token_hash=recovery_123&type=recovery#access_token=acc_1&refresh_token=ref_1']}>
        <Routes>
          <Route
            path="/"
            element={(
              <AuthGuard>
                <div>Private page</div>
              </AuthGuard>
            )}
          />
          <Route path="/landing" element={<LandingProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('/landing?token_hash=recovery_123&type=recovery#access_token=acc_1&refresh_token=ref_1')).toBeInTheDocument();
  });
});
