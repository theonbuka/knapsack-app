import type { Category, ExpenseItem, Transaction } from '../types';
import { convertToTRY, formatFromTRY, normalizeCurrencySymbol } from './currency';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function clampDueDay(year: number, month: number, dueDay: number): number {
  const maxDay = new Date(year, month + 1, 0).getDate();
  const normalizedDueDay = Math.max(1, parseInt(String(dueDay), 10) || 1);
  return Math.min(normalizedDueDay, maxDay);
}

function buildDueDate(year: number, month: number, dueDay: number): Date {
  return new Date(year, month, clampDueDay(year, month, dueDay));
}

function getCurrentMonthDueDate(dueDay: number, referenceDate: Date): Date {
  return buildDueDate(referenceDate.getFullYear(), referenceDate.getMonth(), dueDay);
}

function getNextMonthDueDate(dueDay: number, referenceDate: Date): Date {
  const year = referenceDate.getMonth() === 11 ? referenceDate.getFullYear() + 1 : referenceDate.getFullYear();
  const month = referenceDate.getMonth() === 11 ? 0 : referenceDate.getMonth() + 1;
  return buildDueDate(year, month, dueDay);
}

function getPreviousMonthKeys(referenceDate: Date): { month: number; year: number } {
  if (referenceDate.getMonth() === 0) {
    return {
      month: 11,
      year: referenceDate.getFullYear() - 1,
    };
  }

  return {
    month: referenceDate.getMonth() - 1,
    year: referenceDate.getFullYear(),
  };
}

function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export interface PremiumRenewalItem {
  id: string;
  name: string;
  type: ExpenseItem['type'];
  amountTRY: number;
  currency: string;
  dueDate: Date;
  daysUntilDue: number;
  status: 'overdue' | 'today' | 'upcoming';
}

export interface PremiumSpendingAnomaly {
  id: string;
  kind: 'large-transaction' | 'category-spike';
  severity: 'high' | 'medium';
  title: string;
  description: string;
  amountTRY: number;
}

export interface PremiumMonthlyBrief {
  monthLabel: string;
  headline: string;
  incomeTRY: number;
  expenseTRY: number;
  savingsTRY: number;
  topCategoryName: string | null;
  topCategorySpendTRY: number;
  upcomingRenewals: PremiumRenewalItem[];
  anomalies: PremiumSpendingAnomaly[];
}

export function getUpcomingRenewals(
  expenses: ExpenseItem[] = [],
  liveRates?: { USD?: number; EUR?: number; GOLD?: number },
  referenceDate = new Date(),
  windowDays = 10,
): PremiumRenewalItem[] {
  const today = startOfDay(referenceDate);
  const currentMonthKey = getMonthKey(today);

  return expenses
    .reduce<PremiumRenewalItem[]>((items, expense) => {
      const isPaidThisMonth = (expense.paidMonths || []).includes(currentMonthKey);
      const currentMonthDueDate = getCurrentMonthDueDate(expense.dueDay, today);
      const dueDate = isPaidThisMonth ? getNextMonthDueDate(expense.dueDay, today) : currentMonthDueDate;
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / DAY_MS);

      if (daysUntilDue > windowDays) {
        return items;
      }

      items.push({
        id: expense.id,
        name: expense.name,
        type: expense.type,
        amountTRY: convertToTRY(expense.amount || 0, expense.currency, liveRates),
        currency: normalizeCurrencySymbol(expense.currency),
        dueDate,
        daysUntilDue,
        status: daysUntilDue < 0 ? 'overdue' : daysUntilDue === 0 ? 'today' : 'upcoming',
      });

      return items;
    }, [])
    .sort((left, right) => left.daysUntilDue - right.daysUntilDue || left.amountTRY - right.amountTRY);
}

export function getSpendingAnomalies(
  transactions: Transaction[] = [],
  cats: Category[] = [],
  referenceDate = new Date(),
): PremiumSpendingAnomaly[] {
  const categoryMap = Object.fromEntries(cats.map(cat => [cat.id, cat]));
  const { month: previousMonth, year: previousYear } = getPreviousMonthKeys(referenceDate);

  const currentMonthExpenses = transactions.filter(transaction => {
    const createdAt = new Date(transaction.created);
    return (
      transaction.type === 'expense' &&
      createdAt.getMonth() === referenceDate.getMonth() &&
      createdAt.getFullYear() === referenceDate.getFullYear()
    );
  });

  const previousMonthExpenses = transactions.filter(transaction => {
    const createdAt = new Date(transaction.created);
    return (
      transaction.type === 'expense' &&
      createdAt.getMonth() === previousMonth &&
      createdAt.getFullYear() === previousYear
    );
  });

  const currentTotal = currentMonthExpenses.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const averageTicket = currentMonthExpenses.length > 0 ? currentTotal / currentMonthExpenses.length : 0;

  const categoryTotalsCurrent = currentMonthExpenses.reduce<Record<string, number>>((accumulator, transaction) => {
    const categoryId = transaction.categoryId || 'general';
    accumulator[categoryId] = (accumulator[categoryId] || 0) + Number(transaction.amount || 0);
    return accumulator;
  }, {});

  const categoryTotalsPrevious = previousMonthExpenses.reduce<Record<string, number>>((accumulator, transaction) => {
    const categoryId = transaction.categoryId || 'general';
    accumulator[categoryId] = (accumulator[categoryId] || 0) + Number(transaction.amount || 0);
    return accumulator;
  }, {});

  const anomalies: PremiumSpendingAnomaly[] = [];

  currentMonthExpenses
    .filter(transaction => {
      const amount = Number(transaction.amount || 0);
      const otherExpenseCount = currentMonthExpenses.length - 1;
      const otherAverage = otherExpenseCount > 0 ? (currentTotal - amount) / otherExpenseCount : averageTicket;
      const threshold = Math.max(otherAverage * 1.35, 1200);

      return amount >= threshold && amount - otherAverage >= 600;
    })
    .sort((left, right) => Number(right.amount || 0) - Number(left.amount || 0))
    .slice(0, 2)
    .forEach(transaction => {
      const amount = Number(transaction.amount || 0);
      const otherExpenseCount = currentMonthExpenses.length - 1;
      const otherAverage = otherExpenseCount > 0 ? (currentTotal - amount) / otherExpenseCount : averageTicket;

      anomalies.push({
        id: `large-${transaction.id}`,
        kind: 'large-transaction',
        severity: amount >= Math.max(otherAverage * 1.75, 2500) ? 'high' : 'medium',
        title: 'Yüksek tutarlı işlem',
        description: `${transaction.title || 'İsimsiz işlem'} bu ayki tipik işlem tutarının belirgin biçimde üzerinde.`,
        amountTRY: amount,
      });
    });

  Object.entries(categoryTotalsCurrent).forEach(([categoryId, currentSpent]) => {
    const previousSpent = categoryTotalsPrevious[categoryId] || 0;
    const categoryName = categoryMap[categoryId]?.name || 'Genel';

    if (previousSpent > 0 && currentSpent > previousSpent * 1.35 && currentSpent - previousSpent >= 750) {
      anomalies.push({
        id: `category-${categoryId}`,
        kind: 'category-spike',
        severity: currentSpent > previousSpent * 1.7 ? 'high' : 'medium',
        title: `${categoryName} kategorisi hızlandı`,
        description: `Geçen aya göre ${Math.round(((currentSpent - previousSpent) / previousSpent) * 100)}% daha yüksek harcama var.`,
        amountTRY: currentSpent - previousSpent,
      });
      return;
    }

    if (previousSpent === 0 && currentSpent >= Math.max(currentTotal * 0.3, 1500)) {
      anomalies.push({
        id: `category-new-${categoryId}`,
        kind: 'category-spike',
        severity: 'medium',
        title: `${categoryName} yeni baskın kategori`,
        description: 'Bu ay toplam gider içinde öne çıkan yeni bir yoğunluk oluştu.',
        amountTRY: currentSpent,
      });
    }
  });

  return anomalies
    .sort((left, right) => {
      const severityScore = left.severity === right.severity ? 0 : left.severity === 'high' ? -1 : 1;
      return severityScore || right.amountTRY - left.amountTRY;
    })
    .slice(0, 3);
}

export function buildPremiumMonthlyBrief({
  transactions = [],
  cats = [],
  expenses = [],
  liveRates,
  referenceDate = new Date(),
  windowDays = 10,
}: {
  transactions?: Transaction[];
  cats?: Category[];
  expenses?: ExpenseItem[];
  liveRates?: { USD?: number; EUR?: number; GOLD?: number };
  referenceDate?: Date;
  windowDays?: number;
}): PremiumMonthlyBrief {
  const currentMonthTransactions = transactions.filter(transaction => {
    const createdAt = new Date(transaction.created);
    return createdAt.getMonth() === referenceDate.getMonth() && createdAt.getFullYear() === referenceDate.getFullYear();
  });

  const incomeTRY = currentMonthTransactions
    .filter(transaction => transaction.type === 'income')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const expenseTRY = currentMonthTransactions
    .filter(transaction => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
  const savingsTRY = incomeTRY - expenseTRY;

  const topCategory = cats
    .map(category => ({
      ...category,
      spent: currentMonthTransactions
        .filter(transaction => transaction.type === 'expense' && transaction.categoryId === category.id)
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    }))
    .sort((left, right) => right.spent - left.spent)[0];

  const upcomingRenewals = getUpcomingRenewals(expenses, liveRates, referenceDate, windowDays);
  const anomalies = getSpendingAnomalies(transactions, cats, referenceDate);

  let headline = 'Ay kontrollü ilerliyor.';
  if (savingsTRY < 0) {
    headline = 'Gelir tamponu baskı altında, gider temposu yakından izlenmeli.';
  } else if (upcomingRenewals.some(item => item.status === 'overdue')) {
    headline = 'Geciken ödeme var; nakit akışı ve yenilemeler birlikte ele alınmalı.';
  } else if (anomalies.length > 0) {
    headline = 'Harcama davranışında sıra dışı bir hareket var, kategori dağılımı incelenmeli.';
  }

  return {
    monthLabel: referenceDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
    headline,
    incomeTRY,
    expenseTRY,
    savingsTRY,
    topCategoryName: topCategory?.name || null,
    topCategorySpendTRY: topCategory?.spent || 0,
    upcomingRenewals,
    anomalies,
  };
}

export function buildPremiumReportText({
  transactions = [],
  cats = [],
  expenses = [],
  displayCurrency = '₺',
  liveRates,
  referenceDate = new Date(),
}: {
  transactions?: Transaction[];
  cats?: Category[];
  expenses?: ExpenseItem[];
  displayCurrency?: string;
  liveRates?: { USD?: number; EUR?: number; GOLD?: number };
  referenceDate?: Date;
}): string {
  const brief = buildPremiumMonthlyBrief({ transactions, cats, expenses, liveRates, referenceDate });
  const formatCurrency = (value: number) => formatFromTRY(value, displayCurrency, liveRates, 'tr-TR', 0);

  const lines = [
    'Knapsack Premium Brief',
    `${brief.monthLabel} Özeti`,
    '',
    brief.headline,
    '',
    'Özet',
    `- Toplam gelir: ${formatCurrency(brief.incomeTRY)}`,
    `- Toplam gider: ${formatCurrency(brief.expenseTRY)}`,
    `- Net sonuç: ${brief.savingsTRY >= 0 ? '+' : '-'}${formatCurrency(Math.abs(brief.savingsTRY))}`,
    brief.topCategoryName
      ? `- En yoğun kategori: ${brief.topCategoryName} (${formatCurrency(brief.topCategorySpendTRY)})`
      : '- En yoğun kategori: Bu ay veri oluşmadı.',
  ];

  lines.push('', 'Renewal Radar');
  if (brief.upcomingRenewals.length === 0) {
    lines.push('- Önümüzdeki 10 günde kritik yenileme görünmüyor.');
  } else {
    brief.upcomingRenewals.forEach(item => {
      const dueLabel = item.status === 'overdue'
        ? `${Math.abs(item.daysUntilDue)} gün gecikti`
        : item.status === 'today'
          ? 'bugün'
          : `${item.daysUntilDue} gün içinde`;
      lines.push(`- ${item.name}: ${formatCurrency(item.amountTRY)} · ${formatDayLabel(item.dueDate)} · ${dueLabel}`);
    });
  }

  lines.push('', 'Anomali İzleme');
  if (brief.anomalies.length === 0) {
    lines.push('- Bu ay dikkat çeken bir harcama sıçraması tespit edilmedi.');
  } else {
    brief.anomalies.forEach(item => {
      lines.push(`- ${item.title}: ${item.description} (${formatCurrency(item.amountTRY)})`);
    });
  }

  lines.push('', `Rapor tarihi: ${new Date().toLocaleString('tr-TR')}`);

  return lines.join('\n');
}