import CryptoJS from 'crypto-js';

const LOCAL_SECRET_KEY_NAME = 'knapsack_local_secret_key';

function generateLocalSecretKey(): string {
  const bytes = new Uint8Array(32);

  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function resolveSecretKey(): string {
  const envKey = import.meta.env.VITE_ENCRYPTION_KEY?.trim();
  if (envKey) {
    return envKey;
  }

  if (typeof window === 'undefined') {
    return 'knapsack_runtime_fallback_key';
  }

  try {
    const existing = window.localStorage.getItem(LOCAL_SECRET_KEY_NAME);
    if (existing && existing.length >= 32) {
      return existing;
    }

    const generated = generateLocalSecretKey();
    window.localStorage.setItem(LOCAL_SECRET_KEY_NAME, generated);
    return generated;
  } catch {
    return generateLocalSecretKey();
  }
}

const SECRET_KEY = resolveSecretKey();

export const Encryption = {
  /**
   * Encrypt sensitive data
   */
  encrypt: (data: unknown): string => {
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Veri şifrelemesi başarısız');
    }
  },

  /**
   * Decrypt sensitive data
   */
  decrypt: (encrypted: string): unknown => {
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        throw new Error('Decryption returned empty string');
      }
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Veri deşifrelemesi başarısız');
    }
  },

  /**
   * Hash a PIN (one-way encryption for verification)
   */
  hashPin: (pin: string): string => {
    return CryptoJS.SHA256(pin).toString();
  },

  /**
   * Verify a PIN against its hash
   */
  verifyPin: (pin: string, hash: string): boolean => {
    return Encryption.hashPin(pin) === hash;
  },
};
