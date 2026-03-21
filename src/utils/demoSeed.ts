import { customDB } from './constants';
import type { Category, ExpenseItem, Transaction, UserPrefs, Wallet } from '../types';

type WalletRecord = Wallet & { id: string };

function uid(prefix: string, i: number): string {
  return `demo_${prefix}_${i}`;
}

/** Returns an ISO date string N days before today */
function daysAgo(n: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ── Categories ──────────────────────────────────────────────────────────────

const DEMO_CATS: Category[] = [
  { id: 'c1', name: 'Gıda & Market', color: '#fbbf24', emoji: '🛒', limit: 8000 },
  { id: 'c2', name: 'Dışarıda Yemek', color: '#f87171', emoji: '🍽️', limit: 4000 },
  { id: 'c3', name: 'Ulaşım', color: '#60a5fa', emoji: '🚗', limit: 3000 },
  { id: 'c4', name: 'Kira & Faturalar', color: '#818cf8', emoji: '🏠', limit: 20000 },
  { id: 'c5', name: 'Sağlık', color: '#f472b6', emoji: '💊', limit: 2500 },
  { id: 'c7', name: 'İş & Kariyer', color: '#34d399', emoji: '💼', limit: 1000 },
  { id: 'c8', name: 'Teknoloji', color: '#4ade80', emoji: '📱', limit: 10000 },
  { id: 'c9', name: 'Eğlence', color: '#fb923c', emoji: '🎮', limit: 3500 },
];

// ── Wallets ──────────────────────────────────────────────────────────────────

const DEMO_WALLETS: WalletRecord[] = [
  {
    id: 'demo_w_1',
    name: 'Ziraat Kredi Kartı',
    balance: 4250,
    type: 'Kredi Kartı',
    iconType: '₺',
    isDebt: true,
    cardLimit: 30000,
    dueDay: 12,
  },
  {
    id: 'demo_w_2',
    name: 'Garanti BBVA Kredi Kartı',
    balance: 7800,
    type: 'Kredi Kartı',
    iconType: '₺',
    isDebt: true,
    cardLimit: 50000,
    dueDay: 20,
  },
  {
    id: 'demo_w_3',
    name: 'Araç Kredisi',
    balance: 148000,
    type: 'Taksitli Kredi',
    iconType: '₺',
    isDebt: true,
    months: 48,
    interestRate: 3.89,
    paidMonths: 14,
  },
  {
    id: 'demo_w_4',
    name: 'Nakit',
    balance: 2750,
    type: 'Nakit',
    iconType: '₺',
    isDebt: false,
  },
  {
    id: 'demo_w_5',
    name: 'Vadesiz Hesap',
    balance: 18400,
    type: 'Banka',
    iconType: '₺',
    isDebt: false,
  },
];

// ── Fixed Expenses ────────────────────────────────────────────────────────────

function paidMonthsLastN(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

const DEMO_EXPENSES: ExpenseItem[] = [
  {
    id: 'demo_exp_1',
    type: 'rent',
    name: 'Kira',
    amount: 22000,
    currency: '₺',
    dueDay: 1,
    paidMonths: paidMonthsLastN(3),
  },
  {
    id: 'demo_exp_2',
    type: 'bill',
    name: 'Elektrik',
    amount: 1250,
    currency: '₺',
    dueDay: 15,
    paidMonths: paidMonthsLastN(2),
  },
  {
    id: 'demo_exp_3',
    type: 'bill',
    name: 'Doğalgaz',
    amount: 980,
    currency: '₺',
    dueDay: 18,
    paidMonths: paidMonthsLastN(2),
  },
  {
    id: 'demo_exp_4',
    type: 'bill',
    name: 'İnternet',
    amount: 450,
    currency: '₺',
    dueDay: 5,
    paidMonths: paidMonthsLastN(3),
  },
  {
    id: 'demo_exp_5',
    type: 'subscription',
    name: 'Netflix',
    amount: 299,
    currency: '₺',
    dueDay: 8,
    serviceKey: 'netflix',
    paidMonths: paidMonthsLastN(3),
  },
  {
    id: 'demo_exp_6',
    type: 'subscription',
    name: 'Spotify',
    amount: 89,
    currency: '₺',
    dueDay: 22,
    serviceKey: 'spotify',
    paidMonths: paidMonthsLastN(3),
  },
  {
    id: 'demo_exp_7',
    type: 'subscription',
    name: 'YouTube Premium',
    amount: 129,
    currency: '₺',
    dueDay: 14,
    serviceKey: 'youtube',
    paidMonths: paidMonthsLastN(1),
  },
  {
    id: 'demo_exp_8',
    type: 'bill',
    name: 'Telefon Faturası',
    amount: 620,
    currency: '₺',
    dueDay: 10,
    paidMonths: paidMonthsLastN(3),
  },
];

// ── Transactions ──────────────────────────────────────────────────────────────

interface TxDef {
  type: 'expense' | 'income';
  amount: number;
  currency: string;
  title: string;
  categoryId: string;
  note?: string;
  walletId?: string;
  daysBack: number;
}

const RAW_TRANSACTIONS: TxDef[] = [
  // ─ Gelir ─
  { type: 'income', amount: 42000, currency: '₺', title: 'Maaş – Mart', categoryId: 'c7', note: '', daysBack: 5 },
  { type: 'income', amount: 42000, currency: '₺', title: 'Maaş – Şubat', categoryId: 'c7', daysBack: 35 },
  { type: 'income', amount: 42000, currency: '₺', title: 'Maaş – Ocak', categoryId: 'c7', daysBack: 65 },
  { type: 'income', amount: 3500, currency: '₺', title: 'Freelance Proje', categoryId: 'c7', note: 'UI tasarım işi', daysBack: 18 },
  { type: 'income', amount: 1200, currency: '₺', title: 'Pazar yeri satış',categoryId: 'c7', note: 'İkinci el eşya', daysBack: 42 },

  // ─ Gıda & Market ─
  { type: 'expense', amount: 1840, currency: '₺', title: 'Şok Market', categoryId: 'c1', daysBack: 2, walletId: 'demo_w_4' },
  { type: 'expense', amount: 2310, currency: '₺', title: 'Migros', categoryId: 'c1', note: 'Haftalık alışveriş', daysBack: 8, walletId: 'demo_w_1' },
  { type: 'expense', amount: 975, currency: '₺', title: 'BİM', categoryId: 'c1', daysBack: 14, walletId: 'demo_w_4' },
  { type: 'expense', amount: 3120, currency: '₺', title: 'Carrefour', categoryId: 'c1', note: 'Aylık büyük alışveriş', daysBack: 21, walletId: 'demo_w_2' },
  { type: 'expense', amount: 650, currency: '₺', title: 'A101', categoryId: 'c1', daysBack: 28, walletId: 'demo_w_4' },
  { type: 'expense', amount: 1990, currency: '₺', title: 'Migros', categoryId: 'c1', daysBack: 43, walletId: 'demo_w_1' },
  { type: 'expense', amount: 2450, currency: '₺', title: 'Carrefour', categoryId: 'c1', daysBack: 55, walletId: 'demo_w_2' },
  { type: 'expense', amount: 820, currency: '₺', title: 'BİM', categoryId: 'c1', daysBack: 62, walletId: 'demo_w_4' },
  { type: 'expense', amount: 1650, currency: '₺', title: 'Şok Market', categoryId: 'c1', daysBack: 75, walletId: 'demo_w_4' },
  { type: 'expense', amount: 3400, currency: '₺', title: 'Migros', categoryId: 'c1', daysBack: 80, walletId: 'demo_w_1' },

  // ─ Dışarıda Yemek ─
  { type: 'expense', amount: 420, currency: '₺', title: 'Nusret', categoryId: 'c2', note: 'Arkadaş yemeği', daysBack: 3, walletId: 'demo_w_1' },
  { type: 'expense', amount: 185, currency: '₺', title: 'McDonald\'s', categoryId: 'c2', daysBack: 7, walletId: 'demo_w_4' },
  { type: 'expense', amount: 290, currency: '₺', title: 'Yemeksepeti', categoryId: 'c2', note: 'Online sipariş', daysBack: 10, walletId: 'demo_w_2' },
  { type: 'expense', amount: 560, currency: '₺', title: 'Hatay Sofrası', categoryId: 'c2', note: 'Aile yemeği', daysBack: 17, walletId: 'demo_w_1' },
  { type: 'expense', amount: 145, currency: '₺', title: 'Starbucks', categoryId: 'c2', daysBack: 22, walletId: 'demo_w_4' },
  { type: 'expense', amount: 320, currency: '₺', title: 'Getir Yemek', categoryId: 'c2', daysBack: 30, walletId: 'demo_w_2' },
  { type: 'expense', amount: 680, currency: '₺', title: 'Köftecisi', categoryId: 'c2', daysBack: 38, walletId: 'demo_w_1' },
  { type: 'expense', amount: 210, currency: '₺', title: 'Burger King', categoryId: 'c2', daysBack: 45, walletId: 'demo_w_4' },
  { type: 'expense', amount: 375, currency: '₺', title: 'Tatlıcı', categoryId: 'c2', note: 'Doğum günü', daysBack: 52, walletId: 'demo_w_2' },

  // ─ Ulaşım ─
  { type: 'expense', amount: 3200, currency: '₺', title: 'Akaryakıt', categoryId: 'c3', note: 'Shell deposu doldurma', daysBack: 4, walletId: 'demo_w_1' },
  { type: 'expense', amount: 850, currency: '₺', title: 'İstanbulkart yükle', categoryId: 'c3', daysBack: 9, walletId: 'demo_w_4' },
  { type: 'expense', amount: 420, currency: '₺', title: 'Otopark', categoryId: 'c3', note: 'Aylık otopark', daysBack: 12, walletId: 'demo_w_2' },
  { type: 'expense', amount: 3100, currency: '₺', title: 'Akaryakıt', categoryId: 'c3', daysBack: 38, walletId: 'demo_w_1' },
  { type: 'expense', amount: 750, currency: '₺', title: 'İstanbulkart yükle', categoryId: 'c3', daysBack: 60, walletId: 'demo_w_4' },
  { type: 'expense', amount: 1200, currency: '₺', title: 'Bakım & Yağ değişimi', categoryId: 'c3', note: 'Renault yetkili servis', daysBack: 70, walletId: 'demo_w_2' },

  // ─ Sağlık ─
  { type: 'expense', amount: 680, currency: '₺', title: 'Eczane', categoryId: 'c5', note: 'Mevsimsel ilaçlar', daysBack: 6, walletId: 'demo_w_4' },
  { type: 'expense', amount: 450, currency: '₺', title: 'Doktor muayenesi',categoryId: 'c5', daysBack: 25, walletId: 'demo_w_2' },
  { type: 'expense', amount: 1200, currency: '₺', title: 'Kan tahlili & röntgen', categoryId: 'c5', daysBack: 50, walletId: 'demo_w_1' },
  { type: 'expense', amount: 390, currency: '₺', title: 'Eczane', categoryId: 'c5', daysBack: 72, walletId: 'demo_w_4' },

  // ─ Teknoloji ─
  { type: 'expense', amount: 4299, currency: '₺', title: 'Apple Watch SE', categoryId: 'c8', note: 'Apple Store', daysBack: 20, walletId: 'demo_w_2' },
  { type: 'expense', amount: 1850, currency: '₺', title: 'Mekanik Klavye', categoryId: 'c8', note: 'Trendyol', daysBack: 47, walletId: 'demo_w_1' },
  { type: 'expense', amount: 299, currency: '₺', title: 'iCloud 200GB', categoryId: 'c8', note: 'Yıllık plan', daysBack: 58, walletId: 'demo_w_2' },

  // ─ Eğlence ─
  { type: 'expense', amount: 780, currency: '₺', title: 'Sinema + Yemek', categoryId: 'c9', note: 'Hafta sonu çıkışı', daysBack: 11, walletId: 'demo_w_4' },
  { type: 'expense', amount: 1250, currency: '₺', title: 'Konser bileti', categoryId: 'c9', note: 'Semicenk konseri', daysBack: 33, walletId: 'demo_w_1' },
  { type: 'expense', amount: 450, currency: '₺', title: 'Steam oyunları', categoryId: 'c9', note: 'Kış indirimleri', daysBack: 66, walletId: 'demo_w_2' },
  { type: 'expense', amount: 290, currency: '₺', title: 'Kitap', categoryId: 'c9', daysBack: 78, walletId: 'demo_w_4' },

  // ─ Kira & Faturalar ─
  { type: 'expense', amount: 22000, currency: '₺', title: 'Kira – Mart', categoryId: 'c4', daysBack: 20, walletId: 'demo_w_5' },
  { type: 'expense', amount: 22000, currency: '₺', title: 'Kira – Şubat', categoryId: 'c4', daysBack: 50, walletId: 'demo_w_5' },
  { type: 'expense', amount: 22000, currency: '₺', title: 'Kira – Ocak', categoryId: 'c4', daysBack: 80, walletId: 'demo_w_5' },
  { type: 'expense', amount: 1250, currency: '₺', title: 'Elektrik faturası', categoryId: 'c4', daysBack: 15, walletId: 'demo_w_2' },
  { type: 'expense', amount: 980, currency: '₺', title: 'Doğalgaz faturası', categoryId: 'c4', daysBack: 18, walletId: 'demo_w_2' },
  { type: 'expense', amount: 450, currency: '₺', title: 'İnternet faturası', categoryId: 'c4', daysBack: 5, walletId: 'demo_w_1' },
];

const DEMO_PREFS: UserPrefs = {
  currency: '₺',
  themeColor: 'indigo',
  savingsGoal: 5000,
};

// ── Seed function ─────────────────────────────────────────────────────────────

export function seedDemoData(): void {
  const transactions: Transaction[] = RAW_TRANSACTIONS.map((tx, i) => ({
    id: uid('tx', i),
    type: tx.type,
    amount: tx.amount,
    currency: tx.currency,
    title: tx.title,
    categoryId: tx.categoryId,
    note: tx.note ?? '',
    walletId: tx.walletId ?? '',
    created: daysAgo(tx.daysBack, 9 + (i % 12), (i * 7) % 60),
  }));

  customDB.set('knapsack_t', transactions);
  customDB.set('knapsack_w', DEMO_WALLETS);
  customDB.set('knapsack_exp', DEMO_EXPENSES);
  customDB.set('knapsack_cats', DEMO_CATS);
  customDB.set('knapsack_p', DEMO_PREFS);
}

export function clearDemoData(): void {
  customDB.set('knapsack_t', []);
  customDB.set('knapsack_w', []);
  customDB.set('knapsack_exp', []);
  customDB.set('knapsack_cats', []);
  customDB.set('knapsack_p', DEMO_PREFS);
}
