export const FALLBACK_DISPLAY_RATES = {
  USD: 33.2,
  EUR: 35.9,
};

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
  locale = 'tr-TR',
  maximumFractionDigits = 0
): string {
  const symbol = normalizeCurrencySymbol(targetCurrency);
  const displayValue = convertFromTRY(amountTRY, symbol, liveRates);
  return `${symbol}${displayValue.toLocaleString(locale, { maximumFractionDigits })}`;
}
