import { z } from 'zod';

/**
 * PIN validation: 4-6 digits only
 */
export const PinSchema = z
  .string()
  .min(4, 'PIN en az 4 haneli olmalıdır')
  .max(6, 'PIN en fazla 6 haneli olmalıdır')
  .regex(/^\d+$/, 'PIN sadece rakamlardan oluşmalıdır');

/**
 * Name validation: 2-50 characters
 */
export const NameSchema = z
  .string()
  .min(2, 'İsim en az 2 karakter olmalıdır')
  .max(50, 'İsim en fazla 50 karakter olmalıdır')
  .regex(/^[a-zA-ZçğıöşüÇĞİÖŞÜ\s]+$/, 'İsim sadece harflerden oluşmalıdır');

/**
 * Email validation
 */
export const EmailSchema = z
  .string()
  .email('Geçerli bir email giriniz')
  .optional();

export const RequiredEmailSchema = z
  .string()
  .trim()
  .min(1, 'Email gerekli')
  .email('Geçerli bir email giriniz');

/**
 * Surname validation: 2-50 characters
 */
export const SurnameSchema = z
  .string()
  .min(2, 'Soyisim en az 2 karakter olmalıdır')
  .max(50, 'Soyisim en fazla 50 karakter olmalıdır')
  .regex(/^[a-zA-ZçğıöşüÇĞİÖŞÜ\s]+$/, 'Soyisim sadece harflerden oluşmalıdır');

/**
 * Password validation
 */
export const PasswordSchema = z
  .string()
  .min(6, 'Şifre en az 6 karakter olmalıdır')
  .max(64, 'Şifre en fazla 64 karakter olmalıdır');

/**
 * Amount validation: positive number
 */
export const AmountSchema = z
  .string()
  .or(z.number())
  .refine(val => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return !isNaN(num) && num > 0;
  }, 'Geçerli bir miktar giriniz');

/**
 * Transaction validation schema
 */
export const TransactionSchema = z.object({
  type: z.enum(['expense', 'income']),
  amount: AmountSchema,
  currency: z.string().length(1),
  title: z.string().min(3, 'Başlık en az 3 karakter olmalıdır'),
  categoryId: z.string().min(1, 'Kategori seçimi gerekli'),
  note: z.string().optional(),
  walletId: z.string().optional(),
});

/**
 * Wallet validation schema
 */
export const WalletSchema = z.object({
  name: z.string().min(2, 'Cüzdan adı gerekli'),
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
