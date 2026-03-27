import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { PieChart, Zap, ChevronRight, AlertCircle, Target, Crown, Lock, Bell, AlertTriangle } from 'lucide-react';
import { MetricCard, PageHeader, PageShell, SectionCard } from '../components/UI';
import { text as textCls, surface, divider } from '../styles/uiClasses';
import { useAuth } from '../contexts/AuthContext';
import { convertFromTRY, normalizeCurrencySymbol } from '../utils/currency';
import { getSpendingAnomalies, getUpcomingRenewals } from '../utils/premiumInsights';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.055 } } },
  item: {
    hidden: { opacity: 0, y: 14 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } },
  },
};

const BASIC_PLAN_FEATURES = [
  {
    id: 'basic-flow',
    title: 'Gelir / Gider Takibi',
    description: 'Günlük kişisel hareketleri sade bir akışla kaydet ve kontrol et.',
  },
  {
    id: 'basic-fixed',
    title: 'Sabit Giderler',
    description: 'Kira ve abonelikleri ayrı sekmede düzenli şekilde takip et.',
  },
  {
    id: 'basic-wallets',
    title: 'Temel Hesaplar',
    description: 'Vadesiz, USD, EUR ve altın bakiyelerini tek alanda yönet.',
  },
];

export default function Home({ transactions = [], wallets = [], expenses = [], isDark, prefs, color, liveRates, cats = [] }) {
  const { isPremium } = useAuth();
  const metrics = useMemo(() => {
    let totalAssets = 0, totalDebt = 0;
    const distribution = { Nakit: 0, Döviz: 0, Altın: 0 };
    const rates = liveRates || { GOLD: 3185, USD: 33.20, EUR: 35.90 };

    wallets.forEach(w => {
      const val = parseFloat(w.balance || 0);
      let tlVal = val;
      if (w.isDebt) {
        if (w.iconType === 'USD') tlVal = val * rates.USD;
        else if (w.iconType === 'EUR') tlVal = val * rates.EUR;
        else if (w.iconType === 'GOLD') tlVal = val * rates.GOLD;
        totalDebt += tlVal;
        return;
      }
      if (w.iconType === 'GOLD') { tlVal = val * rates.GOLD; distribution.Altın += tlVal; }
      else if (w.iconType === 'USD') { tlVal = val * rates.USD; distribution.Döviz += tlVal; }
      else if (w.iconType === 'EUR') { tlVal = val * rates.EUR; distribution.Döviz += tlVal; }
      else { distribution.Nakit += tlVal; }
      totalAssets += tlVal;
    });

    const now = new Date();
    const daysPassed = now.getDate() || 1;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthlyExpense = transactions
      .filter(t => {
        const createdAt = new Date(t.created);
        return (
          t.type === 'expense' &&
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear()
        );
      })
      .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const monthlyIncome = transactions
      .filter(t => {
        const createdAt = new Date(t.created);
        return (
          t.type === 'income' &&
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear()
        );
      })
      .reduce((s, t) => s + parseFloat(t.amount || 0), 0);

    const byCategory = cats
      .map(cat => {
        const spent = transactions
          .filter(t => {
            const createdAt = new Date(t.created);
            return (
              t.type === 'expense' &&
              t.categoryId === cat.id &&
              createdAt.getMonth() === now.getMonth() &&
              createdAt.getFullYear() === now.getFullYear()
            );
          })
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

        return {
          ...cat,
          spent,
        };
      })
      .filter(cat => cat.spent > 0)
      .sort((a, b) => b.spent - a.spent);

    const predictedEnd = (monthlyExpense / daysPassed) * daysInMonth;
    const savings = monthlyIncome - monthlyExpense;
    const savingsGoal = prefs?.savingsGoal || 0;
    const savingsPct = savingsGoal > 0 ? Math.min((savings / savingsGoal) * 100, 100) : 0;
    const burnRate = monthlyExpense / daysPassed;
    const projectedBuffer = monthlyIncome - predictedEnd;
    const topCategory = byCategory[0] || null;

    let insight = 'Harcama disiplinin harika görünüyor.';
    if (monthlyExpense > 20000) insight = 'Bu ayki harcama ivmen yüksek. Dikkatli ol!';
    else if (monthlyExpense > 10000) insight = 'Orta düzey harcama. Kontrol altında.';
    else if (savings > 0) insight = `Bu ay ${savings.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}₺ tasarruf ettin!`;

    return {
      totalAssets,
      totalDebt,
      distribution,
      predictedEnd,
      monthlyExpense,
      monthlyIncome,
      savings,
      savingsPct,
      savingsGoal,
      insight,
      burnRate,
      projectedBuffer,
      topCategory,
    };
  }, [wallets, liveRates, transactions, prefs, cats]);

  const total = metrics.totalAssets || 1;
  const nakitPct = (metrics.distribution.Nakit / total) * 100;
  const altinPct = (metrics.distribution.Altın / total) * 100;
  const dovizPct = (metrics.distribution.Döviz / total) * 100;
  const catMap = useMemo(() => Object.fromEntries(cats.map(c => [c.id, c])), [cats]);

  const cur = normalizeCurrencySymbol(prefs?.currency);
  const txt = textCls.primary(isDark);
  const txtSec = textCls.secondary(isDark);
  const txtTer = textCls.tertiary(isDark);
  const nestedCardBg = isDark ? 'bg-slate-950/45 border-white/[0.08]' : 'bg-slate-50/80 border-slate-200/50';
  const netWorth = metrics.totalAssets - metrics.totalDebt;
  const netWorthDisplay = convertFromTRY(Math.abs(netWorth), cur, liveRates);
  const totalAssetsDisplay = convertFromTRY(metrics.totalAssets, cur, liveRates);
  const totalDebtDisplay = convertFromTRY(metrics.totalDebt, cur, liveRates);
  const predictedEndDisplay = convertFromTRY(metrics.predictedEnd, cur, liveRates);
  const savingsDisplay = convertFromTRY(metrics.savings, cur, liveRates);
  const savingsGoalDisplay = convertFromTRY(metrics.savingsGoal, cur, liveRates);
  const burnRateDisplay = convertFromTRY(metrics.burnRate || 0, cur, liveRates);
  const projectedBufferDisplay = convertFromTRY(Math.abs(metrics.projectedBuffer || 0), cur, liveRates);
  const topCategorySpendDisplay = convertFromTRY(metrics.topCategory?.spent || 0, cur, liveRates);
  const tickerRates = liveRates || { USD: 33.2, EUR: 35.9, GOLD: 3185 };
  const insightText = metrics.savings > 0 && metrics.monthlyExpense <= 10000
    ? `Bu ay ${cur}${savingsDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} tasarruf ettin.`
    : metrics.insight;
  const premiumRenewals = useMemo(() => getUpcomingRenewals(expenses, liveRates, new Date(), 10).slice(0, 3), [expenses, liveRates]);
  const premiumAnomalies = useMemo(() => getSpendingAnomalies(transactions, cats, new Date()).slice(0, 3), [transactions, cats]);
  const topAnomaly = premiumAnomalies[0] || null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <PageShell width="wide" topSpacing="hero">
      {/* ── LIVE TICKER ───────────────────────────────────────── */}
      <div className={`overflow-hidden py-2.5 -mx-4 sm:-mx-6 mb-12 border-b backdrop-blur-xl ${isDark ? 'border-white/[0.08] bg-slate-900/25' : 'border-slate-200/60 bg-slate-50/70'}`}>
        <div className={`ticker-track flex gap-12 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.3em] ${isDark ? 'text-indigo-400/60' : 'text-indigo-600/50'}`}>
          {Array(6).fill([
            `USD ${tickerRates.USD.toFixed(2)} ₺`,
            `EUR ${tickerRates.EUR.toFixed(2)} ₺`,
            `XAU ${tickerRates.GOLD.toFixed(0)} ₺/gr`,
            'PAYONAR AKTİF',
          ]).flat().map((item, i) => (
            <span key={i} className="flex items-center gap-12">
              {item}
              <span className="opacity-20">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HERO HEADER ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-16"
      >
        <PageHeader
          isDark={isDark}
          eyebrow={(
            <div className="flex items-center gap-2.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${color.bg}`} />
              <span className={`text-xs font-bold uppercase tracking-wider opacity-60 ${txtTer}`}>
                Finans Merkezi
              </span>
            </div>
          )}
          eyebrowClassName="mb-4"
          title="Payonar"
          description="Finansal durumunuzu kontrol edin, akıllı kararlar alın."
          titleClassName={`font-display text-step-4 sm:text-[4.75rem] font-extrabold tracking-[-0.04em] leading-[0.98] ${txt}`}
          descriptionClassName={`mt-4 max-w-2xl text-base sm:text-lg ${txtSec}`}
        />
      </motion.div>

      <div className="mb-8 space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)] items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="block"
        >
          <div className={`h-full p-7 sm:p-9 rounded-card border relative overflow-hidden ${
            isDark ? 'bg-indigo-500/[0.10] border-indigo-400/20 shadow-[0_30px_80px_rgba(99,102,241,0.20)] backdrop-blur-xl' : 'bg-white border-indigo-100/80 shadow-card-light'
          }`}>
            <div className="relative z-10">
              <p className={`text-[10px] font-semibold uppercase tracking-[0.45em] mb-5 ${isDark ? 'text-indigo-400/70' : 'text-indigo-600/70'}`}>
                Toplam Net Değer
              </p>
              <h2 className={`font-num text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-none mb-8 ${netWorth < 0 ? 'text-rose-500' : txt}`}>
                {cur}{netWorthDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </h2>
              <div className={`h-px mb-8 ${divider(isDark)}`} />
              <div className="flex gap-8 sm:gap-12">
                <div>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${txtSec}`}>Varlıklar</p>
                  <p className="font-num text-xl sm:text-2xl font-bold text-emerald-500">
                    +{cur}{totalAssetsDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                {metrics.totalDebt > 0 && (
                  <>
                    <div className={`w-px self-stretch border-l ${divider(isDark)}`} />
                    <div>
                      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${txtSec}`}>Borçlar</p>
                      <p className="font-num text-xl sm:text-2xl font-bold text-rose-500">
                        -{cur}{totalDebtDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="absolute -right-16 -top-16 w-72 h-72 bg-indigo-500/[0.08] rounded-full blur-[90px] pointer-events-none" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="block"
        >
          <div className={`h-full p-7 flex flex-col items-center justify-center ${surface.card(isDark)}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.4em] mb-7 ${txtSec}`}>Dağılım</p>
            <div className="relative w-32 h-32 mb-7">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="transparent"
                  stroke={isDark ? '#1a1a24' : '#f1f0ea'} strokeWidth="2.5" />
                <motion.circle cx="18" cy="18" r="15.9155" fill="transparent"
                  stroke="#6366f1" strokeWidth="4" strokeDasharray="100 100"
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: 100 - nakitPct }}
                  transition={{ duration: 1.3, ease: 'easeOut', delay: 0.4 }}
                  strokeLinecap="round"
                />
                <motion.circle cx="18" cy="18" r="15.9155" fill="transparent"
                  stroke="#d4a853" strokeWidth="4"
                  strokeDasharray={`${altinPct} 100`}
                  initial={{ strokeDashoffset: 100 }}
                  animate={{ strokeDashoffset: -(nakitPct) }}
                  transition={{ duration: 1.3, ease: 'easeOut', delay: 0.55 }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <PieChart size={18} className={`${txtSec} opacity-30`} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 w-full text-center">
              {[
                { c: '#6366f1', pct: nakitPct, label: 'Nakit' },
                { c: '#d4a853', pct: altinPct, label: 'Altın' },
                { c: '#34d399', pct: dovizPct, label: 'Döviz' },
              ].map(({ c, pct, label }) => (
                <div key={label}>
                  <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: c }} />
                  <p className={`font-num text-sm font-bold ${txt}`}>%{(pct || 0).toFixed(0)}</p>
                  <p className={`text-[10px] font-semibold uppercase tracking-widest mt-0.5 ${txtSec}`}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
        </div>

        <div className={`grid gap-4 ${metrics.savingsGoal > 0 ? 'xl:grid-cols-3' : 'xl:grid-cols-2'}`}>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="block"
        >
          <SectionCard
            isDark={isDark}
            className={`h-full flex items-center gap-4 ${
              isDark ? 'bg-indigo-500/[0.08] border-indigo-400/18 shadow-[0_20px_60px_rgba(99,102,241,0.16)]' : 'bg-indigo-50/90 border-indigo-200/70 shadow-[0_18px_40px_rgba(99,102,241,0.10)]'
            }`}
          >
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-100'}`}>
              <Zap size={16} className="text-indigo-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-semibold uppercase tracking-widest mb-0.5 ${txtSec}`}>
                Aylık Tahmini Gider
              </p>
              <p className={`font-num text-lg font-bold ${txt}`}>
                {cur}{predictedEndDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <p className={`text-xs font-medium max-w-[40%] text-right leading-snug ${txtSec} hidden sm:block`}>
              {insightText}
            </p>
          </SectionCard>
        </motion.div>

        {metrics.savingsGoal > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="block"
          >
            <SectionCard isDark={isDark} className="h-full">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Target size={13} className="text-emerald-500 flex-shrink-0" />
                  <span className={`text-sm font-semibold ${txt}`}>Tasarruf Hedefi</span>
                </div>
                <div className="text-right">
                  <span className={`font-num text-sm font-bold ${metrics.savings >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {metrics.savings >= 0 ? '+' : ''}{cur}{Math.abs(savingsDisplay).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                  </span>
                  <span className={`text-xs ml-1 ${txtSec}`}>/ {cur}{savingsGoalDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/8' : 'bg-slate-200/80'}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, metrics.savingsPct)}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.35 }}
                  className={`h-full rounded-full ${metrics.savings >= metrics.savingsGoal ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                />
              </div>
              <p className={`text-[9px] font-semibold mt-1.5 ${txtSec}`}>%{Math.max(0, metrics.savingsPct).toFixed(0)} tamamlandı</p>
            </SectionCard>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="block"
        >
          <SectionCard
            isDark={isDark}
            padding="lg"
            className={`h-full ${
              isPremium
                ? isDark
                  ? 'bg-amber-500/[0.08] border-amber-400/20 shadow-[0_24px_80px_rgba(245,158,11,0.16)] backdrop-blur-xl'
                  : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                : ''
            }`}
          >
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-2xl ${isPremium ? 'bg-amber-500/15' : isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                {isPremium ? <Crown size={16} className="text-amber-500" /> : <Lock size={16} className="text-indigo-500" />}
              </div>
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.35em] ${txtSec}`}>
                  {isPremium ? 'Premium Özeti' : 'Payonar Premium'}
                </p>
                <h3 className={`text-lg sm:text-xl font-black ${txt}`}>
                  {isPremium ? 'Finans masan hazır.' : 'Premium katman ile daha derin görünürlük.'}
                </h3>
              </div>
            </div>
            <Link
              to={isPremium ? '/credit-cards' : '/fixed-expenses'}
              className={`text-[10px] font-semibold uppercase tracking-[0.3em] transition-opacity ${isDark ? 'text-white/45 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {isPremium ? 'Kartlar' : 'Giderler'}
            </Link>
          </div>

          {isPremium ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MetricCard
                  isDark={isDark}
                  label="Günlük Harcama Hızı"
                  value={`${cur}${burnRateDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                  meta="Bu ayın ortalama günlük gider hızı."
                  className={isDark ? 'bg-slate-950/45 border-white/10' : 'bg-white/80 border-slate-200/80'}
                  valueClassName={`text-2xl font-extrabold ${txt}`}
                  metaClassName={txtSec}
                />
                <MetricCard
                  isDark={isDark}
                  label="Ay Sonu Tamponu"
                  value={`${metrics.projectedBuffer >= 0 ? '+' : '-'}${cur}${projectedBufferDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                  meta="Gelir temposu korunursa ay sonu tamponu bu seviyede kalır."
                  className={isDark ? 'bg-slate-950/45 border-white/10' : 'bg-white/80 border-slate-200/80'}
                  valueClassName={`text-2xl font-extrabold ${metrics.projectedBuffer >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                  metaClassName={txtSec}
                />
                <MetricCard
                  isDark={isDark}
                  label="Odak Kategorisi"
                  value={metrics.topCategory?.name || 'Veri bekleniyor'}
                  meta={metrics.topCategory ? `${cur}${topCategorySpendDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ile en yüksek kategori.` : 'İlk giderlerden sonra otomatik hesaplanır.'}
                  className={isDark ? 'bg-slate-950/45 border-white/10' : 'bg-white/80 border-slate-200/80'}
                  valueClassName={`text-base font-black ${txt}`}
                  metaClassName={txtSec}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SectionCard isDark={isDark} className={nestedCardBg}>
                  <div className="flex items-center gap-2 mb-3">
                    <Bell size={14} className="text-amber-500" />
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${txtSec}`}>Renewal Radar</p>
                  </div>
                  {premiumRenewals.length > 0 ? (
                    <div className="space-y-2.5">
                      {premiumRenewals.slice(0, 2).map(item => {
                        const displayAmount = convertFromTRY(item.amountTRY, cur, liveRates);
                        const badge = item.status === 'overdue' ? 'Gecikti' : item.status === 'today' ? 'Bugün' : `${item.daysUntilDue} gün`;

                        return (
                          <div key={item.id} className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className={`text-sm font-black truncate ${txt}`}>{item.name}</p>
                              <p className={`text-xs ${txtSec}`}>{item.dueDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} · {badge}</p>
                            </div>
                            <p className={`text-sm font-black whitespace-nowrap ${item.status === 'overdue' ? 'text-rose-500' : 'text-amber-500'}`}>
                              {cur}{displayAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className={`text-xs leading-6 ${txtSec}`}>Önümüzdeki 10 günde kritik yenileme görünmüyor.</p>
                  )}
                </SectionCard>

                <SectionCard isDark={isDark} className={nestedCardBg}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-rose-500" />
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${txtSec}`}>Anomali İzleme</p>
                  </div>
                  {topAnomaly ? (
                    <div>
                      <p className={`text-sm font-black mb-1 ${txt}`}>{topAnomaly.title}</p>
                      <p className={`text-xs leading-6 ${txtSec}`}>{topAnomaly.description}</p>
                    </div>
                  ) : (
                    <p className={`text-xs leading-6 ${txtSec}`}>Bu ay belirgin bir harcama sıçraması tespit edilmedi.</p>
                  )}
                </SectionCard>
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {BASIC_PLAN_FEATURES.map(feature => (
                  <SectionCard
                    key={feature.id}
                    isDark={isDark}
                    className={nestedCardBg}
                  >
                    <p className={`text-sm font-black mb-1 ${txt}`}>{feature.title}</p>
                    <p className={`text-xs leading-5 ${txtSec}`}>{feature.description}</p>
                  </SectionCard>
                ))}
              </div>
              <p className={`text-xs leading-6 ${txtSec}`}>
                Basic hesapta günlük finans alanı sade kalır. Analytics ve borç modülleri ayrı Premium merkezi üzerinden açılır; ana ekran temel akışla karışmaz.
              </p>
            </div>
          )}
        </SectionCard>
        </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.26 }}
          className="block"
        >
          <SectionCard isDark={isDark} padding="lg">
            <div className="flex justify-between items-end mb-5 px-1">
              <div>
                <h2 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${txt}`}>
                  Son Hareketler
                </h2>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.4em] mt-1 opacity-50 ${txtSec}`}>
                  İşlem Akışı
                </p>
              </div>
              <Link
                to="/daily-expenses"
                className={`text-[10px] font-semibold uppercase tracking-[0.35em] flex items-center gap-1 transition-opacity opacity-25 hover:opacity-80 ${txt}`}
              >
                Tümü <ChevronRight size={11} />
              </Link>
            </div>

            {transactions.length === 0 ? (
              <SectionCard
                isDark={isDark}
                padding="lg"
                className={`text-center border-dashed ${
                  isDark ? 'border-white/10 bg-slate-900/35 opacity-70' : 'border-slate-200 bg-white/70 opacity-90'
                }`}
              >
                <p className={`text-xs font-medium uppercase tracking-widest ${txt}`}>
                  Henüz işlem yok, + butonuna dokun.
                </p>
              </SectionCard>
            ) : (
              <motion.div
                variants={stagger.container}
                initial="hidden"
                animate="show"
                className="space-y-2.5"
              >
                {transactions.slice(0, 6).map(t => {
                  const cat = catMap[t.categoryId] || cats[0] || { name: 'Genel', emoji: '📌', color: '#6366f1' };
                  const catSpend = transactions
                    .filter(tx => tx.categoryId === t.categoryId && tx.type === 'expense')
                    .reduce((s, tx) => s + parseFloat(tx.amount || 0), 0);
                  const isOverLimit = cat.limit > 0 && catSpend > cat.limit;

                  return (
                    <motion.div
                      key={t.id}
                      variants={stagger.item}
                      whileHover={{ y: -2, transition: { duration: 0.15 } }}
                      className={`flex items-center justify-between p-4 sm:p-5 rounded-widget border transition-shadow cursor-default group ${nestedCardBg}`}
                      style={{ willChange: 'transform' }}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div
                          className="w-10 h-10 rounded-btn-lg flex items-center justify-center text-lg flex-shrink-0"
                          style={{ backgroundColor: `${cat.color}1a` }}
                        >
                          {cat.emoji || '📌'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className={`font-semibold text-sm truncate ${txt}`}>{t.title || cat.name}</h4>
                            {isOverLimit && <AlertCircle size={11} className="text-rose-500 animate-pulse flex-shrink-0" />}
                          </div>
                          <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] mt-0.5 ${txtSec}`}>
                            {cat.name}
                            <span className="mx-1.5 opacity-30">·</span>
                            {new Date(t.created).toLocaleDateString('tr-TR')}
                          </p>
                          {t.note && <p className={`text-xs italic mt-0.5 truncate ${txtSec}`}>{t.note}</p>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 pl-3">
                        <p className={`font-num text-base sm:text-lg font-extrabold ${t.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                          {t.type === 'expense' ? '−' : '+'}
                          {cur}{convertFromTRY(parseFloat(t.amount || 0), cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </p>
                        {isOverLimit && (
                          <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-widest block mt-0.5">
                            Limit Aşıldı
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </SectionCard>
        </motion.div>
      </div>
      </PageShell>
    </motion.div>
  );
}
