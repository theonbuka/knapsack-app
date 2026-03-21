import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Calendar from '../pages/Calendar';
import Expenses from '../pages/Expenses';
import Analytics from '../pages/Analytics';
import Assets from '../pages/Assets';

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

const useAuthMock = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

const color = { bg: 'bg-indigo-500', hex: '#6366f1' };
const liveRates = { USD: 40, EUR: 44, GOLD: 3200 };

function makeIso(dayOffset = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date.toISOString();
}

describe('page behaviors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ isPremium: false });
  });

  it('renders calendar day totals in the selected display currency', () => {
    render(
      <Calendar
        transactions={[
          {
            id: 'tx-1',
            created: makeIso(),
            type: 'expense',
            amount: '1000',
            title: 'Elektrik',
            categoryId: 'c1',
          },
        ]}
        isDark={false}
        color={color}
        prefs={{ currency: '$' }}
        liveRates={liveRates}
        cats={[{ id: 'c1', name: 'Faturalar' }]}
      />,
    );

    expect(screen.getByTitle('-$25')).toBeInTheDocument();
  });

  it('opens the expense modal from the FAB trigger using the active tab type', async () => {
    const user = userEvent.setup();
    const props = {
      expenses: [],
      isDark: false,
      color,
      prefs: { currency: '₺' },
      liveRates,
      addExpense: vi.fn(),
      removeExpense: vi.fn(),
      toggleExpensePaid: vi.fn(),
      updateExpense: vi.fn(),
    };

    const { rerender } = render(<Expenses {...props} fabTrigger={0} />);

    await user.click(screen.getByRole('button', { name: 'Faturalar' }));

    rerender(<Expenses {...props} fabTrigger={1} />);

    expect(await screen.findByText('Yeni Sabit Gider')).toBeInTheDocument();
    expect(screen.getByText('Hazır Fatura Türleri')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Elektrik/ })).toBeInTheDocument();
  });

  it('shows the new analytics insight cards with computed values', () => {
    render(
      <MemoryRouter future={routerFuture}>
        <Analytics
          transactions={[
            {
              id: 'income-1',
              created: makeIso(-1),
              type: 'income',
              amount: '3000',
              title: 'Maaş',
              categoryId: 'c0',
            },
            {
              id: 'expense-1',
              created: makeIso(-1),
              type: 'expense',
              amount: '1000',
              title: 'Market',
              categoryId: 'c1',
            },
            {
              id: 'expense-2',
              created: makeIso(),
              type: 'expense',
              amount: '500',
              title: 'Yakıt',
              categoryId: 'c2',
            },
          ]}
          isDark={false}
          color={color}
          prefs={{ currency: '₺' }}
          liveRates={liveRates}
          cats={[
            { id: 'c1', name: 'Market' },
            { id: 'c2', name: 'Ulaşım' },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Harcama İçgörüleri')).toBeInTheDocument();
    expect(screen.getByText('Ortalama İşlem')).toBeInTheDocument();
    expect(screen.getByText('₺750')).toBeInTheDocument();
    expect(screen.getByText('En Büyük Gider')).toBeInTheDocument();
    expect(screen.getAllByText('Market').length).toBeGreaterThan(0);
    expect(screen.getByText('En Yoğun Gün')).toBeInTheDocument();
  });

  it('shows debt actions in unified finance module for basic plan', () => {
    render(
      <MemoryRouter future={routerFuture}>
        <Assets
          wallets={[
            { name: 'Vadesiz TL', balance: '5000', type: 'Banka', iconType: '₺', isDebt: false },
            { name: 'Kredi Kartı', balance: '1200', type: 'Kredi Kartı', iconType: '₺', isDebt: true },
          ]}
          isDark={false}
          color={color}
          liveRates={liveRates}
          prefs={{ currency: '₺' }}
          addWallet={vi.fn()}
          updateWallet={vi.fn()}
          removeWallet={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /Kart \/ KMH/i })).toBeInTheDocument();
    expect(screen.getByText('Kredi, Kart ve Taksitler')).toBeInTheDocument();
  });

  it('shows debt actions for premium asset screens', () => {
    useAuthMock.mockReturnValue({ isPremium: true });

    render(
      <MemoryRouter future={routerFuture}>
        <Assets
          wallets={[
            { name: 'Vadesiz TL', balance: '5000', type: 'Banka', iconType: '₺', isDebt: false },
            { name: 'Kredi Kartı', balance: '1200', type: 'Kredi Kartı', iconType: '₺', isDebt: true },
          ]}
          isDark={false}
          color={color}
          liveRates={liveRates}
          prefs={{ currency: '₺' }}
          addWallet={vi.fn()}
          updateWallet={vi.fn()}
          removeWallet={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /Kart \/ KMH/i })).toBeInTheDocument();
    expect(screen.getByText('Kredi, Kart ve Taksitler')).toBeInTheDocument();
  });
});