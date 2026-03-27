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

  // SSR / non-browser context: ephemeral key, not persisted anywhere.
  if (typeof window === 'undefined') {
    return generateLocalSecretKey();
  }

  try {
    // Prefer sessionStorage: cleared when the browser session ends and
    // is not persisted to disk the same way localStorage is.
    const sessionKey = window.sessionStorage.getItem(LOCAL_SECRET_KEY_NAME);
    if (sessionKey && sessionKey.length >= 32) {
      return sessionKey;
    }

    // One-time migration: carry an existing localStorage key into
    // sessionStorage, then remove it from localStorage.
    const localKey = window.localStorage.getItem(LOCAL_SECRET_KEY_NAME);
    if (localKey && localKey.length >= 32) {
      window.sessionStorage.setItem(LOCAL_SECRET_KEY_NAME, localKey);
      window.localStorage.removeItem(LOCAL_SECRET_KEY_NAME);
      return localKey;
    }

    // No prior key found — generate a fresh one for this session.
    const generated = generateLocalSecretKey();
    window.sessionStorage.setItem(LOCAL_SECRET_KEY_NAME, generated);
    return generated;
  } catch {
    // Storage unavailable (e.g. private mode with strict settings):
    // return an in-memory ephemeral key — data won't survive a reload
    // but at least the current session works.
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
