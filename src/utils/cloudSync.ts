import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAuthClient } from './supabaseAuth';

const SYNC_TABLE = import.meta.env.VITE_SUPABASE_SYNC_TABLE?.trim() || 'knapsack_user_data';
const CLOUD_SYNC_DISABLED = import.meta.env.VITE_DISABLE_CLOUD_SYNC === 'true';

export interface FinanceSnapshot {
  wallets: unknown[];
  trans: unknown[];
  expenses: unknown[];
  prefs: Record<string, unknown>;
  cats: unknown[];
  updatedAt: number;
}

interface CloudSyncRow {
  account_id: string;
  payload: FinanceSnapshot;
  updated_at: string;
}

function getClient(): SupabaseClient | null {
  if (CLOUD_SYNC_DISABLED) {
    return null;
  }

  return getSupabaseAuthClient();
}

export function isCloudSyncConfigured(): boolean {
  if (CLOUD_SYNC_DISABLED) {
    return false;
  }
  return Boolean(getClient());
}

export async function pullCloudSnapshot(accountId: string): Promise<FinanceSnapshot | null> {
  const client = getClient();
  if (!client || !accountId) {
    return null;
  }

  const { data, error } = await client
    .from(SYNC_TABLE)
    .select('payload')
    .eq('account_id', accountId)
    .maybeSingle();

  if (error) {
    throw new Error(`Cloud pull failed: ${error.message}`);
  }

  if (!data || typeof data !== 'object' || !('payload' in data)) {
    return null;
  }

  const payload = (data as { payload?: FinanceSnapshot }).payload;
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const normalized: FinanceSnapshot = {
    wallets: Array.isArray(payload.wallets) ? payload.wallets : [],
    trans: Array.isArray(payload.trans) ? payload.trans : [],
    expenses: Array.isArray(payload.expenses) ? payload.expenses : [],
    prefs: payload.prefs && typeof payload.prefs === 'object' ? payload.prefs : {},
    cats: Array.isArray(payload.cats) ? payload.cats : [],
    updatedAt: typeof payload.updatedAt === 'number' ? payload.updatedAt : 0,
  };

  return normalized;
}

export async function pushCloudSnapshot(accountId: string, snapshot: FinanceSnapshot): Promise<void> {
  const client = getClient();
  if (!client || !accountId) {
    return;
  }

  const row: CloudSyncRow = {
    account_id: accountId,
    payload: snapshot,
    updated_at: new Date(snapshot.updatedAt).toISOString(),
  };

  const { error } = await client
    .from(SYNC_TABLE)
    .upsert(row, { onConflict: 'account_id' });

  if (error) {
    throw new Error(`Cloud push failed: ${error.message}`);
  }
}

export async function deleteCloudSnapshot(accountId: string): Promise<void> {
  const client = getClient();
  if (!client || !accountId) {
    return;
  }

  const { error } = await client
    .from(SYNC_TABLE)
    .delete()
    .eq('account_id', accountId);

  if (error) {
    throw new Error(`Cloud delete failed: ${error.message}`);
  }
}

export function getCloudSyncTableName(): string {
  return SYNC_TABLE;
}
