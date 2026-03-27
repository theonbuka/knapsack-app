import { useState, useEffect, useCallback, useRef } from 'react';
import { customDB, DEFAULT_CATS } from '../utils/constants';
import { getActiveCloudSyncAccountId, getAnonymousScopedDataKey } from '../utils/accountStorage';
import type { Category, ExpenseItem, Transaction, UserPrefs, Wallet } from '../types';
import { getSupabaseAuthClient } from '../utils/supabaseAuth';
import { SecureStorage } from '../utils/secureStorage';
import { fetchLiveRates } from '../utils/currency';

const FALLBACK_RATES = { USD: 33.2, EUR: 35.9, GOLD: 3185 };
const DEFAULT_PREFS: UserPrefs = { currency: '₺', themeColor: 'indigo', savingsGoal: 0 };
const TRANSACTIONS_TABLE = import.meta.env.VITE_SUPABASE_TRANSACTIONS_TABLE?.trim() || 'knapsack_transactions';
const WALLETS_TABLE = import.meta.env.VITE_SUPABASE_WALLETS_TABLE?.trim() || 'knapsack_wallets';
const EXPENSES_TABLE = import.meta.env.VITE_SUPABASE_EXPENSES_TABLE?.trim() || 'knapsack_fixed_expenses';
const PREFS_TABLE = import.meta.env.VITE_SUPABASE_PREFS_TABLE?.trim() || 'knapsack_user_preferences';
const CATS_TABLE = import.meta.env.VITE_SUPABASE_CATS_TABLE?.trim() || 'knapsack_user_categories';

type WalletRecord = Wallet & { id: string };

interface FinanceData {
  trans: Transaction[];
  wallets: WalletRecord[];
  cats: Category[];
  expenses: ExpenseItem[];
  prefs: UserPrefs;
}

interface EntityRow<TPayload> {
  id: string;
  payload: TPayload;
}

interface SingletonRow<TPayload> {
  account_id: string;
  payload: TPayload;
}

type SyncStatus = 'idle' | 'syncing' | 'ok' | 'error' | 'offline';

const CLOUD_WRITE_RETRY_COUNT = 3;
const CLOUD_WRITE_RETRY_DELAY_MS = 400;

function hasMeaningfulFinanceData(payload: FinanceData): boolean {
  return payload.trans.length > 0
    || payload.wallets.length > 0
    || payload.expenses.length > 0
    || payload.cats.length > 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms);
  });
}

async function retryAsync(action: () => Promise<void>, retries: number, delayMs: number): Promise<void> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await action();
      return;
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await sleep(delayMs * attempt);
      }
    }
  }

  throw lastError;
}

function toId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function ensureWalletId(wallet: Wallet, fallbackPrefix: string): WalletRecord {
  const candidate = wallet as WalletRecord & { id?: string };
  const id = typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : toId(fallbackPrefix);
  return { ...wallet, id };
}

function normalizePrefs(raw: unknown): UserPrefs {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_PREFS;
  }

  return { ...DEFAULT_PREFS, ...(raw as UserPrefs) };
}

function normalizeCats(raw: unknown): Category[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_CATS as Category[];
  }

  return raw as Category[];
}

/** Merge two arrays by id, keeping primary items for conflicts and appending secondary-only items. */
function mergeById<T extends { id: string }>(primary: T[], secondary: T[]): T[] {
  if (!secondary.length) return primary;
  const ids = new Set(primary.map(item => item.id));
  const unique = secondary.filter(item => item.id && !ids.has(item.id));
  return unique.length ? [...primary, ...unique] : primary;
}

/**
 * Read finance data that was stored under the anonymous scope (before user logged in).
 * Returns null if nothing meaningful is there.
 */
function readAnonymousFinanceData(): FinanceData | null {
  const readAnon = <T>(baseKey: string, def: T): T => {
    const key = getAnonymousScopedDataKey(baseKey);
    const raw = localStorage.getItem(key);
    if (!raw) return def;
    try {
      return JSON.parse(raw) as T;
    } catch {
      try {
        return (SecureStorage.getSecure<T>(key)) ?? def;
      } catch {
        return def;
      }
    }
  };

  const trans = readAnon<Transaction[]>('knapsack_t', []);
  const expenses = readAnon<ExpenseItem[]>('knapsack_exp', []);
  const walletsRaw = readAnon<Wallet[]>('knapsack_w', []);

  if (!trans.length && !expenses.length && !walletsRaw.length) return null;

  return {
    trans,
    wallets: walletsRaw.map((w, i) => ensureWalletId(w, `anon_wallet_${i}`)),
    expenses,
    prefs: DEFAULT_PREFS,
    cats: DEFAULT_CATS as Category[],
  };
}

/** Remove anonymous-scope finance keys from localStorage after merging into user scope. */
function clearAnonymousFinanceScope(): void {
  ['knapsack_t', 'knapsack_w', 'knapsack_exp', 'knapsack_p', 'knapsack_cats'].forEach(baseKey => {
    localStorage.removeItem(getAnonymousScopedDataKey(baseKey));
  });
}

function readLocalFinanceData(): FinanceData {
  const walletsRaw = customDB.get('knapsack_w', []) as Wallet[];
  return {
    trans: customDB.get('knapsack_t', []) as Transaction[],
    wallets: walletsRaw.map((wallet, index) => ensureWalletId(wallet, `legacy_wallet_${index}`)),
    expenses: customDB.get('knapsack_exp', []) as ExpenseItem[],
    prefs: normalizePrefs(customDB.get('knapsack_p', DEFAULT_PREFS)),
    cats: normalizeCats(customDB.get('knapsack_cats', DEFAULT_CATS)),
  };
}

function writeLocalFinanceData(next: FinanceData): void {
  customDB.set('knapsack_t', next.trans);
  customDB.set('knapsack_w', next.wallets);
  customDB.set('knapsack_exp', next.expenses);
  customDB.set('knapsack_p', next.prefs);
  customDB.set('knapsack_cats', next.cats);
}

async function readEntityRows<TPayload>(table: string, accountId: string): Promise<Array<EntityRow<TPayload>>> {
  const client = getSupabaseAuthClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from(table)
    .select('id,payload')
    .eq('account_id', accountId);

  if (error) {
    throw new Error(`${table} read failed: ${error.message}`);
  }

  return (data || []) as Array<EntityRow<TPayload>>;
}

async function upsertEntityRow<TPayload>(table: string, accountId: string, id: string, payload: TPayload): Promise<void> {
  const client = getSupabaseAuthClient();
  if (!client) {
    return;
  }

  const { error } = await client
    .from(table)
    .upsert({ account_id: accountId, id, payload }, { onConflict: 'account_id,id' });

  if (error) {
    throw new Error(`${table} upsert failed: ${error.message}`);
  }
}

async function deleteEntityRow(table: string, accountId: string, id: string): Promise<void> {
  const client = getSupabaseAuthClient();
  if (!client) {
    return;
  }

  const { error } = await client
    .from(table)
    .delete()
    .eq('account_id', accountId)
    .eq('id', id);

  if (error) {
    throw new Error(`${table} delete failed: ${error.message}`);
  }
}

async function readSingletonPayload<TPayload>(table: string, accountId: string): Promise<TPayload | null> {
  const client = getSupabaseAuthClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from(table)
    .select('account_id,payload')
    .eq('account_id', accountId)
    .maybeSingle();

  if (error) {
    throw new Error(`${table} read failed: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return (data as SingletonRow<TPayload>).payload;
}

async function upsertSingletonPayload<TPayload>(table: string, accountId: string, payload: TPayload): Promise<void> {
  const client = getSupabaseAuthClient();
  if (!client) {
    return;
  }

  const { error } = await client
    .from(table)
    .upsert({ account_id: accountId, payload }, { onConflict: 'account_id' });

  if (error) {
    throw new Error(`${table} upsert failed: ${error.message}`);
  }
}

export function useFinance() {
  const initialData = readLocalFinanceData();
  const [data, setData] = useState<FinanceData>(initialData);
  const [liveRates, setLiveRates] = useState(FALLBACK_RATES);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const ratesRef = useRef(FALLBACK_RATES);
  const dataRef = useRef<FinanceData>(initialData);

  const persistCloudMutation = useCallback((label: string, action: () => Promise<void>) => {
    void retryAsync(action, CLOUD_WRITE_RETRY_COUNT, CLOUD_WRITE_RETRY_DELAY_MS)
      .then(() => {
        setLastSyncAt(Date.now());
        setLastSyncError(null);
        setSyncStatus(previous => (previous === 'offline' ? 'offline' : 'ok'));
      })
      .catch(error => {
        const message = error instanceof Error ? error.message : 'Bilinmeyen bulut yazim hatasi';
        setLastSyncError(`${label}: ${message}`);
        setSyncStatus('error');
        console.error(`Cloud mutation failed (${label}):`, error);
      });
  }, []);

  const commitLocalData = useCallback((next: FinanceData) => {
    dataRef.current = next;
    setData(next);
    writeLocalFinanceData(next);
  }, []);

  const syncFromRemote = useCallback(async () => {
    const accountId = getActiveCloudSyncAccountId();
    if (!accountId) {
      const local = readLocalFinanceData();
      // Even in offline mode, rescue any data added pre-login (anonymous scope).
      const anonData = readAnonymousFinanceData();
      if (anonData) {
        const merged: FinanceData = {
          trans: mergeById(local.trans, anonData.trans)
            .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()),
          wallets: local.wallets.length > 0
            ? mergeById(local.wallets, anonData.wallets)
            : anonData.wallets,
          expenses: mergeById(local.expenses, anonData.expenses),
          prefs: local.prefs,
          cats: local.cats,
        };
        clearAnonymousFinanceScope();
        commitLocalData(merged);
      } else {
        commitLocalData(local);
      }
      setSyncStatus('offline');
      setLastSyncError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSyncStatus('syncing');
    try {
      const localSnapshot = readLocalFinanceData();
      const [txRows, walletRows, expenseRows, prefsPayload, catsPayload] = await Promise.all([
        readEntityRows<Transaction>(TRANSACTIONS_TABLE, accountId),
        readEntityRows<Wallet>(WALLETS_TABLE, accountId),
        readEntityRows<ExpenseItem>(EXPENSES_TABLE, accountId),
        readSingletonPayload<UserPrefs>(PREFS_TABLE, accountId),
        readSingletonPayload<Category[]>(CATS_TABLE, accountId),
      ]);

      const trans = txRows
        .map(row => ({ ...row.payload, id: row.payload.id || row.id }))
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      const wallets = walletRows.map((row, index) => ensureWalletId({ ...row.payload, id: row.id }, `wallet_${index}`));
      const expenses = expenseRows.map(row => ({ ...row.payload, id: row.payload.id || row.id }));

      const next: FinanceData = {
        trans,
        wallets,
        expenses,
        prefs: normalizePrefs(prefsPayload),
        cats: normalizeCats(catsPayload),
      };

      const remoteHasData = hasMeaningfulFinanceData(next);

      // Also read any data added while the user was logged-out (anonymous scope).
      const anonData = readAnonymousFinanceData();

      // ── Merge Strategy ──────────────────────────────────────────────────────
      // Never lose data: merge remote + local + anonymous by record ID so that
      // records added on this device before login or while offline are preserved.
      // Remote wins for prefs/cats (intentionally managed); arrays are unioned.
      // ────────────────────────────────────────────────────────────────────────
      const localTrans = [...localSnapshot.trans, ...(anonData?.trans ?? [])];
      const localExpenses = [...localSnapshot.expenses, ...(anonData?.expenses ?? [])];
      const localWallets = [...localSnapshot.wallets, ...(anonData?.wallets ?? [])];

      const mergedTrans = mergeById(next.trans, localTrans)
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      const mergedExpenses = mergeById(next.expenses, localExpenses);
      const mergedWallets = next.wallets.length > 0
        ? mergeById(next.wallets, localWallets)
        : localWallets;

      const final: FinanceData = {
        trans: mergedTrans,
        wallets: mergedWallets,
        expenses: mergedExpenses,
        prefs: remoteHasData ? next.prefs : normalizePrefs(localSnapshot.prefs),
        cats: remoteHasData ? next.cats : normalizeCats(localSnapshot.cats),
      };

      // Clear anonymous scope — data is now merged into the user scope.
      if (anonData) {
        clearAnonymousFinanceScope();
      }

      commitLocalData(final);
      setLastSyncAt(Date.now());
      setLastSyncError(null);
      setSyncStatus('ok');

      // Upload any records that exist locally/anonymously but are missing from cloud.
      const remoteTxIds = new Set(next.trans.map(t => t.id));
      const remoteExpIds = new Set(next.expenses.map(e => e.id));
      const remoteWalletIds = new Set(next.wallets.map(w => w.id));
      const localOnlyTrans = final.trans.filter(t => !remoteTxIds.has(t.id));
      const localOnlyExpenses = final.expenses.filter(e => !remoteExpIds.has(e.id));
      const localOnlyWallets = final.wallets.filter(w => !remoteWalletIds.has(w.id));

      if (localOnlyTrans.length || localOnlyExpenses.length || localOnlyWallets.length) {
        void retryAsync(
          () => Promise.all([
            ...localOnlyTrans.map(t => upsertEntityRow(TRANSACTIONS_TABLE, accountId, t.id, t)),
            ...localOnlyExpenses.map(e => upsertEntityRow(EXPENSES_TABLE, accountId, e.id, e)),
            ...localOnlyWallets.map(w => upsertEntityRow(WALLETS_TABLE, accountId, w.id, w)),
          ]).then(() => undefined),
          CLOUD_WRITE_RETRY_COUNT,
          CLOUD_WRITE_RETRY_DELAY_MS,
        ).catch(err => {
          const message = err instanceof Error ? err.message : 'Yerel kayitlar buluta yuklenemedi';
          console.error('Cloud backfill of local-only records failed:', err);
          setLastSyncError(`bulut-yedekleme: ${message}`);
          setSyncStatus('error');
        });
      }
    } catch (err) {
      console.error('Remote finance sync failed:', err);
      const local = readLocalFinanceData();
      commitLocalData(local);
      setLastSyncError(err instanceof Error ? err.message : 'Bulut senkronu basarisiz oldu');
      setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  }, [commitLocalData]);

  const refresh = useCallback(() => {
    void syncFromRemote();
  }, [syncFromRemote]);

  useEffect(() => {
    void syncFromRemote();
  }, [syncFromRemote]);

  useEffect(() => {
    fetchLiveRates()
      .then(rates => {
        const updated = { ...ratesRef.current, USD: rates.USD, EUR: rates.EUR };
        ratesRef.current = updated;
        setLiveRates(updated);
      })
      .catch(() => {});
  }, []);

  const addTransaction = useCallback((form: Partial<Transaction>) => {
    if (!form.amount || parseFloat(String(form.amount)) <= 0) {
      throw new Error('Geçerli bir miktar giriniz');
    }
    if (!form.title || form.title.trim().length === 0) {
      throw new Error('İşlem başlığı gerekli');
    }
    if (!form.categoryId) {
      throw new Error('Kategori seçimi gerekli');
    }

    const rates = ratesRef.current;
    let tlAmt = parseFloat(String(form.amount || 0));
    if (form.currency === 'USD') tlAmt *= rates.USD;
    if (form.currency === 'EUR') tlAmt *= rates.EUR;

    const newTx: Transaction = {
      ...(form as Transaction),
      id: toId('tx'),
      amount: tlAmt,
      created: typeof form.created === 'string' && form.created ? form.created : new Date().toISOString(),
      type: form.type === 'income' ? 'income' : 'expense',
      currency: form.currency || '₺',
      title: form.title.trim(),
      categoryId: form.categoryId,
    };

    const next: FinanceData = { ...dataRef.current, trans: [newTx, ...dataRef.current.trans] };
    commitLocalData(next);

    const accountId = getActiveCloudSyncAccountId();
    if (accountId) {
      persistCloudMutation('islem-ekle', () => upsertEntityRow(TRANSACTIONS_TABLE, accountId, newTx.id, newTx));
    }

    return true;
  }, [commitLocalData, persistCloudMutation]);

  const updateTransaction = useCallback((id: string, patch: Partial<Transaction>) => {
    const rates = ratesRef.current;
    const nextTrans = dataRef.current.trans.map(item => {
      if (item.id !== id) return item;

      let amount = parseFloat(String(patch.amount ?? item.amount ?? 0));
      const currency = patch.currency || item.currency;
      if (currency === 'USD') amount *= rates.USD;
      if (currency === 'EUR') amount *= rates.EUR;

      return { ...item, ...patch, amount, currency };
    });

    const next: FinanceData = { ...dataRef.current, trans: nextTrans };
    commitLocalData(next);

    const accountId = getActiveCloudSyncAccountId();
    if (!accountId) return;

    const updated = nextTrans.find(item => item.id === id);
    if (updated) {
      persistCloudMutation('islem-guncelle', () => upsertEntityRow(TRANSACTIONS_TABLE, accountId, updated.id, updated));
    }
  }, [commitLocalData, persistCloudMutation]);

  const removeTransaction = useCallback((id: string) => {
    const next: FinanceData = { ...dataRef.current, trans: dataRef.current.trans.filter(item => item.id !== id) };
    commitLocalData(next);

    const accountId = getActiveCloudSyncAccountId();
    if (accountId) {
      persistCloudMutation('islem-sil', () => deleteEntityRow(TRANSACTIONS_TABLE, accountId, id));
    }
  }, [commitLocalData, persistCloudMutation]);

  const addWallet = useCallback((wallet: Wallet) => {
    const nextWallet = ensureWalletId(wallet, 'wallet');
    const next: FinanceData = { ...dataRef.current, wallets: [...dataRef.current.wallets, nextWallet] };
    commitLocalData(next);

    const accountId = getActiveCloudSyncAccountId();
    if (accountId) {
      persistCloudMutation('varlik-ekle', () => upsertEntityRow(WALLETS_TABLE, accountId, nextWallet.id, nextWallet));
    }
  }, [commitLocalData, persistCloudMutation]);

  const updateWallet = useCallback((index: number, wallet: Wallet) => {
    const current = dataRef.current.wallets[index];
    if (!current) return;

    const updatedWallet: WalletRecord = ensureWalletId({ ...wallet, id: current.id }, 'wallet');
    const nextWallets = dataRef.current.wallets.map((item, itemIndex) => (itemIndex === index ? updatedWallet : item));
    const next: FinanceData = { ...dataRef.current, wallets: nextWallets };
    commitLocalData(next);

    const accountId = getActiveCloudSyncAccountId();
    if (accountId) {
      persistCloudMutation('varlik-guncelle', () => upsertEntityRow(WALLETS_TABLE, accountId, updatedWallet.id, updatedWallet));
    }
  }, [commitLocalData, persistCloudMutation]);

  const removeWallet = useCallback((index: number) => {
    const current = dataRef.current.wallets[index];
    if (!current) return;

    const nextWallets = dataRef.current.wallets.filter((_, itemIndex) => itemIndex !== index);
    const next: FinanceData = { ...dataRef.current, wallets: nextWallets };
    commitLocalData(next);

    const accountId = getActiveCloudSyncAccountId();
    if (accountId) {
      persistCloudMutation('varlik-sil', () => deleteEntityRow(WALLETS_TABLE, accountId, current.id));
    }
  }, [commitLocalData, persistCloudMutation]);

  const addExpense = useCallback((expense: Partial<ExpenseItem>) => {
    const item: ExpenseItem = {
      ...(expense as ExpenseItem),
      id: expense.id || toId('exp'),
      paidMonths: Array.isArray(expense.paidMonths) ? expense.paidMonths : [],
      type: expense.type || 'bill',
      name: expense.name || 'Yeni gider',
      amount: expense.amount || 0,
      currency: expense.currency || '₺',
      dueDay: expense.dueDay || 1,
    };

    const next: FinanceData = { ...dataRef.current, expenses: [...dataRef.current.expenses, item] };
    commitLocalData(next);

    const accountId = getActiveCloudSyncAccountId();
    if (accountId) {
      persistCloudMutation('gider-ekle', () => upsertEntityRow(EXPENSES_TABLE, accountId, item.id, item));
    }
  }, [commitLocalData, persistCloudMutation]);

  const updateExpense = useCallback((id: string, patch: Partial<ExpenseItem>) => {
    const nextExpenses = dataRef.current.expenses.map(item => (item.id === id ? { ...item, ...patch } : item));
    const next: FinanceData = { ...dataRef.current, expenses: nextExpenses };
    commitLocalData(next);

    const accountId = getActiveCloudSyncAccountId();
    if (!accountId) return;

    const updated = nextExpenses.find(item => item.id === id);
    if (updated) {
      persistCloudMutation('gider-guncelle', () => upsertEntityRow(EXPENSES_TABLE, accountId, updated.id, updated));
    }
  }, [commitLocalData, persistCloudMutation]);

  const removeExpense = useCallback((id: string) => {
    const next: FinanceData = { ...dataRef.current, expenses: dataRef.current.expenses.filter(item => item.id !== id) };
    commitLocalData(next);

    const accountId = getActiveCloudSyncAccountId();
    if (accountId) {
      persistCloudMutation('gider-sil', () => deleteEntityRow(EXPENSES_TABLE, accountId, id));
    }
  }, [commitLocalData, persistCloudMutation]);

  const toggleExpensePaid = useCallback((id: string) => {
    const monthKey = new Date().toISOString().slice(0, 7);
    const nextExpenses = dataRef.current.expenses.map(item => {
      if (item.id !== id) return item;
      const paidMonths = Array.isArray(item.paidMonths) ? item.paidMonths : [];
      const nextPaidMonths = paidMonths.includes(monthKey)
        ? paidMonths.filter(month => month !== monthKey)
        : [...paidMonths, monthKey];
      return { ...item, paidMonths: nextPaidMonths };
    });

    const next: FinanceData = { ...dataRef.current, expenses: nextExpenses };
    commitLocalData(next);

    const accountId = getActiveCloudSyncAccountId();
    if (!accountId) return;

    const updated = nextExpenses.find(item => item.id === id);
    if (updated) {
      persistCloudMutation('gider-odeme-toggle', () => upsertEntityRow(EXPENSES_TABLE, accountId, updated.id, updated));
    }
  }, [commitLocalData, persistCloudMutation]);

  const savePrefs = useCallback((prefs: UserPrefs) => {
    const nextPrefs = normalizePrefs(prefs);
    const next: FinanceData = { ...dataRef.current, prefs: nextPrefs };
    commitLocalData(next);

    const accountId = getActiveCloudSyncAccountId();
    if (accountId) {
      persistCloudMutation('tercih-kaydet', () => upsertSingletonPayload(PREFS_TABLE, accountId, nextPrefs));
    }
  }, [commitLocalData, persistCloudMutation]);

  const saveCats = useCallback((cats: Category[]) => {
    const nextCats = normalizeCats(cats);
    const next: FinanceData = { ...dataRef.current, cats: nextCats };
    commitLocalData(next);

    const accountId = getActiveCloudSyncAccountId();
    if (accountId) {
      persistCloudMutation('kategori-kaydet', () => upsertSingletonPayload(CATS_TABLE, accountId, nextCats));
    }
  }, [commitLocalData, persistCloudMutation]);

  return {
    data,
    liveRates,
    addTransaction,
    updateTransaction,
    removeTransaction,
    addWallet,
    updateWallet,
    removeWallet,
    addExpense,
    removeExpense,
    toggleExpensePaid,
    updateExpense,
    savePrefs,
    saveCats,
    refresh,
    loading,
    syncStatus,
    lastSyncAt,
    lastSyncError,
  };
}
