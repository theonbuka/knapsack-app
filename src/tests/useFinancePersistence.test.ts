import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearActiveCloudSyncAccountId,
  clearActiveUserStorageId,
  setActiveCloudSyncAccountId,
  setActiveUserStorageId,
} from '../utils/accountStorage';
import { customDB, DEFAULT_CATS } from '../utils/constants';

const { getSupabaseAuthClientMock } = vi.hoisted(() => ({
  getSupabaseAuthClientMock: vi.fn(),
}));

vi.mock('../utils/supabaseAuth', () => ({
  getSupabaseAuthClient: getSupabaseAuthClientMock,
}));

import { useFinance } from '../hooks/useFinance';

const DEFAULT_PREFS = { currency: '₺', themeColor: 'indigo', savingsGoal: 0 };

function makeTransaction(id: string, title: string) {
  return {
    id,
    type: 'expense' as const,
    amount: 1250,
    currency: '₺',
    title,
    categoryId: 'c1',
    created: new Date(2026, 2, 8, 12, 0, 0).toISOString(),
  };
}

describe('useFinance persistence regressions', () => {
  beforeEach(() => {
    localStorage.clear();
    clearActiveUserStorageId();
    clearActiveCloudSyncAccountId();
    getSupabaseAuthClientMock.mockReset();
    getSupabaseAuthClientMock.mockReturnValue(null);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network offline')));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    clearActiveUserStorageId();
    clearActiveCloudSyncAccountId();
    localStorage.clear();
  });

  it('reloads scoped data when the active user storage id changes', async () => {
    setActiveUserStorageId('uid:first-user');
    customDB.set('knapsack_t', [makeTransaction('tx-1', 'İlk hesap verisi')]);

    setActiveUserStorageId('uid:second-user');
    customDB.set('knapsack_t', [makeTransaction('tx-2', 'İkinci hesap verisi')]);

    setActiveUserStorageId('uid:first-user');

    const { result, rerender } = renderHook(() => useFinance());

    await waitFor(() => {
      expect(result.current.data.trans[0]?.title).toBe('İlk hesap verisi');
    });

    act(() => {
      setActiveUserStorageId('uid:second-user');
      result.current.refresh();
    });
    rerender();

    await waitFor(() => {
      expect(result.current.data.trans[0]?.title).toBe('İkinci hesap verisi');
    });
  });

  it('keeps meaningful local data when supabase client is unavailable', async () => {
    setActiveUserStorageId('uid:cloud-user');
    setActiveCloudSyncAccountId('supabase-user-1');
    customDB.set('knapsack_t', [makeTransaction('tx-local', 'Yerel hesap verisi')]);

    const { result } = renderHook(() => useFinance());

    await waitFor(() => {
      expect(result.current.data.trans[0]?.title).toBe('Yerel hesap verisi');
    });
  });

  it('keeps local optimistic transaction updates when remote client is unavailable', async () => {
    setActiveUserStorageId('uid:optimistic-user');
    setActiveCloudSyncAccountId('supabase-user-optimistic');
    const { result } = renderHook(() => useFinance());

    act(() => {
      result.current.addTransaction({
        type: 'expense',
        amount: '100',
        currency: '₺',
        title: 'Optimistik kayıt',
        categoryId: 'c1',
      });
    });

    await waitFor(() => {
      expect(result.current.data.trans[0]?.title).toBe('Optimistik kayıt');
    });
  });
});