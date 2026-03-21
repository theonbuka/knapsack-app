import React, { useState, useLayoutEffect, useEffect, lazy, Suspense, useMemo, useRef, useCallback } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, useAnimationControls } from 'framer-motion';
import {
  Home as HomeIcon, List, CreditCard, Receipt, Calculator, Settings as SettingsIcon,
} from 'lucide-react';
import { useFinance } from './hooks/useFinance';
import { themeColors } from './utils/constants';
import { getPreferredInputCurrency } from './utils/currency';
import { AppAmbientBackground, AppFloatingActionButton, AppLoadingScreen, AppNavigationDock } from './components/AppChrome';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthGuard } from './components/AuthGuard';
import { QuickAddSheet } from './components/QuickAddSheet';
import { useAuth } from './contexts/AuthContext';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Assets = lazy(() => import('./pages/Assets'));
const Landing = lazy(() => import('./pages/Landing'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Settings = lazy(() => import('./pages/Settings'));

const DARK_APP_BG = '#0F172A';
const LIGHT_APP_BG = '#F8FAFC';
const CANONICAL_WEB_ORIGIN = 'https://payonar.com';
const LIGHT_THEME_MIGRATION_KEY = 'knapsack_theme_premium_light_v1';
const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE?.trim() === 'true';
const MAINTENANCE_BYPASS_KEY = import.meta.env.VITE_MAINTENANCE_BYPASS_KEY?.trim() || '';
const MAINTENANCE_BYPASS_STORAGE_KEY = 'payonar_maintenance_bypass';

function shouldForceCanonicalOrigin(hostname: string): boolean {
  const canonicalHostname = new URL(CANONICAL_WEB_ORIGIN).hostname;
  if (!hostname || hostname === canonicalHostname) {
    return false;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') {
    return false;
  }

  return hostname.endsWith('.vercel.app');
}

function MaintenancePage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute bottom-[-120px] right-[-80px] h-80 w-80 rounded-full bg-cyan-500/20 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-4 w-full max-w-2xl rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 text-center shadow-[0_30px_90px_rgba(2,6,23,0.65)] backdrop-blur-xl sm:p-12">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-emerald-300/80">Payonar</p>
        <h1 className={`mt-4 text-4xl font-black tracking-[-0.03em] text-white sm:text-5xl`}>Yapımdayız</h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
          Daha stabil ve daha iyi bir deneyim için sistemi güncelliyoruz. Kısa süre içinde tekrar yayında olacağız.
        </p>
        <div className="mt-8 inline-flex items-center rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-200">
          Geçici Bakım Modu
        </div>
      </div>
    </div>
  );
}

function createQuickAddForm(defaultCurrency = '₺', defaultCategoryId = 'c1') {
  return {
    type: 'expense',
    amount: '',
    currency: defaultCurrency,
    title: '',
    categoryId: defaultCategoryId,
    note: '',
    walletId: '',
    entryDate: getTodayInputValue(),
  };
}

function getTodayInputValue(date = new Date()) {
  const shifted = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return shifted.toISOString().slice(0, 10);
}

/* ─── App Shell ───────────────────────────────────────────── */
function App() {
  const loc = useLocation();
  const { isAuthenticated, auth, isPremium } = useAuth();
  const {
    data, liveRates, addTransaction, updateTransaction, removeTransaction,
    addWallet, updateWallet, removeWallet,
    addExpense, removeExpense, toggleExpensePaid, updateExpense,
    savePrefs, saveCats, refresh, loading,
  } = useFinance();

  const [isDark, setIsDark] = useState(() => {
    const migrated = localStorage.getItem(LIGHT_THEME_MIGRATION_KEY);
    const storedTheme = localStorage.getItem('knapsack_theme');

    if (!migrated) {
      localStorage.setItem(LIGHT_THEME_MIGRATION_KEY, 'true');
      localStorage.setItem('knapsack_theme', 'false');
      return false;
    }

    return storedTheme !== null ? JSON.parse(storedTheme) : false;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickAddError, setQuickAddError] = useState('');
  const [expenseFabTrigger, setExpenseFabTrigger] = useState(0);
  const dockRef = useRef<HTMLDivElement>(null);
  const navButtonRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [indicatorFrame, setIndicatorFrame] = useState({ x: 0, y: 0, width: 0, height: 0, visible: false });
  const themeToggleControls = useAnimationControls();

  const activeColor = themeColors[data.prefs?.themeColor] || themeColors.indigo;
  const cats = data.cats || [];
  const defaultTransactionCurrency = getPreferredInputCurrency(data.prefs?.currency);
  const quickAddWallets = useMemo(
    () => (isPremium ? data.wallets : data.wallets.filter(wallet => !wallet.isDebt)),
    [data.wallets, isPremium],
  );
  const defaultCategoryId = cats[0]?.id || 'c1';
  const [form, setForm] = useState(() => createQuickAddForm(defaultTransactionCurrency, defaultCategoryId));
  const isExpensesRoute = loc.pathname === '/fixed-expenses';
  const navItems = useMemo(() => {
    return [
      { to: '/', icon: <HomeIcon size={18} strokeWidth={1.5} />, label: 'Ana Sayfa' },
      { to: '/daily-expenses', icon: <List size={18} strokeWidth={1.5} />, label: 'Günlük Harcamalar' },
      { to: '/credit-cards', icon: <CreditCard size={18} strokeWidth={1.5} />, label: 'Kredi Kartları' },
      { to: '/fixed-expenses', icon: <Receipt size={18} strokeWidth={1.5} />, label: 'Sabit Giderler' },
      { to: '/loans', icon: <Calculator size={18} strokeWidth={1.5} />, label: 'Kredi ve Taksitler' },
      { to: '/settings', icon: <SettingsIcon size={18} strokeWidth={1.5} />, label: 'Ayarlar' },
    ];
  }, []);
  const activeNavIndex = useMemo(
    () => navItems.findIndex(item => item.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(item.to)),
    [loc.pathname, navItems],
  );
  const toolbarPlate = isDark ? 'rgba(15, 23, 42, 0.90)' : 'rgba(255, 255, 255, 0.82)';

  const resetQuickAdd = useCallback(() => {
    setQuickAddError('');
    setForm(createQuickAddForm(defaultTransactionCurrency, defaultCategoryId));
  }, [defaultCategoryId, defaultTransactionCurrency]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const bg = isDark ? DARK_APP_BG : LIGHT_APP_BG;
    root.style.backgroundColor = bg;
    root.style.colorScheme = isDark ? 'dark' : 'light';
    document.body.style.backgroundColor = bg;
    root.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (shouldForceCanonicalOrigin(window.location.hostname)) {
      const destination = `${CANONICAL_WEB_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(destination);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    }
  }, [isAuthenticated, auth.email, auth.googleId, auth.name, auth.surname, refresh]);

  const updateIndicator = useCallback(() => {
    const dockNode = dockRef.current;
    const activeButton = activeNavIndex >= 0 ? navButtonRefs.current[activeNavIndex] : null;

    if (!dockNode || !activeButton) {
      setIndicatorFrame(prev => ({ ...prev, visible: false }));
      return;
    }

    const dockRect = dockNode.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    setIndicatorFrame({
      x: buttonRect.left - dockRect.left - 4,
      y: buttonRect.top - dockRect.top - 4,
      width: buttonRect.width + 8,
      height: buttonRect.height + 8,
      visible: true,
    });
  }, [activeNavIndex]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(updateIndicator);
    const handleResize = () => window.requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateIndicator]);

  const toggleTheme = () => {
    void themeToggleControls.start({
      scale: [1, 1.25, 0.93, 1.06, 1],
      y: [0, -3, 0],
      transition: {
        duration: 0.58,
        times: [0, 0.26, 0.56, 0.78, 1],
        ease: 'easeOut',
      },
    });

    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('knapsack_theme', JSON.stringify(next));
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount) {
      setQuickAddError('Lütfen tutar giriniz.');
      return;
    }

    try {
      addTransaction({
        ...form,
        currency: defaultTransactionCurrency,
        created: form.entryDate
          ? new Date(`${form.entryDate}T12:00:00`).toISOString()
          : new Date().toISOString(),
      });
      setQuickAddError('');
      setForm(createQuickAddForm(defaultTransactionCurrency, defaultCategoryId));
      setIsModalOpen(false);
    } catch (err) {
      setQuickAddError(err instanceof Error ? err.message : 'İşlem kaydedilemedi.');
    }
  };

  const closeQuickAdd = useCallback(() => {
    setIsModalOpen(false);
    resetQuickAdd();
  }, [resetQuickAdd]);

  const handleFabPress = useCallback(() => {
    if (isExpensesRoute) {
      setExpenseFabTrigger(previous => previous + 1);
      return;
    }

    resetQuickAdd();
    setIsModalOpen(true);
  }, [isExpensesRoute, resetQuickAdd]);

  const hasMaintenanceBypass = useMemo(() => {
    if (!MAINTENANCE_MODE) {
      return true;
    }

    if (typeof window === 'undefined') {
      return false;
    }

    if (window.sessionStorage.getItem(MAINTENANCE_BYPASS_STORAGE_KEY) === 'true') {
      return true;
    }

    const query = new URLSearchParams(loc.search);
    const bypassFromQuery = query.get('mbypass')?.trim();

    if (!bypassFromQuery || !MAINTENANCE_BYPASS_KEY || bypassFromQuery !== MAINTENANCE_BYPASS_KEY) {
      return false;
    }

    window.sessionStorage.setItem(MAINTENANCE_BYPASS_STORAGE_KEY, 'true');
    return true;
  }, [loc.search]);

  useEffect(() => {
    if (!MAINTENANCE_MODE || !hasMaintenanceBypass || typeof window === 'undefined') {
      return;
    }

    const query = new URLSearchParams(window.location.search);
    if (!query.has('mbypass')) {
      return;
    }

    query.delete('mbypass');
    const queryString = query.toString();
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`;
    window.history.replaceState({}, document.title, nextUrl);
  }, [hasMaintenanceBypass]);

  if (MAINTENANCE_MODE && !hasMaintenanceBypass) {
    return <MaintenancePage />;
  }

  if (loading && loc.pathname !== '/landing') {
    return <AppLoadingScreen activeColor={activeColor} isDark={isDark} />;
  }

  return (
    <div className={`${isDark ? 'pack-grid-shell' : 'pack-grid-shell pack-grid-shell-light'} min-h-screen overflow-x-hidden font-body transition-colors duration-700 ${
      isDark ? 'dark bg-pack-bg text-slate-100' : 'bg-slate-50 text-slate-950'
    }`}>
      <AppAmbientBackground activeColor={activeColor} isDark={isDark} />

      {/* PAGES */}
      <div className="relative">
        <ErrorBoundary>
          <Suspense fallback={<AppLoadingScreen activeColor={activeColor} isDark={isDark} />}>
            <Routes location={loc} key={loc.pathname}>
              <Route path="/landing" element={isAuthenticated ? <Navigate to="/" replace /> : <Landing />} />
              <Route path="/" element={<AuthGuard><Home transactions={data.trans} wallets={data.wallets} expenses={data.expenses} isDark={isDark} prefs={data.prefs} color={activeColor} liveRates={liveRates} cats={cats} /></AuthGuard>} />
              <Route path="/daily-expenses" element={<AuthGuard><Transactions transactions={data.trans} isDark={isDark} color={activeColor} prefs={data.prefs} liveRates={liveRates} cats={cats} wallets={data.wallets} updateTransaction={updateTransaction} removeTransaction={removeTransaction} /></AuthGuard>} />
              <Route path="/credit-cards" element={<AuthGuard><Assets mode="credit-cards" wallets={data.wallets} isDark={isDark} color={activeColor} liveRates={liveRates} prefs={data.prefs} addWallet={addWallet} updateWallet={updateWallet} removeWallet={removeWallet} /></AuthGuard>} />
              <Route path="/fixed-expenses" element={<AuthGuard><Expenses expenses={data.expenses} isDark={isDark} color={activeColor} prefs={data.prefs} liveRates={liveRates} addExpense={addExpense} removeExpense={removeExpense} toggleExpensePaid={toggleExpensePaid} updateExpense={updateExpense} fabTrigger={expenseFabTrigger} /></AuthGuard>} />
              <Route path="/loans" element={<AuthGuard><Assets mode="loans" wallets={data.wallets} isDark={isDark} color={activeColor} liveRates={liveRates} prefs={data.prefs} addWallet={addWallet} updateWallet={updateWallet} removeWallet={removeWallet} /></AuthGuard>} />
              <Route path="/transactions" element={<Navigate to="/daily-expenses" replace />} />
              <Route path="/assets" element={<Navigate to="/credit-cards" replace />} />
              <Route path="/expenses" element={<Navigate to="/fixed-expenses" replace />} />
              <Route path="/calendar" element={<Navigate to="/" replace />} />
              <Route path="/analytics" element={<Navigate to="/" replace />} />
              <Route path="/premium" element={<Navigate to="/" replace />} />
              <Route path="/settings" element={<AuthGuard><Settings isDark={isDark} color={activeColor} prefs={data.prefs} savePrefs={savePrefs} cats={cats} saveCats={saveCats} liveRates={liveRates} transactions={data.trans} expenses={data.expenses} /></AuthGuard>} />
              <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/landing'} replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>

      <AppFloatingActionButton
        activeColor={activeColor}
        isDark={isDark}
        isExpensesRoute={isExpensesRoute}
        isExpanded={isModalOpen}
        onPress={handleFabPress}
      />

      <AppNavigationDock
        activeColor={activeColor}
        activeNavIndex={activeNavIndex}
        dockRef={dockRef}
        indicatorFrame={indicatorFrame}
        isDark={isDark}
        navButtonRefs={navButtonRefs}
        navItems={navItems}
        onToggleTheme={toggleTheme}
        themeToggleControls={themeToggleControls}
        toolbarPlate={toolbarPlate}
      />

      <AnimatePresence>
        {isModalOpen && (
          <QuickAddSheet
            isOpen={isModalOpen}
            onClose={closeQuickAdd}
            form={form} setForm={setForm}
            handleSubmit={handleSubmit}
            isDark={isDark} activeColor={activeColor}
            cats={cats} wallets={quickAddWallets}
            recentTransactions={data.trans}
            submitError={quickAddError}
            onClearError={() => setQuickAddError('')}
            fixedCurrencyLabel={defaultTransactionCurrency}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
