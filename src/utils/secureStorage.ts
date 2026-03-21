import { Encryption } from './encryption';

/**
 * Secure storage wrapper with encryption for sensitive data
 * Data is encrypted before storing in localStorage
 */
export const SecureStorage = {
  /**
   * Set encrypted data in localStorage
   */
  setSecure: (key: string, data: unknown): void => {
    try {
      const encrypted = Encryption.encrypt(data);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`Failed to set secure storage for ${key}:`, error);
      throw new Error('Veri kaydedilemedi');
    }
  },

  /**
   * Get decrypted data from localStorage
   */
  getSecure: <T = unknown>(key: string): T | null => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const decrypted = Encryption.decrypt(encrypted);
      return decrypted as T;
    } catch (error) {
      console.error(`Failed to get secure storage for ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove data from localStorage
   */
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },

  /**
   * Clear all encrypted data
   */
  clear: (): void => {
    const keysToRemove = [
      'knapsack_auth',
      'knapsack_w',
      'knapsack_t',
      'knapsack_exp',
      'knapsack_p',
      'knapsack_cats',
    ];
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  },
};

/**
 * Public storage for non-sensitive data
 */
export const PublicStorage = {
  set: (key: string, data: unknown): void => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to set public storage for ${key}:`, error);
    }
  },

  get: <T = unknown>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : (defaultValue || null);
    } catch (error) {
      console.error(`Failed to get public storage for ${key}:`, error);
      return defaultValue || null;
    }
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};
