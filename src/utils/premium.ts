import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AuthState, PremiumFeature, PricingPlan, SubscriptionPlan } from '../types';

function parseList(raw?: string): string[] {
  return Array.from(
    new Set(
      (raw || '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean),
    ),
  );
}

const ENV_PREMIUM_EMAILS = parseList(import.meta.env.VITE_PREMIUM_EMAILS).map(value => value.toLowerCase());
const ENV_PREMIUM_GOOGLE_IDS = parseList(import.meta.env.VITE_PREMIUM_GOOGLE_IDS);
const PREMIUM_OVERRIDE_ENABLED = import.meta.env.VITE_ENABLE_PREMIUM_OVERRIDE === 'true';
const SUPABASE_PREMIUM_TABLE = import.meta.env.VITE_SUPABASE_PREMIUM_TABLE?.trim() || 'knapsack_user_subscriptions';
const TEST_ACCOUNT_PLAN_OVERRIDES: Record<string, SubscriptionPlan> = {
  'onurkantakil@gmail.com': 'premium',
  'onbukasubs@gmail.com': 'free',
};

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'executive-brief',
    title: 'Executive Brief',
    description: 'Ay sonu risklerini, odak kategorileri ve harcama ivmesini tek kartta toplar.',
    availability: 'live',
  },
  {
    id: 'forecast-desk',
    title: 'Forecast Desk',
    description: 'Günlük harcama hızı ve ay sonu projeksiyonlarını premium analiz katmanında sunar.',
    availability: 'live',
  },
  {
    id: 'json-export',
    title: 'Gelişmiş Veri Dışa Aktarımı',
    description: 'Tüm hesap verisini tek dosyada alır; CSV ve PDF paketlerine genişlemeye hazırdır.',
    availability: 'live',
  },
  {
    id: 'renewal-alerts',
    title: 'Abonelik Yenileme Uyarıları',
    description: 'Yaklaşan yenilemeleri önceden bildirir ve ödeme günü sürprizlerini azaltır.',
    availability: 'live',
  },
  {
    id: 'anomaly-watch',
    title: 'Anomali Tespiti',
    description: 'Normal harcama bandının dışına çıkan kategori ve işlem davranışlarını işaretler.',
    availability: 'live',
  },
  {
    id: 'premium-reports',
    title: 'Paylaşılabilir Aylık Rapor',
    description: 'Danışman veya ekip ile paylaşmak için markalı aylık özet raporlar üretir.',
    availability: 'live',
  },
];

export const PREMIUM_LIVE_FEATURES = PREMIUM_FEATURES.filter(feature => feature.availability === 'live');
export const PREMIUM_COMING_SOON_FEATURES = PREMIUM_FEATURES.filter(feature => feature.availability === 'planned');

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Ücretsiz',
    priceLabel: '0 TL',
    description: 'Temel takip, local-first kullanım ve günlük finans akışı.',
    highlights: [
      'Sınırsız manuel işlem kaydı',
      'Temel net değer ve kategori özeti',
      'Local-first kullanım',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceLabel: 'Ödeme sonrası aktif',
    description: 'Karar destek katmanı, premium dışa aktarım ve daha derin finans görünürlüğü.',
    badge: 'Satışa hazır',
    highlights: [
      'Executive Brief ve Forecast Desk',
      'Yenileme radar ve anomali tespiti',
      'Paylaşılabilir aylık brief ve gelişmiş dışa aktarma',
    ],
  },
];

function normalizeSubscriptionPlan(value: unknown): SubscriptionPlan | null {
  return value === 'premium' || value === 'free' ? value : null;
}

export function getSubscriptionPlanFromSupabaseUser(user: Pick<User, 'app_metadata' | 'user_metadata'> | null | undefined): SubscriptionPlan | null {
  const appPlan = normalizeSubscriptionPlan(user?.app_metadata?.subscription_plan);
  if (appPlan) {
    return appPlan;
  }

  const userPlan = normalizeSubscriptionPlan(user?.user_metadata?.subscription_plan);
  if (userPlan) {
    return userPlan;
  }

  return null;
}

function isMissingSubscriptionTableError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('does not exist') || normalized.includes('relation') || normalized.includes('schema cache');
}

export async function getSubscriptionPlanFromSupabase(
  client: SupabaseClient | null,
  accountId: string | undefined,
  fallbackPlan: SubscriptionPlan = 'free',
): Promise<SubscriptionPlan> {
  if (!client || !accountId) {
    return fallbackPlan;
  }

  const { data, error } = await client
    .from(SUPABASE_PREMIUM_TABLE)
    .select('subscription_plan')
    .eq('account_id', accountId)
    .maybeSingle();

  if (error) {
    if (!isMissingSubscriptionTableError(error.message)) {
      console.error('Failed to read premium subscription state:', error);
    }
    return fallbackPlan;
  }

  return normalizeSubscriptionPlan(data?.subscription_plan) || fallbackPlan;
}

export function parsePremiumList(raw?: string): string[] {
  return parseList(raw);
}

export function isPremiumOverrideEnabled(): boolean {
  return PREMIUM_OVERRIDE_ENABLED;
}

export function getPremiumUpgradeUrl(): string {
  return import.meta.env.VITE_PREMIUM_UPGRADE_URL?.trim() || '';
}

export function resolveSubscriptionPlan(
  auth: Pick<AuthState, 'email' | 'googleId' | 'subscriptionPlan'> | null | undefined,
  options: {
    allowOverrides?: boolean;
    premiumEmails?: string[];
    premiumGoogleIds?: string[];
  } = {},
): SubscriptionPlan {
  const normalizedEmail = auth?.email?.trim().toLowerCase();
  if (normalizedEmail && TEST_ACCOUNT_PLAN_OVERRIDES[normalizedEmail]) {
    return TEST_ACCOUNT_PLAN_OVERRIDES[normalizedEmail];
  }

  if (auth?.subscriptionPlan === 'premium') {
    return 'premium';
  }

  const allowOverrides = options.allowOverrides ?? PREMIUM_OVERRIDE_ENABLED;
  if (!allowOverrides) {
    return 'free';
  }

  const premiumEmails = (options.premiumEmails || ENV_PREMIUM_EMAILS).map(value => value.toLowerCase());
  const premiumGoogleIds = options.premiumGoogleIds || ENV_PREMIUM_GOOGLE_IDS;
  const normalizedGoogleId = auth?.googleId?.trim();

  if (normalizedEmail && premiumEmails.includes(normalizedEmail)) {
    return 'premium';
  }

  if (normalizedGoogleId && premiumGoogleIds.includes(normalizedGoogleId)) {
    return 'premium';
  }

  return 'free';
}

export function getSupabasePremiumTableName(): string {
  return SUPABASE_PREMIUM_TABLE;
}

export function isPremiumPlan(plan: SubscriptionPlan): boolean {
  return plan === 'premium';
}