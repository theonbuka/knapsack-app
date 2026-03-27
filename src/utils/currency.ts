export const FALLBACK_DISPLAY_RATES = {
  USD: 33.2,
  EUR: 35.9,
};

const RATES_CACHE_KEY = 'payonar_live_rates_cache';
const RATES_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface RatesCache {
  rates: { USD: number; EUR: number };
  fetchedAt: number;
}

function readRatesCache(): RatesCache | null {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed: RatesCache = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > RATES_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeRatesCache(rates: { USD: number; EUR: number }): void {
  try {
    const cache: RatesCache = { rates, fetchedAt: Date.now() };
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage errors
  }
}

/**
 * Fetch live USD/EUR rates against TRY from Frankfurter.app (free, no auth).
 * Falls back to cached or hardcoded rates on failure.
 */
export async function fetchLiveRates(): Promise<{ USD: number; EUR: number }> {
  const cached = readRatesCache();
  if (cached) return cached.rates;

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=TRY&to=USD,EUR', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Frankfurter returns rates as: 1 TRY = X USD/EUR
    // We need: 1 USD/EUR = X TRY  → invert
    const usdRate = data.rates?.USD ? 1 / data.rates.USD : FALLBACK_DISPLAY_RATES.USD;
    const eurRate = data.rates?.EUR ? 1 / data.rates.EUR : FALLBACK_DISPLAY_RATES.EUR;
    const rates = { USD: usdRate, EUR: eurRate };
    writeRatesCache(rates);
    return rates;
  } catch {
    return FALLBACK_DISPLAY_RATES;
  }
}

function parseAmount(value: string | number | undefined | null): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRate(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && value > 0 ? value : fallback;
}

export function normalizeCurrencySymbol(currency?: string): '₺' | '$' | '€' {
  if (currency === '$' || currency === 'USD') return '$';
  if (currency === '€' || currency === 'EUR') return '€';
  return '₺';
}

export function normalizeInputCurrency(currency?: string): '₺' | 'USD' | 'EUR' {
  if (currency === '$' || currency === 'USD') return 'USD';
  if (currency === '€' || currency === 'EUR') return 'EUR';
  return '₺';
}

export function getPreferredInputCurrency(
  currency?: string,
  supportedCurrencies: string[] = ['₺', 'USD', 'EUR']
): string {
  const preferredCurrency = normalizeInputCurrency(currency);

  if (supportedCurrencies.includes(preferredCurrency)) {
    return preferredCurrency;
  }

  return supportedCurrencies[0] || '₺';
}

export function convertFromTRY(
  amountTRY: string | number,
  targetCurrency: string | undefined,
  liveRates?: { USD?: number; EUR?: number; GOLD?: number }
): number {
  const amount = parseAmount(amountTRY);
  const symbol = normalizeCurrencySymbol(targetCurrency);

  if (symbol === '$') {
    return amount / normalizeRate(liveRates?.USD, FALLBACK_DISPLAY_RATES.USD);
  }

  if (symbol === '€') {
    return amount / normalizeRate(liveRates?.EUR, FALLBACK_DISPLAY_RATES.EUR);
  }

  return amount;
}

export function convertToTRY(
  amount: string | number,
  sourceCurrency: string | undefined,
  liveRates?: { USD?: number; EUR?: number; GOLD?: number }
): number {
  const parsed = parseAmount(amount);
  const symbol = normalizeCurrencySymbol(sourceCurrency);

  if (symbol === '$') {
    return parsed * normalizeRate(liveRates?.USD, FALLBACK_DISPLAY_RATES.USD);
  }

  if (symbol === '€') {
    return parsed * normalizeRate(liveRates?.EUR, FALLBACK_DISPLAY_RATES.EUR);
  }

  return parsed;
}

export function formatFromTRY(
  amountTRY: string | number,
  targetCurrency: string | undefined,
  liveRates?: { USD?: number; EUR?: number; GOLD?: number },
  locale?: string,
  maximumFractionDigits = 0
): string {
  const symbol = normalizeCurrencySymbol(targetCurrency);
  const displayValue = convertFromTRY(amountTRY, symbol, liveRates);
  const resolvedLocale = locale ?? (typeof navigator !== 'undefined' ? navigator.language : 'en');
  return `${symbol}${displayValue.toLocaleString(resolvedLocale, { maximumFractionDigits })}`;
}
