import { describe, expect, it } from 'vitest';
import { buildPremiumMonthlyBrief, buildPremiumReportText, getSpendingAnomalies, getUpcomingRenewals } from '../utils/premiumInsights';

describe('premium insights', () => {
  it('collects overdue and upcoming renewals inside the alert window', () => {
    const renewals = getUpcomingRenewals(
      [
        { id: 'e1', type: 'subscription', name: 'Netflix', amount: 250, currency: '₺', dueDay: 8, paidMonths: [] },
        { id: 'e2', type: 'bill', name: 'Elektrik', amount: 50, currency: 'USD', dueDay: 5, paidMonths: [] },
        { id: 'e3', type: 'rent', name: 'Kira', amount: 12000, currency: '₺', dueDay: 28, paidMonths: ['2026-03'] },
      ],
      { USD: 40 },
      new Date(2026, 2, 7, 12, 0, 0),
      10,
    );

    expect(renewals).toHaveLength(2);
    expect(renewals[0].name).toBe('Elektrik');
    expect(renewals[0].status).toBe('overdue');
    expect(renewals[0].amountTRY).toBe(2000);
    expect(renewals[1].status).toBe('upcoming');
  });

  it('detects category spikes and unusually large current month expenses', () => {
    const anomalies = getSpendingAnomalies(
      [
        { id: 'p1', created: new Date(2026, 1, 10, 12, 0, 0).toISOString(), type: 'expense', amount: 1000, currency: '₺', title: 'Market Şubat', categoryId: 'c1' },
        { id: 'p2', created: new Date(2026, 2, 3, 12, 0, 0).toISOString(), type: 'expense', amount: 2600, currency: '₺', title: 'Büyük market', categoryId: 'c1' },
        { id: 'p3', created: new Date(2026, 2, 5, 12, 0, 0).toISOString(), type: 'expense', amount: 1800, currency: '₺', title: 'Tek seferlik ödeme', categoryId: 'c2' },
      ],
      [
        { id: 'c1', name: 'Market' },
        { id: 'c2', name: 'Faturalar' },
      ],
      new Date(2026, 2, 20, 12, 0, 0),
    );

    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies.some(item => item.kind === 'category-spike')).toBe(true);
    expect(anomalies.some(item => item.kind === 'large-transaction')).toBe(true);
  });

  it('builds a premium report text with summary, renewals and anomalies', () => {
    const report = buildPremiumReportText({
      transactions: [
        { id: 'i1', created: new Date(2026, 2, 2, 12, 0, 0).toISOString(), type: 'income', amount: 5000, currency: '₺', title: 'Maaş', categoryId: 'c0' },
        { id: 'e1', created: new Date(2026, 2, 5, 12, 0, 0).toISOString(), type: 'expense', amount: 2500, currency: '₺', title: 'Market', categoryId: 'c1' },
      ],
      cats: [{ id: 'c1', name: 'Market' }],
      expenses: [{ id: 'r1', type: 'subscription', name: 'Netflix', amount: 250, currency: '₺', dueDay: 8, paidMonths: [] }],
      displayCurrency: '₺',
      referenceDate: new Date(2026, 2, 7, 12, 0, 0),
    });

    expect(report).toContain('Knapsack Premium Brief');
    expect(report).toContain('Renewal Radar');
    expect(report).toContain('Anomali İzleme');
  });

  it('builds a monthly brief summary with headline and top category', () => {
    const brief = buildPremiumMonthlyBrief({
      transactions: [
        { id: 'i1', created: new Date(2026, 2, 1, 12, 0, 0).toISOString(), type: 'income', amount: 7000, currency: '₺', title: 'Maaş', categoryId: 'c0' },
        { id: 'e1', created: new Date(2026, 2, 2, 12, 0, 0).toISOString(), type: 'expense', amount: 3000, currency: '₺', title: 'Market', categoryId: 'c1' },
      ],
      cats: [{ id: 'c1', name: 'Market' }],
      expenses: [],
      referenceDate: new Date(2026, 2, 7, 12, 0, 0),
    });

    expect(brief.topCategoryName).toBe('Market');
    expect(brief.expenseTRY).toBe(3000);
    expect(brief.headline.length).toBeGreaterThan(0);
  });
});