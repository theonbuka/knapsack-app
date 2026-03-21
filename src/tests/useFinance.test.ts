import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFinance } from '../hooks/useFinance';

describe('useFinance hook behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network offline')));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('initializes with expected default state', () => {
    const { result } = renderHook(() => useFinance());

    expect(result.current.data.wallets).toEqual([]);
    expect(result.current.data.trans).toEqual([]);
    expect(result.current.data.expenses).toEqual([]);
    expect(result.current.data.prefs.currency).toBe('₺');
  });

  it('adds USD transaction and stores TRY-converted amount', async () => {
    const { result } = renderHook(() => useFinance());

    act(() => {
      result.current.addTransaction({
        type: 'expense',
        amount: '10',
        currency: 'USD',
        title: 'Test USD Expense',
        categoryId: 'c1',
        note: '',
        walletId: '',
      });
    });

    await waitFor(() => {
      expect(result.current.data.trans).toHaveLength(1);
    });

    const [stored] = result.current.data.trans;
    expect(stored.title).toBe('Test USD Expense');
    expect(Number(stored.amount)).toBeCloseTo(332, 2);
  });

  it('throws validation errors for invalid transaction payload', () => {
    const { result } = renderHook(() => useFinance());

    expect(() => {
      act(() => {
        result.current.addTransaction({
          type: 'expense',
          amount: '0',
          currency: '₺',
          title: 'Invalid Amount',
          categoryId: 'c1',
        });
      });
    }).toThrow('Geçerli bir miktar giriniz');

    expect(() => {
      act(() => {
        result.current.addTransaction({
          type: 'expense',
          amount: '10',
          currency: '₺',
          title: '   ',
          categoryId: 'c1',
        });
      });
    }).toThrow('İşlem başlığı gerekli');
  });

  it('toggles paid status for the current month', async () => {
    const { result } = renderHook(() => useFinance());

    act(() => {
      result.current.addExpense({
        type: 'bill',
        name: 'Elektrik',
        amount: 450,
        currency: '₺',
        dueDay: 10,
      });
    });

    await waitFor(() => {
      expect(result.current.data.expenses).toHaveLength(1);
    });

    const expenseId = result.current.data.expenses[0].id;
    const currentMonth = new Date().toISOString().slice(0, 7);

    act(() => {
      result.current.toggleExpensePaid(expenseId);
    });

    await waitFor(() => {
      expect(result.current.data.expenses[0].paidMonths).toContain(currentMonth);
    });

    act(() => {
      result.current.toggleExpensePaid(expenseId);
    });

    await waitFor(() => {
      expect(result.current.data.expenses[0].paidMonths || []).not.toContain(currentMonth);
    });
  });
});
