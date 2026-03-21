import { AuthState } from '../types';

const ACTIVE_USER_KEY = 'knapsack_active_user';
const ACTIVE_CLOUD_ACCOUNT_KEY = 'knapsack_active_cloud_account';
const USER_PREFIX = 'knapsack_user';
const SYNC_META_PREFIX = 'knapsack_sync_meta';
const ACCOUNT_SCOPED_KEYS = ['knapsack_w', 'knapsack_t', 'knapsack_exp', 'knapsack_p', 'knapsack_cats'] as const;

function cleanSegment(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_').slice(0, 96);
}

export function getAuthStorageId(auth: Partial<AuthState> | null | undefined): string {
  if (!auth) return '';

  if (auth.supabaseUserId?.trim()) {
    return `uid:${cleanSegment(auth.supabaseUserId)}`;
  }

  return '';
}

export function getCloudSyncAccountId(auth: Partial<AuthState> | null | undefined): string {
  if (!auth?.supabaseUserId?.trim()) {
    return '';
  }

  return auth.supabaseUserId.trim();
}

export function setActiveUserStorageId(storageId: string): void {
  if (!storageId) return;
  localStorage.setItem(ACTIVE_USER_KEY, storageId);
}

export function getActiveUserStorageId(): string {
  return localStorage.getItem(ACTIVE_USER_KEY) || '';
}

export function clearActiveUserStorageId(): void {
  localStorage.removeItem(ACTIVE_USER_KEY);
}

export function setActiveCloudSyncAccountId(accountId: string): void {
  if (!accountId) return;
  localStorage.setItem(ACTIVE_CLOUD_ACCOUNT_KEY, accountId);
}

export function getActiveCloudSyncAccountId(): string {
  return localStorage.getItem(ACTIVE_CLOUD_ACCOUNT_KEY) || '';
}

export function clearActiveCloudSyncAccountId(): void {
  localStorage.removeItem(ACTIVE_CLOUD_ACCOUNT_KEY);
}

export function getSyncMetaKey(storageId: string): string {
  if (!storageId) return `${SYNC_META_PREFIX}:anonymous`;
  return `${SYNC_META_PREFIX}:${storageId}`;
}

export function getLocalSyncStamp(storageId: string): number {
  if (!storageId) return 0;

  const raw = localStorage.getItem(getSyncMetaKey(storageId));
  if (!raw) return 0;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function setLocalSyncStamp(storageId: string, stamp = Date.now()): void {
  if (!storageId) return;
  localStorage.setItem(getSyncMetaKey(storageId), String(stamp));
}

export function clearLocalSyncStamp(storageId: string): void {
  if (!storageId) return;
  localStorage.removeItem(getSyncMetaKey(storageId));
}

export function isAccountScopedDataKey(baseKey: string): boolean {
  return ACCOUNT_SCOPED_KEYS.includes(baseKey as (typeof ACCOUNT_SCOPED_KEYS)[number]);
}

export function getScopedDataKey(baseKey: string, storageId?: string): string {
  const resolvedStorageId = storageId || getActiveUserStorageId();
  if (!resolvedStorageId) return `${USER_PREFIX}:anonymous:${baseKey}`;
  return `${USER_PREFIX}:${resolvedStorageId}:${baseKey}`;
}

/** Always returns the anonymous-scope key regardless of which user is active. */
export function getAnonymousScopedDataKey(baseKey: string): string {
  return `${USER_PREFIX}:anonymous:${baseKey}`;
}

export function getAllScopedDataKeys(storageId: string): string[] {
  if (!storageId) return [];
  return ACCOUNT_SCOPED_KEYS.map(
    key => `${USER_PREFIX}:${storageId}:${key}`
  );
}

export function migrateLegacyDataToUser(storageId: string): void {
  if (!storageId) return;

  const hasAnyUserScopedData = getAllScopedDataKeys(storageId)
    .some(key => localStorage.getItem(key) !== null);
  if (hasAnyUserScopedData) return;

  // First-login rescue: move anonymous-scoped data into the authenticated scope.
  ACCOUNT_SCOPED_KEYS.forEach(baseKey => {
    const destinationKey = getScopedDataKey(baseKey, storageId);
    if (localStorage.getItem(destinationKey) !== null) return;

    const legacyRaw = localStorage.getItem(baseKey);
    const anonymousKey = getAnonymousScopedDataKey(baseKey);
    const anonymousRaw = localStorage.getItem(anonymousKey);
    const sourceRaw = legacyRaw ?? anonymousRaw;

    if (sourceRaw === null) return;

    localStorage.setItem(destinationKey, sourceRaw);

    if (legacyRaw !== null) {
      localStorage.removeItem(baseKey);
    }

    if (anonymousRaw !== null) {
      localStorage.removeItem(anonymousKey);
    }
  });
}
