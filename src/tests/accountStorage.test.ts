import { afterEach, describe, expect, it } from 'vitest';
import {
  clearActiveCloudSyncAccountId,
  clearActiveUserStorageId,
  getActiveCloudSyncAccountId,
  getAnonymousScopedDataKey,
  getAuthStorageId,
  getCloudSyncAccountId,
  getScopedDataKey,
  migrateLegacyDataToUser,
  setActiveCloudSyncAccountId,
} from '../utils/accountStorage';

describe('accountStorage helpers', () => {
  afterEach(() => {
    clearActiveUserStorageId();
    clearActiveCloudSyncAccountId();
    localStorage.clear();
  });

  it('keeps local storage scope identity separate from cloud sync identity', () => {
    expect(getAuthStorageId({ email: 'user@example.com', supabaseUserId: 'supabase-user-1' })).toBe('uid:supabase-user-1');
    expect(getCloudSyncAccountId({ email: 'user@example.com', supabaseUserId: 'supabase-user-1' })).toBe('supabase-user-1');
  });

  it('returns empty cloud sync identity when no Supabase user exists', () => {
    expect(getCloudSyncAccountId({ email: 'local@example.com' })).toBe('');
    expect(getCloudSyncAccountId({ googleId: 'google-only-user' })).toBe('');
  });

  it('persists the active cloud sync account independently', () => {
    setActiveCloudSyncAccountId('supabase-user-42');
    expect(getActiveCloudSyncAccountId()).toBe('supabase-user-42');

    clearActiveCloudSyncAccountId();
    expect(getActiveCloudSyncAccountId()).toBe('');
  });

  it('migrates anonymous scoped data into user scope on first authenticated session', () => {
    const targetStorageId = 'uid:test-user-1';
    const sourceAnonymousTxKey = getAnonymousScopedDataKey('knapsack_t');
    const sourceAnonymousPrefsKey = getAnonymousScopedDataKey('knapsack_p');
    const destinationTxKey = getScopedDataKey('knapsack_t', targetStorageId);
    const destinationPrefsKey = getScopedDataKey('knapsack_p', targetStorageId);

    localStorage.setItem(sourceAnonymousTxKey, JSON.stringify([{ id: 'tx_1', amount: 10 }]));
    localStorage.setItem(sourceAnonymousPrefsKey, JSON.stringify({ currency: '₺', themeColor: 'indigo', savingsGoal: 0 }));

    migrateLegacyDataToUser(targetStorageId);

    expect(localStorage.getItem(destinationTxKey)).toBe(JSON.stringify([{ id: 'tx_1', amount: 10 }]));
    expect(localStorage.getItem(destinationPrefsKey)).toBe(JSON.stringify({ currency: '₺', themeColor: 'indigo', savingsGoal: 0 }));
    expect(localStorage.getItem(sourceAnonymousTxKey)).toBeNull();
    expect(localStorage.getItem(sourceAnonymousPrefsKey)).toBeNull();
  });
});