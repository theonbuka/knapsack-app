import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const PRODUCTION_SUPABASE_URL = 'https://erycithhilhzbgzrccka.supabase.co';
const PRODUCTION_WEB_REDIRECT = 'https://payonar.com/landing';

// Normalize env values that may include wrapping quotes or escaped newlines.
function sanitizeEnvValue(value: string | undefined): string {
  let next = (value ?? '').replace(/\\r\\n|\\r|\\n/g, '').replace(/\r|\n/g, '').trim();

  // Some CI/Vercel exports can keep values as "...".
  if ((next.startsWith('"') && next.endsWith('"')) || (next.startsWith("'") && next.endsWith("'"))) {
    next = next.slice(1, -1).trim();
  }

  return next;
}

const SUPABASE_URL = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_URL);
const SUPABASE_ANON_KEY = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);
const SUPABASE_AUTH_REDIRECT_TO = sanitizeEnvValue(import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_TO);
const NATIVE_AUTH_SCHEME = import.meta.env.VITE_NATIVE_AUTH_SCHEME?.trim() || 'com.theonbuka.knapsack';
const NATIVE_AUTH_HOST = import.meta.env.VITE_NATIVE_AUTH_HOST?.trim() || 'auth';
const NATIVE_AUTH_CALLBACK_PATH = import.meta.env.VITE_NATIVE_AUTH_CALLBACK_PATH?.trim() || '/callback';

let cachedAuthClient: SupabaseClient | null = null;

export type SupabaseGoogleProviderStatus = 'enabled' | 'disabled' | 'unknown';

function normalizeCallbackPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

export function isNativeAuthPlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getNativeAuthRedirectUrl(): string {
  return `${NATIVE_AUTH_SCHEME}://${NATIVE_AUTH_HOST}${normalizeCallbackPath(NATIVE_AUTH_CALLBACK_PATH)}`;
}

export function isNativeAuthCallbackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === `${NATIVE_AUTH_SCHEME}:`
      && parsed.host === NATIVE_AUTH_HOST
      && parsed.pathname === normalizeCallbackPath(NATIVE_AUTH_CALLBACK_PATH);
  } catch {
    return false;
  }
}

export function readAuthCallbackParams(url: string): URLSearchParams {
  const params = new URLSearchParams();

  try {
    const parsed = new URL(url);
    const searchParams = new URLSearchParams(parsed.search);
    const hashParams = new URLSearchParams(parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash);

    searchParams.forEach((value, key) => {
      params.set(key, value);
    });

    hashParams.forEach((value, key) => {
      params.set(key, value);
    });
  } catch {
    return params;
  }

  return params;
}

export async function openAuthUrl(url: string): Promise<void> {
  if (isNativeAuthPlatform()) {
    await Browser.open({ url });
    return;
  }

  window.location.assign(url);
}

export async function closeAuthWindow(): Promise<void> {
  try {
    await Browser.close();
  } catch {
    // Ignore close errors when no browser instance is active.
  }
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function resolveSupabaseUrl(
  rawUrl = SUPABASE_URL,
  currentOrigin = typeof window !== 'undefined' ? window.location?.origin || '' : '',
): string {
  const currentHostname = currentOrigin ? new URL(currentOrigin).hostname : '';

  if (!isNativeAuthPlatform() && currentHostname && !isLoopbackHostname(currentHostname)) {
    // Non-localhost web: prefer the explicitly configured env URL if it points
    // to a non-loopback host (covers self-hosted Supabase on the same domain).
    if (rawUrl) {
      try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol.startsWith('http') && !isLoopbackHostname(parsed.hostname)) {
          return parsed.toString();
        }
      } catch {
        // fall through to production fallback
      }
    }
    return PRODUCTION_SUPABASE_URL;
  }

  try {
    const parsed = new URL(rawUrl);

    // If production web app accidentally receives loopback Supabase URL,
    // force known-good production project URL.
    if (!isNativeAuthPlatform() && currentOrigin && !isLoopbackHostname(currentHostname) && isLoopbackHostname(parsed.hostname)) {
      return PRODUCTION_SUPABASE_URL;
    }

    return parsed.toString();
  } catch {
    return isNativeAuthPlatform() ? '' : PRODUCTION_SUPABASE_URL;
  }
}

export function resolveSupabaseAuthRedirectUrl(
  path = '/landing',
  currentOrigin = typeof window !== 'undefined' ? window.location?.origin || '' : '',
  envRedirectTo = SUPABASE_AUTH_REDIRECT_TO || '',
  nativePlatform = isNativeAuthPlatform(),
): string {
  if (nativePlatform) {
    return getNativeAuthRedirectUrl();
  }

  const currentHostname = currentOrigin ? new URL(currentOrigin).hostname : '';

  // Local development should use the active localhost origin.
  if (currentOrigin && isLoopbackHostname(currentHostname)) {
    return `${currentOrigin}${path}`;
  }

  // Use the explicitly configured redirect URL if provided, otherwise fall
  // back to the known production URL.
  if (envRedirectTo) {
    return envRedirectTo;
  }
  return PRODUCTION_WEB_REDIRECT;
}

export function getSupabaseAuthClient(): SupabaseClient | null {
  const resolvedSupabaseUrl = resolveSupabaseUrl();

  if (!resolvedSupabaseUrl || !SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const parsed = new URL(resolvedSupabaseUrl);
    if (!parsed.protocol.startsWith('http')) {
      return null;
    }
  } catch {
    return null;
  }

  if (cachedAuthClient && (cachedAuthClient as unknown as { supabaseUrl?: string }).supabaseUrl !== resolvedSupabaseUrl) {
    cachedAuthClient = null;
  }

  if (!cachedAuthClient) {
    cachedAuthClient = createClient(resolvedSupabaseUrl, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // We handle PKCE code exchange manually in Landing.tsx
        // to avoid timing race conditions with detectSessionInUrl.
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    });
  }

  return cachedAuthClient;
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(getSupabaseAuthClient());
}

export function getSupabaseGoogleAuthorizeUrl(redirectTo: string): string | null {
  const resolvedSupabaseUrl = resolveSupabaseUrl();
  if (!resolvedSupabaseUrl) {
    return null;
  }

  const authorizeUrl = new URL('/auth/v1/authorize', resolvedSupabaseUrl);
  authorizeUrl.searchParams.set('provider', 'google');
  authorizeUrl.searchParams.set('redirect_to', redirectTo);
  authorizeUrl.searchParams.set('prompt', 'select_account');

  return authorizeUrl.toString();
}

export async function getSupabaseGoogleProviderStatus(redirectTo: string): Promise<{
  status: SupabaseGoogleProviderStatus;
  message?: string;
}> {
  const authorizeUrl = getSupabaseGoogleAuthorizeUrl(redirectTo);
  if (!authorizeUrl) {
    return {
      status: 'unknown',
      message: 'Supabase auth URL bulunamadı.',
    };
  }

  try {
    const response = await fetch(authorizeUrl, {
      method: 'GET',
      redirect: 'manual',
      credentials: 'omit',
    });

    if (response.type === 'opaqueredirect') {
      return { status: 'enabled' };
    }

    if (response.status >= 300 && response.status < 400) {
      return { status: 'enabled' };
    }

    if (response.ok) {
      return { status: 'enabled' };
    }

    const bodyText = await response.text();
    if (bodyText.toLowerCase().includes('provider is not enabled')) {
      return {
        status: 'disabled',
        message: 'Supabase Google provider kapalı.',
      };
    }

    return {
      status: 'unknown',
      message: bodyText || `Google provider durumu doğrulanamadı (HTTP ${response.status}).`,
    };
  } catch (error) {
    return {
      status: 'unknown',
      message: error instanceof Error ? error.message : 'Google provider durumu doğrulanamadı.',
    };
  }
}

export function getSupabaseAuthRedirectUrl(path = '/landing'): string {
  return resolveSupabaseAuthRedirectUrl(path);
}

export function getSupabaseEmailRedirectUrl(): string {
  return getSupabaseAuthRedirectUrl('/landing');
}

export function getSupabaseRuntimeInfo(): {
  supabaseUrl: string;
  authRedirect: string;
} {
  return {
    supabaseUrl: resolveSupabaseUrl(),
    authRedirect: getSupabaseAuthRedirectUrl('/landing'),
  };
}
