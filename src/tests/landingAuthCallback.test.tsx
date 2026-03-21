import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Landing from '../pages/Landing';

const navigateMock = vi.fn();
const useAuthMock = vi.fn();
const exchangeCodeForSessionMock = vi.fn();
const verifyOtpMock = vi.fn();
const setSessionMock = vi.fn();
const signInWithIdTokenMock = vi.fn();
const requestPasswordResetMock = vi.fn();
const updatePasswordMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../hooks/usePageMeta', () => ({
  usePageMeta: vi.fn(),
}));

vi.mock('../utils/supabaseAuth', () => ({
  getSupabaseAuthClient: () => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
      verifyOtp: verifyOtpMock,
      setSession: setSessionMock,
      signInWithIdToken: signInWithIdTokenMock,
    },
  }),
  readAuthCallbackParams: (url: string) => {
    const parsed = new URL(url);
    const params = new URLSearchParams(parsed.search);
    const hashParams = new URLSearchParams(parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash);

    hashParams.forEach((value, key) => {
      params.set(key, value);
    });

    return params;
  },
}));

describe('Landing auth callbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/landing');
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    verifyOtpMock.mockResolvedValue({ error: null });
    setSessionMock.mockResolvedValue({ error: null });
    signInWithIdTokenMock.mockResolvedValue({ error: null });
    useAuthMock.mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      loginWithGoogleRedirect: vi.fn(),
      loginAsDemo: vi.fn(),
      requestPasswordReset: requestPasswordResetMock,
      updatePassword: updatePasswordMock,
      isAuthenticated: false,
      canUseGoogleRedirect: true,
      error: null,
    });
    requestPasswordResetMock.mockResolvedValue({ success: true, message: 'mail sent' });
    updatePasswordMock.mockResolvedValue({ success: true, message: 'updated' });
  });

  it('exchanges PKCE code callbacks on landing', async () => {
    window.history.replaceState({}, '', '/landing?code=abc123');

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(exchangeCodeForSessionMock).toHaveBeenCalledWith('abc123');
    });
  });

  it('verifies email signup callbacks with token_hash and type', async () => {
    window.history.replaceState({}, '', '/landing?token_hash=tok_123&type=signup');

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(verifyOtpMock).toHaveBeenCalledWith({
        token_hash: 'tok_123',
        type: 'signup',
      });
    });
  });

  it('restores sessions from access token callbacks', async () => {
    window.history.replaceState({}, '', '/landing#access_token=acc_1&refresh_token=ref_1');

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(setSessionMock).toHaveBeenCalledWith({
        access_token: 'acc_1',
        refresh_token: 'ref_1',
      });
    });
  });

  it('signs in with Google ID token returned from the server callback', async () => {
    window.history.replaceState({}, '', '/landing#google_id_token=google.jwt.token');

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(signInWithIdTokenMock).toHaveBeenCalledWith({
        provider: 'google',
        token: 'google.jwt.token',
      });
    });
  });

  it('sends password reset email from forgot password mode', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('Email'), 'demo@example.com');
    await user.click(screen.getByRole('button', { name: 'Şifremi unuttum' }));
    await user.click(screen.getByRole('button', { name: 'Sıfırlama maili gönder' }));

    await waitFor(() => {
      expect(requestPasswordResetMock).toHaveBeenCalledWith('demo@example.com');
    });
  });

  it('shows recovery password form and updates password after recovery callback', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/landing?token_hash=tok_123&type=recovery');

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(verifyOtpMock).toHaveBeenCalledWith({
        token_hash: 'tok_123',
        type: 'recovery',
      });
    });

    await user.type(screen.getByPlaceholderText('Yeni şifre'), 'new-password-1');
    await user.type(screen.getByPlaceholderText('Yeni şifre tekrar'), 'new-password-1');
    await user.click(screen.getByRole('button', { name: 'Yeni şifreyi kaydet' }));

    await waitFor(() => {
      expect(updatePasswordMock).toHaveBeenCalledWith('new-password-1');
    });
  });
});
