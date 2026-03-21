import { afterEach, describe, expect, it } from 'vitest';
import {
  clearActiveCloudSyncAccountId,
  clearActiveUserStorageId,
  getActiveCloudSyncAccountId,
  getAuthStorageId,
  getCloudSyncAccountId,
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
});