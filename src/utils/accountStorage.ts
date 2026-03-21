import { AuthState } from '../types';

const ACTIVE_USER_KEY = 'knapsack_active_user';
const ACTIVE_CLOUD_ACCOUNT_KEY = 'knapsack_active_cloud_account';
const USER_PREFIX = 'knapsack_user';
const SYNC_META_PREFIX = 'knapsack_sync_meta';

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
  return ['knapsack_w', 'knapsack_t', 'knapsack_exp', 'knapsack_p', 'knapsack_cats'].includes(baseKey);
}

export function getScopedDataKey(baseKey: string, storageId?: string): string {
  const resolvedStorageId = storageId || getActiveUserStorageId();
  if (!resolvedStorageId) return `${USER_PREFIX}:anonymous:${baseKey}`;
  return `${USER_PREFIX}:${resolvedStorageId}:${baseKey}`;
}

export function getAllScopedDataKeys(storageId: string): string[] {
  if (!storageId) return [];
  return ['knapsack_w', 'knapsack_t', 'knapsack_exp', 'knapsack_p', 'knapsack_cats'].map(
    key => `${USER_PREFIX}:${storageId}:${key}`
  );
}

export function migrateLegacyDataToUser(storageId: string): void {
  if (!storageId) return;

  const scopedPrefsKey = getScopedDataKey('knapsack_p', storageId);
  const hasScopedData = localStorage.getItem(scopedPrefsKey);
  if (hasScopedData) return;

  const legacyKeys = ['knapsack_w', 'knapsack_t', 'knapsack_exp', 'knapsack_p', 'knapsack_cats'];
  legacyKeys.forEach(key => {
    const legacy = localStorage.getItem(key);
    if (!legacy) return;
    localStorage.setItem(getScopedDataKey(key, storageId), legacy);
    localStorage.removeItem(key);
  });
}
