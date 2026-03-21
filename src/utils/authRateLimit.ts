type AuthRateLimitAction = 'login' | 'register';

interface AuthRateLimitEntry {
  count: number;
  resetAt: number;
}

type AuthRateLimitState = Record<string, AuthRateLimitEntry>;

export interface AuthRateLimitStatus {
  blocked: boolean;
  retryAfterSeconds: number;
}

const STORAGE_KEY = 'knapsack_auth_rate_limit_v1';
const RATE_LIMIT_DISABLED = import.meta.env.VITE_DISABLE_AUTH_RATE_LIMIT === 'true';
const MAX_ATTEMPTS = parsePositiveInteger(import.meta.env.VITE_AUTH_MAX_ATTEMPTS, 8);
const WINDOW_SECONDS = parsePositiveInteger(import.meta.env.VITE_AUTH_RATE_LIMIT_WINDOW_SECONDS, 900);
const WINDOW_MS = WINDOW_SECONDS * 1000;

function parsePositiveInteger(raw: string | undefined, fallback: number): number {
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getBucketKey(action: AuthRateLimitAction, email: string): string {
  return `${action}:${email.trim().toLowerCase()}`;
}

function readState(): AuthRateLimitState {
  if (RATE_LIMIT_DISABLED) {
    return {};
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const now = Date.now();
    const state: AuthRateLimitState = {};
    let changed = false;

    Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
      if (!value || typeof value !== 'object') {
        changed = true;
        return;
      }

      const candidate = value as Partial<AuthRateLimitEntry>;
      const count = typeof candidate.count === 'number' && Number.isFinite(candidate.count) ? candidate.count : 0;
      const resetAt = typeof candidate.resetAt === 'number' && Number.isFinite(candidate.resetAt) ? candidate.resetAt : 0;

      if (count <= 0 || resetAt <= now) {
        changed = true;
        return;
      }

      state[key] = { count, resetAt };
    });

    if (changed) {
      writeState(state);
    }

    return state;
  } catch {
    return {};
  }
}

function writeState(state: AuthRateLimitState): void {
  if (RATE_LIMIT_DISABLED) {
    return;
  }

  try {
    const keys = Object.keys(state);
    if (keys.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors; auth flow should continue even if rate-limit state cannot persist.
  }
}

export function getAuthRateLimitStatus(action: AuthRateLimitAction, email: string): AuthRateLimitStatus {
  if (RATE_LIMIT_DISABLED) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  const state = readState();
  const bucketKey = getBucketKey(action, email);
  const entry = state[bucketKey];

  if (!entry || entry.count < MAX_ATTEMPTS) {
    return { blocked: false, retryAfterSeconds: 0 };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000));
  return { blocked: true, retryAfterSeconds };
}

export function recordAuthFailure(action: AuthRateLimitAction, email: string): void {
  if (RATE_LIMIT_DISABLED) {
    return;
  }

  const state = readState();
  const bucketKey = getBucketKey(action, email);
  const now = Date.now();
  const existing = state[bucketKey];

  if (!existing || existing.resetAt <= now) {
    state[bucketKey] = {
      count: 1,
      resetAt: now + WINDOW_MS,
    };
  } else {
    state[bucketKey] = {
      count: existing.count + 1,
      resetAt: existing.resetAt,
    };
  }

  writeState(state);
}

export function clearAuthFailures(action: AuthRateLimitAction, email: string): void {
  if (RATE_LIMIT_DISABLED) {
    return;
  }

  const state = readState();
  const bucketKey = getBucketKey(action, email);

  if (!state[bucketKey]) {
    return;
  }

  delete state[bucketKey];
  writeState(state);
}
