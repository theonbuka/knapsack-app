import { ReactNode } from 'react';

// Transaction types
export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: string | number;
  currency: string;
  title: string;
  categoryId: string;
  note?: string;
  walletId?: string;
  created: string;
}

// Wallet/Asset types
export interface Wallet {
  name: string;
  balance: string | number;
  type: string;
  iconType: string;
  isDebt?: boolean;
  cardLimit?: string | number;
  dueDay?: number;
  months?: string | number;
  interestRate?: string | number;
  paidMonths?: number;
  kmhLimit?: string | number;
}

// Category types
export interface Category {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  limit?: number;
}

// Expense types (bills, subscriptions, etc)
export interface ExpenseItem {
  id: string;
  type: 'rent' | 'bill' | 'subscription';
  name: string;
  amount: string | number;
  currency: string;
  dueDay: number;
  serviceKey?: string;
  paidMonths?: string[];
}

export type SubscriptionPlan = 'free' | 'premium';

export type PremiumFeatureAvailability = 'live' | 'planned';

export interface PremiumFeature {
  id: string;
  title: string;
  description: string;
  availability: PremiumFeatureAvailability;
}

export interface PricingPlan {
  id: 'free' | 'premium';
  name: string;
  priceLabel: string;
  description: string;
  badge?: string;
  highlights: string[];
}

// Authentication types
export interface AuthState {
  name: string;
  surname?: string;
  email?: string;
  password?: string;
  pin?: string;
  loggedIn: boolean;
  demoMode?: boolean;
  googleId?: string;
  supabaseUserId?: string;
  picture?: string;
  subscriptionPlan?: SubscriptionPlan;
}

// User preferences
export interface UserPrefs {
  currency?: string;
  themeColor?: string;
  savingsGoal?: number;
}

// Common component props
export interface PageProps {
  transactions?: Transaction[];
  wallets?: Wallet[];
  isDark: boolean;
  color: {
    bg: string;
    hex: string;
  };
  prefs?: UserPrefs;
  liveRates?: {
    USD?: number;
    EUR?: number;
    GOLD?: number;
  };
  cats?: Category[];
  expenses?: ExpenseItem[];
  addTransaction?: (tx: Partial<Transaction>) => void;
  updateTransaction?: (id: string, tx: Partial<Transaction>) => void;
  removeTransaction?: (id: string) => void;
  addExpense?: (exp: Partial<ExpenseItem>) => void;
  updateExpense?: (id: string, exp: Partial<ExpenseItem>) => void;
  removeExpense?: (id: string) => void;
  toggleExpensePaid?: (id: string, month: string) => void;
  saveCats?: (cats: Category[]) => void;
  savePrefs?: (prefs: Partial<UserPrefs>) => void;
  refreshData?: () => void;
  loading?: boolean;
}

export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};
