import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import type { AuthState, SubscriptionPlan } from '../types';
import { Encryption } from '../utils/encryption';
import { RegisterSchema, LoginSchema, PasswordSchema, RequiredEmailSchema, validateAndSanitize } from '../utils/validation';
import { SecureStorage } from '../utils/secureStorage';
import {
  getSubscriptionPlanFromSupabase,
  getSubscriptionPlanFromSupabaseUser,
  isPremiumPlan,
  resolveSubscriptionPlan,
} from '../utils/premium';
import {
  clearActiveCloudSyncAccountId,
  clearActiveUserStorageId,
  getCloudSyncAccountId,
  getAuthStorageId,
  setActiveCloudSyncAccountId,
  migrateLegacyDataToUser,
  setActiveUserStorageId,
} from '../utils/accountStorage';
import {
  getSupabaseAuthRedirectUrl,
  getSupabaseAuthClient,
  getSupabaseEmailRedirectUrl,
  getSupabaseGoogleProviderStatus,
  isSupabaseAuthConfigured,
  isNativeAuthPlatform,
  openAuthUrl,
} from '../utils/supabaseAuth';
import {
  clearAuthFailures,
  getAuthRateLimitStatus,
  recordAuthFailure,
} from '../utils/authRateLimit';
import { seedDemoData, clearDemoData } from '../utils/demoSeed';

interface RegisterResult {
  success: boolean;
  requiresVerification?: boolean;
  message?: string;
}

interface AuthActionResult {
  success: boolean;
  message?: string;
}

interface GoogleRedirectLoginResult {
  success: boolean;
  message?: string;
  reason?: 'supabase-missing' | 'provider-disabled' | 'browser-unavailable' | 'start-failed';
}

interface AuthContextType {
  auth: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogleRedirect: () => Promise<GoogleRedirectLoginResult>;
  loginAsDemo: () => void;
  requestPasswordReset: (email: string) => Promise<AuthActionResult>;
  updatePassword: (password: string) => Promise<AuthActionResult>;
  logout: (purge?: boolean) => void;
  register: (
    name: string,
    surname: string,
    email: string,
    password: string
  ) => Promise<RegisterResult>;
  processSupabaseSession: (session: Session | null, supabase?: SupabaseClient | null) => Promise<boolean>;
  isAuthenticated: boolean;
  canUseGoogleRedirect: boolean;
  subscriptionPlan: SubscriptionPlan;
  isPremium: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = 'knapsack_auth';
const HASH_REGEX = /^[a-f0-9]{64}$/i;
const SIGNUP_DISABLED = import.meta.env.VITE_DISABLE_SIGNUP === 'true';
const EMPTY_AUTH: AuthState = {
  name: '',
  surname: '',
  email: '',
  password: '',
  pin: '',
  loggedIn: false,
  subscriptionPlan: 'free',
};

function isSupabaseAuthRequiredButMissing(): boolean {
  return !isSupabaseAuthConfigured();
}

function isSignupDisabled(): boolean {
  return SIGNUP_DISABLED;
}

function isEmailNotConfirmedError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('email not confirmed') || normalized.includes('email_not_confirmed');
}

function normalizeAuthState(raw: unknown): AuthState | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as Partial<AuthState>;
  const name = typeof candidate.name === 'string' ? candidate.name : '';
  const surname = typeof candidate.surname === 'string' ? candidate.surname : '';
  const email = typeof candidate.email === 'string' ? candidate.email.trim().toLowerCase() : undefined;
  const password = typeof candidate.password === 'string' ? candidate.password : '';
  const pin = typeof candidate.pin === 'string' ? candidate.pin : '';
  const demoMode = Boolean(candidate.demoMode);
  const googleId = typeof candidate.googleId === 'string' ? candidate.googleId : undefined;
  const picture = typeof candidate.picture === 'string' ? candidate.picture : undefined;
  const supabaseUserId = typeof candidate.supabaseUserId === 'string' ? candidate.supabaseUserId.trim() : undefined;
  const subscriptionPlan = candidate.subscriptionPlan === 'premium' ? 'premium' : 'free';

  if (!name && !surname && !email && !password && !pin && !demoMode && !googleId && !supabaseUserId) {
    return null;
  }

  const normalized: AuthState = {
    name,
    surname,
    email,
    password,
    pin,
    loggedIn: Boolean(candidate.loggedIn),
    demoMode,
    googleId,
    supabaseUserId,
    picture,
    subscriptionPlan,
  };

  // Migrate old plaintext password records to hashed format.
  if (normalized.password && !HASH_REGEX.test(normalized.password)) {
    normalized.password = Encryption.hashPin(normalized.password);
  }

  // Migrate old plaintext PIN records to hashed format.
  if (normalized.pin && !HASH_REGEX.test(normalized.pin)) {
    normalized.pin = Encryption.hashPin(normalized.pin);
  }

  // Legacy fallback: if only pin exists, treat it as password hash.
  if (!normalized.password && normalized.pin) {
    normalized.password = normalized.pin;
  }

  // Demo sessions are no longer supported; force old demo records to signed-out.
  if (normalized.demoMode) {
    normalized.demoMode = false;
    normalized.loggedIn = false;
    normalized.password = '';
    normalized.pin = '';
  }

  return normalized;
}

function loadLegacyAuth(): AuthState | null {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const normalized = normalizeAuthState(parsed);
    if (!normalized) {
      return null;
    }

    SecureStorage.setSecure(AUTH_KEY, normalized);
    return normalized;
  } catch {
    return null;
  }
}

function clearAccountScopes(): void {
  clearActiveUserStorageId();
  clearActiveCloudSyncAccountId();
}

function syncAccountScopes(authState: AuthState): void {
  const storageId = getAuthStorageId(authState);
  if (storageId) {
    setActiveUserStorageId(storageId);
    migrateLegacyDataToUser(storageId);
  } else {
    clearActiveUserStorageId();
  }

  const cloudAccountId = getCloudSyncAccountId(authState);
  if (cloudAccountId) {
    setActiveCloudSyncAccountId(cloudAccountId);
  } else {
    clearActiveCloudSyncAccountId();
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const processedSupabaseSessionRef = useRef<string | null>(null);
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const stored = SecureStorage.getSecure<AuthState>(AUTH_KEY);
      const normalizedStored = normalizeAuthState(stored);
      if (normalizedStored) {
        if (normalizedStored.loggedIn) {
          syncAccountScopes(normalizedStored);
        } else {
          clearAccountScopes();
        }
        SecureStorage.setSecure(AUTH_KEY, normalizedStored);
        return normalizedStored;
      }

      const legacyStored = loadLegacyAuth();
      if (legacyStored?.loggedIn) {
        syncAccountScopes(legacyStored);
      } else {
        clearAccountScopes();
      }
      return legacyStored || EMPTY_AUTH;
    } catch (err) {
      console.error('Failed to load auth:', err);
      return EMPTY_AUTH;
    }
  });
  const [error, setError] = useState<string | null>(null);

  const persistAuth = useCallback((nextAuth: AuthState) => {
    const hasProfileData = Boolean(
      nextAuth.name ||
      nextAuth.surname ||
      nextAuth.email ||
      nextAuth.password ||
      nextAuth.pin ||
      nextAuth.demoMode ||
      nextAuth.googleId ||
      nextAuth.supabaseUserId
    );

    try {
      if (hasProfileData) {
        SecureStorage.setSecure(AUTH_KEY, nextAuth);
      } else {
        SecureStorage.remove(AUTH_KEY);
      }
    } catch (err) {
      console.error('Failed to persist auth state:', err);
    }
  }, []);

  const commitAuthenticatedState = useCallback((nextAuth: AuthState) => {
    syncAccountScopes(nextAuth);
    setAuth(nextAuth);
    setError(null);
    persistAuth(nextAuth);
  }, [persistAuth]);

  const logout = useCallback((purge = false) => {
    processedSupabaseSessionRef.current = null;
    clearAccountScopes();

    const supabase = getSupabaseAuthClient();
    if (supabase) {
      void supabase.auth.signOut().catch(err => {
        console.error('Failed to clear Supabase session during logout:', err);
      });
    }

    setAuth(prev => {
      // If this was a demo session, wipe the demo data.
      if (prev.demoMode) {
        clearDemoData();
      }

      if (purge) {
        try {
          SecureStorage.remove(AUTH_KEY);
        } catch (err) {
          console.error('Failed to remove auth:', err);
        }
        return EMPTY_AUTH;
      }

      const nextAuth: AuthState = prev.demoMode
        ? EMPTY_AUTH
        : {
          ...prev,
          loggedIn: false,
          demoMode: false,
        };

      persistAuth(nextAuth);

      return nextAuth;
    });

    setError(null);
  }, [persistAuth]);

  const processSupabaseSession = useCallback(async (
    session: Session | null,
    supabase = getSupabaseAuthClient(),
  ): Promise<boolean> => {
    if (!supabase || !session?.user) {
      return false;
    }

    const sessionKey = session.access_token || session.user.id;
    if (processedSupabaseSessionRef.current === sessionKey) {
      return true;
    }

    const metadata = (session.user.user_metadata || {}) as Record<string, unknown>;
    const nameFromMetadata = typeof metadata.name === 'string'
      ? metadata.name
      : typeof metadata.given_name === 'string'
        ? metadata.given_name
        : '';
    const surnameFromMetadata = typeof metadata.surname === 'string'
      ? metadata.surname
      : typeof metadata.family_name === 'string'
        ? metadata.family_name
        : '';
    const picture = typeof metadata.avatar_url === 'string'
      ? metadata.avatar_url
      : typeof metadata.picture === 'string'
        ? metadata.picture
        : undefined;

    const resolvedSubscriptionPlan = await getSubscriptionPlanFromSupabase(
      supabase,
      session.user.id,
      getSubscriptionPlanFromSupabaseUser(session.user) || 'free',
    ).catch(() => 'free');

    processedSupabaseSessionRef.current = sessionKey;
    commitAuthenticatedState({
      name: (nameFromMetadata || session.user.email?.split('@')[0] || 'Kullanıcı').trim(),
      surname: surnameFromMetadata.trim(),
      email: session.user.email?.toLowerCase(),
      password: '',
      pin: '',
      loggedIn: true,
      demoMode: false,
      supabaseUserId: session.user.id,
      picture,
      subscriptionPlan: resolvedSubscriptionPlan,
    });

    return true;
  }, [commitAuthenticatedState]);

  const loginWithGoogleRedirect = useCallback(async (): Promise<GoogleRedirectLoginResult> => {
    const supabase = getSupabaseAuthClient();
    if (!supabase) {
      return {
        success: false,
        message: 'Google girisi bu ortamda yapilandirilmamis.',
        reason: 'supabase-missing',
      };
    }

    if (typeof window === 'undefined' || !window.location?.origin) {
      return {
        success: false,
        message: 'Google girisi yalnizca tarayicida baslatilabilir.',
        reason: 'browser-unavailable',
      };
    }

    const redirectTo = getSupabaseAuthRedirectUrl('/landing');

    if (isNativeAuthPlatform()) {
      // Native: use skipBrowserRedirect + Capacitor Browser
      const providerStatus = await getSupabaseGoogleProviderStatus(redirectTo);
      if (providerStatus.status === 'disabled') {
        return {
          success: false,
          message: 'Supabase Google provider kapali. Authentication > Providers > Google ayarini acmalisin.',
          reason: 'provider-disabled',
        };
      }

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { prompt: 'select_account' },
        },
      });

      if (signInError || !data?.url) {
        return {
          success: false,
          message: signInError ? `Google girisi baslatilamadi: ${signInError.message}` : 'Google yonlendirme adresi uretilemedi.',
          reason: 'start-failed',
        };
      }

      await openAuthUrl(data.url);
      return { success: true };
    }

    // Web: use Supabase OAuth directly — no server-side endpoint needed.
    const { data, error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (signInError || !data?.url) {
      return {
        success: false,
        message: signInError
          ? `Google girisi baslatilamadi: ${signInError.message}`
          : 'Google yonlendirme adresi uretilemedi.',
        reason: 'start-failed',
      };
    }

    await openAuthUrl(data.url);
    return { success: true };
  }, []);

  const loginAsDemo = useCallback(() => {
    // Clear any active user scope so demo data lands in the anonymous bucket.
    clearActiveUserStorageId();
    clearActiveCloudSyncAccountId();
    // Populate all modules with realistic sample data.
    seedDemoData();
    // Demo session is in-memory only — not persisted, dies on page reload.
    setAuth({
      name: 'Demo',
      surname: 'Kullanicisi',
      email: '',
      password: 'demo',
      pin: '',
      loggedIn: true,
      demoMode: true,
      subscriptionPlan: 'free',
    });
    setError(null);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseAuthClient();
    if (!supabase) {
      return;
    }

    let disposed = false;

    const consumeGoogleSession = async (session: Session | null) => {
      if (disposed) {
        return;
      }

      await processSupabaseSession(session, supabase);
    };

    // Attach the listener FIRST so we never miss events fired during
    // the automatic PKCE code exchange (detectSessionInUrl: true).
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') &&
        session?.user
      ) {
        void consumeGoogleSession(session);
      }
    });

    // Also poll getSession after a short delay to catch sessions that were
    // already exchanged before the listener was attached (race condition).
    const poll = () => {
      void supabase.auth.getSession().then(({ data, error: sessionError }) => {
        if (sessionError && !disposed) {
          console.error('Failed to inspect Supabase session:', sessionError);
          return;
        }

        if (data.session) {
          void consumeGoogleSession(data.session);
        }
      });
    };

    // Immediate check
    poll();

    // Retry after 1s in case the PKCE exchange was still in-flight
    const retryTimer = setTimeout(() => {
      if (!disposed) {
        poll();
      }
    }, 1500);

    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      authSubscription.subscription.unsubscribe();
    };
  }, [processSupabaseSession]);
  const canUseGoogleRedirect = isSupabaseAuthConfigured();
  const subscriptionPlan = resolveSubscriptionPlan(auth);
  const isPremium = isPremiumPlan(subscriptionPlan);

  const isAuthenticated = auth.loggedIn && (
    !!auth.password ||
    !!auth.pin ||
    !!auth.supabaseUserId ||
    auth.demoMode === true
  );

  // Session expiration (30 minutes inactivity)
  useEffect(() => {
    if (!isAuthenticated) return;

    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    // Throttle: reset the countdown at most once every 2 seconds so that
    // high-frequency events (mousemove, scroll) don't hammer setTimeout/clearTimeout.
    const ACTIVITY_THROTTLE_MS = 2000;

    let timeoutId: ReturnType<typeof setTimeout>;
    let lastActivityAt = 0;

    const resetTimer = () => {
      const now = Date.now();
      if (now - lastActivityAt < ACTIVITY_THROTTLE_MS) return;
      lastActivityAt = now;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(logout, SESSION_TIMEOUT);
    };

    // Reset timer on user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer(); // Start timer

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isAuthenticated, logout]);

  const login = async (email: string, password: string): Promise<boolean> => {
    let normalizedEmailForRateLimit = '';
    const fail = (message: string, shouldCountAttempt = true): false => {
      setError(message);

      if (shouldCountAttempt && normalizedEmailForRateLimit) {
        recordAuthFailure('login', normalizedEmailForRateLimit);
      }

      return false;
    };

    try {
      setError(null);

      const validated = validateAndSanitize<{ email: string; password: string }>(
        LoginSchema,
        { email, password }
      );
      const normalizedEmail = validated.email.toLowerCase();
      normalizedEmailForRateLimit = normalizedEmail;

      const rateLimitStatus = getAuthRateLimitStatus('login', normalizedEmail);
      if (rateLimitStatus.blocked) {
        return fail(
          `Çok fazla başarısız giriş denemesi. ${rateLimitStatus.retryAfterSeconds} saniye sonra tekrar dene.`,
          false
        );
      }

      if (isSupabaseAuthRequiredButMissing()) {
        return fail('Email aktivasyon sistemi bu ortamda yapılandırılmamış. Yöneticiye VITE_SUPABASE_* değişkenlerini kontrol ettir.', false);
      }

      const supabase = getSupabaseAuthClient();
      if (!supabase) {
        return fail('Giriş başarısız: Supabase istemcisi başlatılamadı.');
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: validated.password,
      });

      if (signInError && isEmailNotConfirmedError(signInError.message)) {
        return fail('Email adresini doğrulamadan giriş yapamazsın. Aktivasyon mailindeki bağlantıyı aç.', false);
      }

      if (signInError) {
        return fail(`Giriş başarısız: ${signInError.message}`);
      }

      if (!data.user) {
        return fail('Giriş başarısız: Supabase kullanıcı kaydı bulunamadı.');
      }

      const metadata = (data.user.user_metadata || {}) as Record<string, unknown>;
      const nameFromMetadata = typeof metadata.name === 'string'
        ? metadata.name
        : typeof metadata.given_name === 'string'
          ? metadata.given_name
          : '';
      const surnameFromMetadata = typeof metadata.surname === 'string' ? metadata.surname : '';
      const fallbackName = normalizedEmail.split('@')[0];

      const supabaseAuthState: AuthState = {
        name: (nameFromMetadata || fallbackName || 'Kullanıcı').trim(),
        surname: surnameFromMetadata.trim(),
        email: normalizedEmail,
        password: Encryption.hashPin(validated.password),
        pin: '',
        loggedIn: true,
        demoMode: false,
        supabaseUserId: data.user.id,
        subscriptionPlan: await getSubscriptionPlanFromSupabase(
          supabase,
          data.user.id,
          getSubscriptionPlanFromSupabaseUser(data.user) || 'free',
        ),
      };

      commitAuthenticatedState(supabaseAuthState);
      clearAuthFailures('login', normalizedEmail);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Giriş başarısız';
      return fail(message);
    }
  };

  const register = async (
    name: string,
    surname: string,
    email: string,
    password: string
  ): Promise<RegisterResult> => {
    let normalizedEmailForRateLimit = '';
    const fail = (message: string, shouldCountAttempt = true): RegisterResult => {
      setError(message);

      if (shouldCountAttempt && normalizedEmailForRateLimit) {
        recordAuthFailure('register', normalizedEmailForRateLimit);
      }

      return { success: false, message };
    };

    try {
      setError(null);

      const validated = validateAndSanitize<{
        name: string;
        surname: string;
        email: string;
        password: string;
      }>(RegisterSchema, {
        name,
        surname,
        email,
        password,
      });

      const normalizedEmail = validated.email.toLowerCase();
      normalizedEmailForRateLimit = normalizedEmail;

      if (isSignupDisabled()) {
        return fail('Yeni hesap kaydı geçici olarak kapalı. Lütfen daha sonra tekrar dene.', false);
      }

      const rateLimitStatus = getAuthRateLimitStatus('register', normalizedEmail);
      if (rateLimitStatus.blocked) {
        return fail(
          `Çok fazla başarısız kayıt denemesi. ${rateLimitStatus.retryAfterSeconds} saniye sonra tekrar dene.`,
          false
        );
      }

      if (isSupabaseAuthRequiredButMissing()) {
        return fail('Aktivasyon emaili için Supabase yapılandırması eksik. VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ayarlarını kontrol et.', false);
      }

      const supabase = getSupabaseAuthClient();
      if (!supabase) {
        return fail('Supabase bağlantısı kurulamadı. Lütfen tekrar deneyin.');
      }

      const redirectTo = getSupabaseEmailRedirectUrl();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: validated.password,
        options: {
          data: {
            name: validated.name,
            surname: validated.surname,
          },
          ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
        },
      });

      if (signUpError) {
        return fail(`Kayıt başarısız: ${signUpError.message}`);
      }

      if (data.session) {
        setError('Aktivasyon emaili için Supabase Authentication > Email > Confirm email ayarını açmalısın.');
        void supabase.auth.signOut();
        return { success: false };
      }

      const identityCount = Array.isArray(data.user?.identities) ? data.user.identities.length : 1;
      if (identityCount === 0) {
        return fail('Bu email zaten kayıtlı. Giriş yapmayı deneyin.', false);
      }

      clearActiveUserStorageId();
      clearActiveCloudSyncAccountId();

      const pendingAuth: AuthState = {
        name: validated.name,
        surname: validated.surname,
        email: normalizedEmail,
        password: '',
        pin: '',
        loggedIn: false,
        demoMode: false,
        supabaseUserId: data.user?.id,
        subscriptionPlan: 'free',
      };

      setAuth(pendingAuth);
      persistAuth(pendingAuth);
      clearAuthFailures('register', normalizedEmail);

      return {
        success: false,
        requiresVerification: true,
        message: 'Aktivasyon emaili gönderildi. Mail içinde hoş geldiniz mesajı ve öne çıkan özellikler yer alır.',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kayıt başarısız';
      return fail(message);
    }
  };

  const requestPasswordReset = useCallback(async (email: string): Promise<AuthActionResult> => {
    try {
      setError(null);

      const normalizedEmail = validateAndSanitize<string>(RequiredEmailSchema, email).toLowerCase();

      if (isSupabaseAuthRequiredButMissing()) {
        return {
          success: false,
          message: 'Şifre sıfırlama için Supabase yapılandırması eksik.',
        };
      }

      const supabase = getSupabaseAuthClient();
      if (!supabase) {
        return {
          success: false,
          message: 'Supabase bağlantısı kurulamadı. Lütfen tekrar dene.',
        };
      }

      const redirectTo = getSupabaseEmailRedirectUrl();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        ...(redirectTo ? { redirectTo } : {}),
      });

      if (resetError) {
        setError(`Şifre sıfırlama maili gönderilemedi: ${resetError.message}`);
        return {
          success: false,
          message: `Şifre sıfırlama maili gönderilemedi: ${resetError.message}`,
        };
      }

      return {
        success: true,
        message: 'Şifre sıfırlama bağlantısı email adresine gönderildi. Mail kutunu kontrol et.',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Şifre sıfırlama maili gönderilemedi.';
      setError(message);
      return { success: false, message };
    }
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<AuthActionResult> => {
    try {
      setError(null);

      const validatedPassword = validateAndSanitize<string>(PasswordSchema, password);

      const supabase = getSupabaseAuthClient();
      if (!supabase) {
        return {
          success: false,
          message: 'Supabase bağlantısı kurulamadı. Lütfen tekrar dene.',
        };
      }

      const { data, error: updateError } = await supabase.auth.updateUser({
        password: validatedPassword,
      });

      if (updateError) {
        setError(`Şifre güncellenemedi: ${updateError.message}`);
        return {
          success: false,
          message: `Şifre güncellenemedi: ${updateError.message}`,
        };
      }

      const updatedUser = data.user;
      if (updatedUser) {
        setAuth(prev => {
          const nextAuth: AuthState = {
            ...prev,
            email: updatedUser.email?.toLowerCase() || prev.email,
            password: Encryption.hashPin(validatedPassword),
            loggedIn: true,
            demoMode: false,
            supabaseUserId: updatedUser.id || prev.supabaseUserId,
          };
          persistAuth(nextAuth);
          return nextAuth;
        });
      }

      return {
        success: true,
        message: 'Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Şifre güncellenemedi.';
      setError(message);
      return { success: false, message };
    }
  }, [persistAuth]);

  return (
    <AuthContext.Provider value={{
      auth,
      login,
      loginWithGoogleRedirect,
      loginAsDemo,
      requestPasswordReset,
      updatePassword,
      logout,
      register,
      processSupabaseSession,
      isAuthenticated,
      canUseGoogleRedirect,
      subscriptionPlan,
      isPremium,
      error,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}