import { describe, it, expect } from 'vitest';
import { sanitizeInput, validateAndSanitize, LoginSchema } from '../utils/validation';
import {
  convertFromTRY,
  convertToTRY,
  normalizeCurrencySymbol,
  formatFromTRY,
} from '../utils/currency';

describe('validation utilities', () => {
  it('sanitizes unsafe characters while preserving content', () => {
    const input = "  <script>alert('x')</script>  ";
    const output = sanitizeInput(input);

    expect(output).not.toContain('<');
    expect(output).not.toContain('>');
    expect(output).not.toContain("'");
    expect(output).toContain('scriptalert(x)/script');
  });

  it('validates login payload and keeps password untouched', () => {
    const parsed = validateAndSanitize<{ email: string; password: string }>(LoginSchema, {
      email: '  User@Test.com  ',
      password: 'secret123',
    });

    expect(parsed.email).toBe('User@Test.com');
    expect(parsed.password).toBe('secret123');
  });
});

describe('currency utilities', () => {
  it('normalizes supported and unsupported symbols', () => {
    expect(normalizeCurrencySymbol('USD')).toBe('$');
    expect(normalizeCurrencySymbol('EUR')).toBe('€');
    expect(normalizeCurrencySymbol('£')).toBe('₺');
  });

  it('converts between TRY and USD/EUR with provided rates', () => {
    expect(convertToTRY(10, 'USD', { USD: 40 })).toBe(400);
    expect(convertToTRY(10, 'EUR', { EUR: 50 })).toBe(500);

    expect(convertFromTRY(400, '$', { USD: 40 })).toBe(10);
    expect(convertFromTRY(500, '€', { EUR: 50 })).toBe(10);
  });

  it('formats TRY amounts into selected display currency', () => {
    const formatted = formatFromTRY(332, '$', { USD: 33.2 }, 'tr-TR', 1);
    expect(formatted).toBe('$10');
  });
});
