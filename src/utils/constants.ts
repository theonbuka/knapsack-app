import { SecureStorage } from './secureStorage';
import {
  getActiveUserStorageId,
  getScopedDataKey,
  isAccountScopedDataKey,
} from './accountStorage';

export const themeColors = {
  indigo:  { bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-500/20', hex: '#6366f1' },
  rose:    { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500/20', hex: '#f43f5e' },
  amber:   { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500/20', hex: '#f59e0b' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500/20', hex: '#10b981' },
  sky:     { bg: 'bg-sky-500', text: 'text-sky-500', border: 'border-sky-500/20', hex: '#0ea5e9' },
};

export const DEFAULT_CATS = [
  { id: 'c1', name: 'Gıda & Market', color: '#fbbf24', emoji: '🛒', limit: 8000 },
  { id: 'c2', name: 'Dışarıda Yemek', color: '#f87171', emoji: '🍽️', limit: 4000 },
  { id: 'c3', name: 'Ulaşım', color: '#60a5fa', emoji: '🚗', limit: 3000 },
  { id: 'c4', name: 'Kira & Faturalar', color: '#818cf8', emoji: '🏠', limit: 20000 },
  { id: 'c5', name: 'Sağlık', color: '#f472b6', emoji: '💊', limit: 2500 },
  { id: 'c7', name: 'İş & Kariyer', color: '#34d399', emoji: '💼', limit: 1000 },
  { id: 'c8', name: 'Teknoloji', color: '#4ade80', emoji: '📱', limit: 10000 },
  { id: 'c9', name: 'Eğlence', color: '#fb923c', emoji: '🎮', limit: 3500 },
];

export const initialCats = DEFAULT_CATS;

export const categoryMap = Object.fromEntries(DEFAULT_CATS.map(c => [c.id, c]));

export const EXPENSE_TYPES = [
  { id: 'bill', label: 'Fatura', color: '#818cf8' },
  { id: 'subscription', label: 'Abonelik', color: '#60a5fa' },
  { id: 'rent', label: 'Sabit Giderler', color: '#f87171' },
];

export const UNIT_LABELS = { '₺': '₺', 'USD': '$', 'EUR': '€', 'GOLD': 'gr' };

export const PRESET_EMOJIS = [
  '🛒','🍽️','🚗','🏠','💊','💼','📱','🎮','✈️','👗','🎓','🏋️',
  '🎵','📚','🐾','🌱','🍕','☕','🏖️','🎁','💇','🛋️','🧴','🔧',
  '💡','🎬','🏦','🚌','🎯','🌍',
];

export const PRESET_COLORS = [
  '#fbbf24','#f87171','#60a5fa','#818cf8','#f472b6','#34d399',
  '#4ade80','#fb923c','#a78bfa','#38bdf8','#f43f5e','#10b981',
  '#6366f1','#ec4899','#14b8a6','#f97316',
];

// Simple fallback DB for now
export const customDB = {
  get: (k, def) => {
    try {
      const activeUserId = getActiveUserStorageId();
      const accountScoped = isAccountScopedDataKey(k);
      const resolvedKey = accountScoped ? getScopedDataKey(k, activeUserId) : k;

      let raw = localStorage.getItem(resolvedKey);

      // Backward compatibility: migrate old global keys into active account scope.
      if (!raw && accountScoped) {
        const legacyRaw = localStorage.getItem(k);
        if (legacyRaw && activeUserId) {
          localStorage.setItem(resolvedKey, legacyRaw);
          localStorage.removeItem(k);
          raw = legacyRaw;
        }
      }

      if (!raw) return def;

      // Legacy migration: old records were plain JSON; re-save them encrypted.
      try {
        const parsed = JSON.parse(raw);
        try {
          SecureStorage.setSecure(resolvedKey, parsed);
        } catch {
          // Keep working with parsed data even if migration write fails.
        }
        return parsed;
      } catch {
        const decrypted = SecureStorage.getSecure(resolvedKey);
        return decrypted ?? def;
      }
    } catch (err) {
      console.error('customDB.get error:', err);
      return def;
    }
  },
  set: (k, val) => {
    try {
      const activeUserId = getActiveUserStorageId();
      const accountScoped = isAccountScopedDataKey(k);
      const resolvedKey = accountScoped ? getScopedDataKey(k, activeUserId) : k;

      SecureStorage.setSecure(resolvedKey, val);

      if (accountScoped) {
        localStorage.removeItem(k);
      }
    } catch (err) {
      console.error('customDB.set error:', err);
      // Last-resort fallback keeps app usable if encryption write fails.
      try {
        const activeUserId = getActiveUserStorageId();
        const accountScoped = isAccountScopedDataKey(k);
        const resolvedKey = accountScoped ? getScopedDataKey(k, activeUserId) : k;
        localStorage.setItem(resolvedKey, JSON.stringify(val));
      } catch (fallbackErr) {
        console.error('customDB.set fallback error:', fallbackErr);
      }
    }
  },
};
