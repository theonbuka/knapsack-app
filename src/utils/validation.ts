import { z } from 'zod';
import i18n from '../i18n';

const t = (key: string) => i18n.t(key);

/**
 * PIN validation: 4-6 digits only
 */
export const PinSchema = z
  .string()
  .min(4, () => t('validation.pinMin'))
  .max(6, () => t('validation.pinMax'))
  .regex(/^\d+$/, () => t('validation.pinDigitsOnly'));

/**
 * Name validation: 2-50 characters
 */
export const NameSchema = z
  .string()
  .min(2, () => t('validation.nameMin'))
  .max(50, () => t('validation.nameMax'))
  .regex(/^[a-zA-ZçğıöşüÇĞİÖŞÜ\s]+$/, () => t('validation.nameLettersOnly'));

/**
 * Email validation
 */
export const EmailSchema = z
  .string()
  .email(() => t('validation.emailInvalid'))
  .optional();

export const RequiredEmailSchema = z
  .string()
  .trim()
  .min(1, () => t('validation.emailRequired'))
  .email(() => t('validation.emailInvalid'));

/**
 * Surname validation: 2-50 characters
 */
export const SurnameSchema = z
  .string()
  .min(2, () => t('validation.surnameMin'))
  .max(50, () => t('validation.surnameMax'))
  .regex(/^[a-zA-ZçğıöşüÇĞİÖŞÜ\s]+$/, () => t('validation.surnameLettersOnly'));

/**
 * Password validation
 */
export const PasswordSchema = z
  .string()
  .min(6, () => t('validation.passwordMin'))
  .max(64, () => t('validation.passwordMax'));

/**
 * Amount validation: positive number
 */
export const AmountSchema = z
  .string()
  .or(z.number())
  .refine(val => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return !isNaN(num) && num > 0;
  }, () => t('validation.amountInvalid'));

/**
 * Transaction validation schema
 */
export const TransactionSchema = z.object({
  type: z.enum(['expense', 'income']),
  amount: AmountSchema,
  currency: z.string().length(1),
  title: z.string().min(3, () => t('validation.titleMin')),
  categoryId: z.string().min(1, () => t('validation.categoryRequired')),
  note: z.string().optional(),
  walletId: z.string().optional(),
});

/**
 * Wallet validation schema
 */
export const WalletSchema = z.object({
  name: z.string().min(2, () => t('validation.walletNameRequired')),
  balance: z.string().or(z.number()),
  type: z.string(),
  iconType: z.string(),
  isDebt: z.boolean().optional(),
  cardLimit: z.string().or(z.number()).optional(),
  dueDay: z.number().optional(),
  months: z.string().or(z.number()).optional(),
  interestRate: z.string().or(z.number()).optional(),
  paidMonths: z.number().optional(),
});

/**
 * Login validation schema
 */
export const LoginSchema = z.object({
  email: RequiredEmailSchema,
  password: PasswordSchema,
});

/**
 * Registration validation schema
 */
export const RegisterSchema = z.object({
  name: NameSchema,
  surname: SurnameSchema,
  email: RequiredEmailSchema,
  password: PasswordSchema,
});

/**
 * Sanitize string input
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>"']/g, '')
    .substring(0, 500); // Max length safety
}

/**
 * Validate and sanitize form data
 */
export function validateAndSanitize<T>(schema: z.ZodSchema, data: unknown): T {
  const validated = schema.parse(data);

  // Sanitize string fields
  if (typeof validated === 'object' && validated !== null) {
    Object.entries(validated).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('password') || lowerKey.includes('pin')) {
          return;
        }
        (validated as Record<string, unknown>)[key] = sanitizeInput(value);
      }
    });
  }

  return validated as T;
}
