import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Activity, AlertCircle, BarChart2, Crown, Lock, Bell, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MetricCard, PageHeader, PageShell, SectionCard } from '../components/UI';
import { convertFromTRY, normalizeCurrencySymbol } from '../utils/currency';
import { PREMIUM_LIVE_FEATURES } from '../utils/premium';
import { buildPremiumMonthlyBrief, getSpendingAnomalies, getUpcomingRenewals } from '../utils/premiumInsights';
import { usePageMeta } from '../hooks/usePageMeta';

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } },
};

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function Analytics({ transactions = [], expenses = [], isDark, color, prefs, liveRates, cats = [] }) {
  usePageMeta('Analitik', 'Aylik trendler, anomaliler ve premium finans icgoruleri.');
  const { isPremium } = useAuth();
  const cur = normalizeCurrencySymbol(prefs?.currency);
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const sub = isDark ? 'text-white/60' : 'text-slate-600';
  const cardBg = isDark ? 'bg-slate-900/48 border-white/10 shadow-pack-card backdrop-blur-xl' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
  const nestedCardBg = isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-100';

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter(t => {
      const d = new Date(t.created);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonthIdx = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const lastMonth = transactions.filter(t => {
      const d = new Date(t.created);
      return d.getMonth() === lastMonthIdx && d.getFullYear() === lastMonthYear;
    });

    const incomeTransactions = thisMonth.filter(t => t.type === 'income');
    const expenseTransactions = thisMonth.filter(t => t.type === 'expense');

    const totalIncome = incomeTransactions.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const totalExpense = expenseTransactions.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const lastExpense = lastMonth.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const changePct = lastExpense > 0 ? ((totalExpense - lastExpense) / lastExpense) * 100 : 0;
    const savings = totalIncome - totalExpense;
    const savingsPct = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
    const daysPassed = now.getDate() || 1;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const byCategory = cats.map(cat => {
      const catTxs = thisMonth.filter(t => t.categoryId === cat.id && t.type === 'expense');
      const spent = catTxs.reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      return { ...cat, spent, count: catTxs.length, pct: totalExpense > 0 ? (spent / totalExpense) * 100 : 0 };
    }).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent);

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      const amount = transactions
        .filter(t => t.type === 'expense' && new Date(t.created).toDateString() === d.toDateString())
        .reduce((s, t) => s + parseFloat(t.amount || 0), 0);
      return { day: dayStr, amount, date: d };
    });
    const maxDay = Math.max(...last7.map(d => d.amount), 1);

    const expRingPct = totalIncome > 0 ? Math.min((totalExpense / totalIncome) * 100, 100) : 0;

    const burnRate = totalExpense / daysPassed;
    const projectedMonthSpend = burnRate * daysInMonth;
    const topCategory = byCategory[0] || null;
    const concentrationPct = topCategory?.pct || 0;
    const projectedBuffer = totalIncome - projectedMonthSpend;

    const averageExpenseTicket = expenseTransactions.length > 0 ? totalExpense / expenseTransactions.length : 0;
    const largestExpense = expenseTransactions.reduce((largest, tx) => {
      if (!largest) return tx;
      return parseFloat(tx.amount || 0) > parseFloat(largest.amount || 0) ? tx : largest;
    }, null);

    const weekdaySpending = WEEKDAY_LABELS.map((label, index) => {
      const targetDay = index === 6 ? 0 : index + 1;
      const amount = expenseTransactions
        .filter(t => new Date(t.created).getDay() === targetDay)
        .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
      return { label, amount };
    });

    const maxWeekdaySpend = Math.max(...weekdaySpending.map(item => item.amount), 1);
    const weekendExpense = expenseTransactions
      .filter(t => {
        const day = new Date(t.created).getDay();
        return day === 0 || day === 6;
      })
      .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
    const weekendShare = totalExpense > 0 ? (weekendExpense / totalExpense) * 100 : 0;

    const dailyExpenseTotals = expenseTransactions.reduce((acc, tx) => {
      const createdAt = new Date(tx.created);
      const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;
      acc[key] = (acc[key] || 0) + parseFloat(tx.amount || 0);
      return acc;
    }, {});

    const topExpenseDayEntry = Object.entries(dailyExpenseTotals).sort((a, b) => b[1] - a[1])[0] || null;
    const topExpenseDay = topExpenseDayEntry
      ? {
          amount: topExpenseDayEntry[1],
          label: new Date(`${topExpenseDayEntry[0]}T00:00:00`).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        }
      : null;

    return {
      totalIncome,
      totalExpense,
      changePct,
      byCategory,
      last7,
      maxDay,
      savings,
      savingsPct,
      expRingPct,
      burnRate,
      projectedMonthSpend,
      topCategory,
      concentrationPct,
      projectedBuffer,
      averageExpenseTicket,
      largestExpense,
      expenseCount: expenseTransactions.length,
      weekdaySpending,
      maxWeekdaySpend,
      weekendShare,
      weekendExpense,
      topExpenseDay,
    };
  }, [transactions, cats]);
  const premiumPreviewFeatures = PREMIUM_LIVE_FEATURES.slice(0, 3);
  const formatCurrency = (value, maximumFractionDigits = 0) => `${cur}${convertFromTRY(value, cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits })}`;
  const premiumRenewals = useMemo(() => getUpcomingRenewals(expenses, liveRates, new Date(), 10).slice(0, 4), [expenses, liveRates]);
  const premiumAnomalies = useMemo(() => getSpendingAnomalies(transactions, cats, new Date()).slice(0, 4), [transactions, cats]);
  const premiumBrief = useMemo(() => buildPremiumMonthlyBrief({ transactions, cats, expenses, liveRates, referenceDate: new Date() }), [transactions, cats, expenses, liveRates]);

  const kpis = [
    { label: 'Bu Ay Gider', value: stats.totalExpense, cls: 'text-rose-500', fmt: v => formatCurrency(v), icon: <TrendingDown size={14} className="text-rose-500" /> },
    { label: 'Bu Ay Gelir', value: stats.totalIncome, cls: 'text-emerald-500', fmt: v => formatCurrency(v), icon: <TrendingUp size={14} className="text-emerald-500" /> },
    { label: 'Birikim', value: stats.savings, cls: stats.savings >= 0 ? 'text-emerald-500' : 'text-rose-500', fmt: v => `${v >= 0 ? '+' : ''}${formatCurrency(Math.abs(v))}`, icon: null },
    { label: 'Geçen Aya Göre', value: stats.changePct, cls: stats.changePct > 0 ? 'text-rose-500' : 'text-emerald-500', fmt: v => `${v > 0 ? '+' : ''}%${Math.abs(v).toFixed(1)}`, icon: null },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <PageShell width="wide">
        <PageHeader
          isDark={isDark}
          title="Analiz"
          description="Harcama Analizi"
          className="mb-10"
          titleClassName={`font-display text-step-4 sm:text-6xl ${txt}`}
          descriptionClassName={`text-[10px] font-semibold uppercase tracking-widest ${sub}`}
        />

        <div className="space-y-6">
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {kpis.map(({ label, value, cls, fmt, icon }) => (
              <motion.div key={label} variants={stagger.item}>
                <MetricCard
                  isDark={isDark}
                  label={label}
                  value={fmt(value)}
                  icon={icon}
                  valueClassName={`font-num text-xl sm:text-2xl font-extrabold ${cls}`}
                />
              </motion.div>
            ))}
          </motion.div>

          {stats.totalIncome > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="block"
            >
              <SectionCard isDark={isDark} padding="lg" className={`h-full ${cardBg}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-emerald-500" />
              <span className={`text-sm font-black ${txt}`}>Birikim Oranı</span>
            </div>
            <span className={`text-sm font-black ${stats.savingsPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              %{Math.max(0, stats.savingsPct).toFixed(1)}
            </span>
          </div>
          <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0, Math.min(stats.savingsPct, 100))}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              className="h-full rounded-full bg-emerald-500"
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-[10px] ${sub}`}>Gider: {formatCurrency(stats.totalExpense)}</span>
            <span className={`text-[10px] ${sub}`}>Gelir: {formatCurrency(stats.totalIncome)}</span>
          </div>
              </SectionCard>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="block"
          >
            <SectionCard isDark={isDark} padding="lg" className={`h-full ${cardBg}`}>
        <div className="flex items-center gap-2.5 mb-8">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-indigo-500/15' : 'bg-indigo-50'}`}>
            <BarChart2 size={15} className="text-indigo-500" />
          </div>
          <h2 className={`text-base font-black ${txt}`}>Son 7 Gün Gideri</h2>
        </div>
        <div className="flex items-end gap-2 sm:gap-3 h-36">
          {stats.last7.map(({ day, amount }) => {
            const pct = (amount / stats.maxDay) * 100;
            const isToday = amount > 0 && stats.last7.at(-1).day === day;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <p className={`text-[8px] sm:text-[9px] font-black ${sub} h-4 flex items-end`}>
                  {amount > 0 ? `${(amount / 1000).toFixed(1)}k` : ''}
                </p>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${Math.max(pct, amount > 0 ? 4 : 2)}%`, opacity: 1 }}
                  transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 + stats.last7.findIndex(d => d.day === day) * 0.06 }}
                  className={`w-full rounded-xl ${isToday ? color.bg : isDark ? 'bg-indigo-500/30' : 'bg-indigo-200'}`}
                  style={{ minHeight: amount > 0 ? '8px' : '3px' }}
                />
                <span className={`text-[8px] sm:text-[10px] font-black uppercase ${sub}`}>{day}</span>
              </div>
            );
          })}
        </div>
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="block"
          >
            <SectionCard
              isDark={isDark}
              padding="lg"
              className={`h-full ${
                isPremium
                  ? isDark
                    ? 'bg-amber-500/[0.08] border-amber-400/20 shadow-[0_24px_80px_rgba(245,158,11,0.16)] backdrop-blur-xl'
                    : 'bg-white/92 border-slate-200/80 shadow-[0_24px_80px_rgba(245,158,11,0.10)]'
                  : cardBg
              }`}
            >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isPremium ? 'bg-amber-500/15' : isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              {isPremium ? <Crown size={15} className="text-amber-500" /> : <Lock size={15} className="text-indigo-500" />}
            </div>
            <div>
              <h2 className={`text-base font-black ${txt}`}>{isPremium ? 'Premium Tahmin Masası' : 'Premium Tahmin Katmanı'}</h2>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${sub}`}>
                {isPremium ? 'Harcama hızı, yoğunluk ve tampon' : 'Ücretsiz plan önizleme'}
              </p>
            </div>
          </div>
          <Link to="/settings" className={`text-[10px] font-black uppercase tracking-[0.3em] ${sub}`}>
            Ayarlar
          </Link>
        </div>

        {isPremium ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-4 rounded-[1.6rem] border ${nestedCardBg}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${sub}`}>Günlük Harcama Hızı</p>
                <p className={`font-num text-2xl font-extrabold ${txt}`}>{formatCurrency(stats.burnRate)}</p>
                <p className={`text-xs mt-1 ${sub}`}>Mevcut tempo korunursa harcama hızı bu seviyede kalır.</p>
              </div>
              <div className={`p-4 rounded-[1.6rem] border ${nestedCardBg}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${sub}`}>Ay Sonu Projeksiyonu</p>
                <p className={`font-num text-2xl font-extrabold ${txt}`}>{formatCurrency(stats.projectedMonthSpend)}</p>
                <p className={`text-xs mt-1 ${stats.projectedBuffer >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {stats.projectedBuffer >= 0 ? 'Gelir bazında tampon pozitif.' : 'Gelir bazında tampon negatife dönüyor.'}
                </p>
              </div>
              <div className={`p-4 rounded-[1.6rem] border ${nestedCardBg}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${sub}`}>Kategori Yoğunluğu</p>
                <p className={`text-base font-black ${txt}`}>{stats.topCategory?.name || 'Veri bekleniyor'}</p>
                <p className={`text-xs mt-1 ${sub}`}>
                  {stats.topCategory ? `%${stats.concentrationPct.toFixed(1)} pay ile en baskın kategori.` : 'İlk kategori dağılımı oluştuğunda burada görünür.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className={`p-4 rounded-[1.6rem] border ${nestedCardBg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Bell size={14} className="text-amber-500" />
                  <p className={`text-[10px] font-black uppercase tracking-widest ${sub}`}>Renewal Radar</p>
                </div>
                {premiumRenewals.length > 0 ? (
                  <div className="space-y-2.5">
                    <p className={`text-xs font-black ${txt}`}>{formatCurrency(premiumRenewals.reduce((sum, item) => sum + item.amountTRY, 0))} kritik ödeme yükü</p>
                    {premiumRenewals.slice(0, 3).map(item => (
                      <div key={item.id} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`text-sm font-black truncate ${txt}`}>{item.name}</p>
                          <p className={`text-xs ${sub}`}>{item.dueDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} · {item.status === 'overdue' ? 'Gecikti' : item.status === 'today' ? 'Bugün' : `${item.daysUntilDue} gün`}</p>
                        </div>
                        <p className={`text-sm font-black whitespace-nowrap ${item.status === 'overdue' ? 'text-rose-500' : 'text-amber-500'}`}>{formatCurrency(item.amountTRY)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-xs leading-6 ${sub}`}>Önümüzdeki 10 günde kritik yenileme görünmüyor.</p>
                )}
              </div>

              <div className={`p-4 rounded-[1.6rem] border ${nestedCardBg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-rose-500" />
                  <p className={`text-[10px] font-black uppercase tracking-widest ${sub}`}>Anomali İzleme</p>
                </div>
                {premiumAnomalies.length > 0 ? (
                  <div className="space-y-2.5">
                    {premiumAnomalies.slice(0, 2).map(item => (
                      <div key={item.id}>
                        <p className={`text-sm font-black ${txt}`}>{item.title}</p>
                        <p className={`text-xs leading-6 ${sub}`}>{item.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-xs leading-6 ${sub}`}>Bu ay dikkat çeken bir harcama sapması görünmüyor.</p>
                )}
              </div>
            </div>

            <div className={`flex items-start gap-3 rounded-[1.6rem] border p-4 ${nestedCardBg}`}>
              <FileText size={15} className="text-indigo-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className={`text-sm font-black ${txt}`}>Aylık Executive Brief hazır</p>
                <p className={`text-xs leading-6 ${sub}`}>{premiumBrief.headline} Brief dosyasını Ayarlar ekranından indirebilirsin.</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {premiumPreviewFeatures.map(feature => (
                <div key={feature.id} className={`p-4 rounded-[1.6rem] border ${nestedCardBg}`}>
                  <p className={`text-sm font-black mb-1 ${txt}`}>{feature.title}</p>
                  <p className={`text-xs leading-5 ${sub}`}>{feature.description}</p>
                </div>
              ))}
            </div>
            <p className={`text-xs leading-6 ${sub}`}>
              Premium kullanıcılar tahmin masası ile ay sonu projeksiyonunu, kategori yoğunluğunu ve gelir tamponunu aynı ekranda görür.
            </p>
          </div>
        )}
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.27 }}
            className="block"
          >
            <SectionCard isDark={isDark} padding="lg" className={`h-full ${cardBg}`}>
        <div className="flex items-center gap-2.5 mb-7">
          <Activity size={15} className="text-indigo-500" />
          <h2 className={`text-base font-black ${txt}`}>Harcama İçgörüleri</h2>
          <span className={`text-[10px] font-black ${sub}`}>Bu ay</span>
        </div>

        {stats.expenseCount > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className={`p-4 rounded-[1.6rem] border ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${sub}`}>Ortalama İşlem</p>
                <p className={`font-num text-2xl font-extrabold ${txt}`}>{formatCurrency(stats.averageExpenseTicket)}</p>
                <p className={`text-xs mt-1 ${sub}`}>{stats.expenseCount} gider işlemi üzerinden hesaplandı.</p>
              </div>
              <div className={`p-4 rounded-[1.6rem] border ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${sub}`}>En Büyük Gider</p>
                <p className={`font-num text-2xl font-extrabold ${txt}`}>{formatCurrency(stats.largestExpense?.amount || 0)}</p>
                <p className={`text-xs mt-1 ${sub}`}>{stats.largestExpense?.title || 'Henüz veri yok'}</p>
              </div>
              <div className={`p-4 rounded-[1.6rem] border ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${sub}`}>En Yoğun Gün</p>
                <p className={`font-num text-2xl font-extrabold ${txt}`}>{formatCurrency(stats.topExpenseDay?.amount || 0)}</p>
                <p className={`text-xs mt-1 ${sub}`}>{stats.topExpenseDay ? `${stats.topExpenseDay.label} tarihinde zirve harcama` : 'Gün bazlı veri oluşmadı'}</p>
              </div>
            </div>

            <div className={`rounded-[1.8rem] border p-4 ${nestedCardBg}`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${sub}`}>Günlere Göre Dağılım</p>
                  <p className={`text-xs mt-1 ${sub}`}>Hafta sonu payı %{stats.weekendShare.toFixed(1)} · {formatCurrency(stats.weekendExpense)}</p>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${sub}`}>Pzt - Paz</span>
              </div>

              <div className="grid grid-cols-7 gap-2 items-end h-28">
                {stats.weekdaySpending.map(item => {
                  const height = item.amount > 0 ? Math.max((item.amount / stats.maxWeekdaySpend) * 100, 8) : 6;
                  return (
                    <div key={item.label} className="flex flex-col items-center justify-end gap-2">
                      <span className={`text-[8px] font-black ${sub}`}>{item.amount > 0 ? formatCurrency(item.amount) : ''}</span>
                      <div className={`w-full rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'} overflow-hidden`}>
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: `${height}%`, opacity: 1 }}
                          transition={{ duration: 0.55, ease: 'easeOut' }}
                          className={`w-full rounded-xl ${color.bg}`}
                          style={{ minHeight: '10px' }}
                        />
                      </div>
                      <span className={`text-[8px] sm:text-[10px] font-black uppercase ${sub}`}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <p className={`text-sm ${sub}`}>İçgörü kartları için bu ay gider kaydı oluşması gerekiyor.</p>
        )}
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="block"
          >
            <div className={`h-full p-6 sm:p-8 rounded-[2.5rem] border ${cardBg}`}>
        <div className="flex items-center gap-2.5 mb-7">
          <h2 className={`text-base font-black ${txt}`}>Kategoriye Göre</h2>
          <span className={`text-[10px] font-black ${sub}`}>Bu ay</span>
        </div>
        {stats.byCategory.length === 0 ? (
          <p className={`text-sm py-8 text-center ${sub}`}>Bu ay henüz gider kaydedilmedi.</p>
        ) : (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="space-y-5"
          >
            {stats.byCategory.map(cat => {
              const limit = cat.limit || 0;
              const overLimit = limit > 0 && cat.spent > limit;
              return (
                <motion.div key={cat.id} variants={stagger.item}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        {cat.emoji || '📌'}
                      </div>
                      <span className={`text-sm font-black ${txt}`}>{cat.name}</span>
                      {overLimit && <AlertCircle size={12} className="text-rose-500 animate-pulse" />}
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-black ${txt}`}>{formatCurrency(cat.spent)}</span>
                      {limit > 0 && <span className={`text-[10px] ml-1 ${sub}`}>/ {formatCurrency(limit)}</span>}
                    </div>
                  </div>
                  {limit > 0 && (
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((cat.spent / limit) * 100, 100)}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: overLimit ? '#f43f5e' : cat.color }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between mt-1">
                    <p className={`text-[9px] ${sub}`}>%{cat.pct.toFixed(1)} toplam</p>
                    {overLimit && <p className="text-[9px] font-black text-rose-500">Limit Aşıldı</p>}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
            </div>
          </motion.div>
        </div>
      </PageShell>
    </motion.div>
  );
}

export default Analytics;
