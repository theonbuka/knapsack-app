import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, TrendingDown, TrendingUp } from 'lucide-react';
import { MetricCard, PageHeader, PageShell, SectionCard } from '../components/UI';
import { convertFromTRY, normalizeCurrencySymbol } from '../utils/currency';
import { usePageMeta } from '../hooks/usePageMeta';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function Calendar({ transactions = [], isDark, color, prefs, liveRates, cats = [] }) {
  usePageMeta('Takvim', 'Aylik finans hareketlerini tarih bazinda inceleyin.');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayTxs, setSelectedDayTxs] = useState([]);

  const catMap = useMemo(() => Object.fromEntries(cats.map(c => [c.id, c])), [cats]);
  const cur = normalizeCurrencySymbol(prefs?.currency);
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const cardBg = isDark
    ? 'bg-slate-900/48 border-white/10 shadow-pack-card backdrop-blur-xl'
    : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Group transactions by date string "YYYY-MM-DD"
  const txByDay = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const d = new Date(t.created);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const key = d.getDate();
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [transactions, year, month]);

  // Month stats
  const monthStats = useMemo(() => {
    let income = 0, expense = 0;
    transactions.forEach(t => {
      const d = new Date(t.created);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const amt = parseFloat(t.amount || 0);
      if (t.type === 'income') income += amt;
      else expense += amt;
    });
    return { income, expense, net: income - expense };
  }, [transactions, year, month]);

  // Build calendar grid (Mon-start)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1; // convert to Mon=0

  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startDow + 1;
    return dayNum >= 1 && dayNum <= lastDay.getDate() ? dayNum : null;
  });

  const maxExpense = useMemo(() => {
    return Math.max(...Object.values(txByDay).map(txs =>
      txs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    ), 1);
  }, [txByDay]);

  const today = new Date();
  const isToday = (d) => d === today.getDate() && year === today.getFullYear() && month === today.getMonth();

  const handleDayClick = (d) => {
    if (!d || !txByDay[d]) return;
    setSelectedDay(d);
    setSelectedDayTxs(txByDay[d]);
  };

  const formatDayAmount = (amount) => {
    return `${cur}${convertFromTRY(amount, cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <PageShell width="wide">

        <PageHeader
          isDark={isDark}
          title={<>{MONTHS[month]} <span className="opacity-30">{year}</span></>}
          className="mb-8"
          titleClassName={`font-display text-step-4 sm:text-6xl ${txt}`}
          eyebrowClassName="font-black tracking-[0.5em] opacity-60"
          actions={(
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className={`p-3 rounded-2xl transition-all ${isDark ? 'border border-white/10 bg-slate-950/55 text-white hover:bg-slate-950/75' : 'bg-white hover:bg-slate-50 border border-slate-100 text-slate-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                <ChevronLeft size={20}/>
              </button>
              <button onClick={() => setCurrentDate(new Date())} className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? 'border border-white/10 bg-slate-950/55 text-white/70 hover:bg-slate-950/75' : 'bg-white border border-slate-100 text-slate-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                Bugün
              </button>
              <button onClick={nextMonth} className={`p-3 rounded-2xl transition-all ${isDark ? 'border border-white/10 bg-slate-950/55 text-white hover:bg-slate-950/75' : 'bg-white hover:bg-slate-50 border border-slate-100 text-slate-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
                <ChevronRight size={20}/>
              </button>
            </div>
          )}
        />

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Gelir', val: monthStats.income, cls: 'text-emerald-500', prefix: '+' },
              { label: 'Gider', val: monthStats.expense, cls: 'text-rose-500', prefix: '-' },
              { label: 'Net', val: monthStats.net, cls: monthStats.net >= 0 ? 'text-emerald-500' : 'text-rose-500', prefix: monthStats.net >= 0 ? '+' : '' },
            ].map(({ label, val, cls, prefix }) => (
              <MetricCard
                key={label}
                isDark={isDark}
                label={label}
                value={`${prefix}${cur}${convertFromTRY(Math.abs(val), cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                valueClassName={`font-num text-xl font-bold tracking-tight ${cls}`}
                className={cardBg}
              />
            ))}
          </div>

          <SectionCard isDark={isDark} padding="lg" className={cardBg}>
            <p className={`text-[10px] font-black uppercase tracking-[0.35em] ${isDark ? 'text-indigo-300/70' : 'text-indigo-600/70'}`}>
              Ay Görünümü
            </p>
            <h2 className={`mt-3 text-2xl font-black ${txt}`}>{MONTHS[month]} akışı</h2>
            <p className={`mt-3 text-sm leading-6 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
              Takvim yüzeyi gün bazlı yoğunluğu gösterir. Renk yoğunluğu gideri, yeşil yüzey ise gelir hareketini işaret eder.
            </p>

            <div className="mt-6 space-y-3">
              <div className={`rounded-[1.6rem] border px-4 py-4 ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/45' : 'text-slate-400'}`}>Yoğun Günler</p>
                <p className={`mt-2 text-sm font-black ${txt}`}>En yüksek gider günü daha koyu sıcak tonla vurgulanır.</p>
              </div>
              <div className="flex items-center gap-6 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400/60"/>
                  <span className={`text-[10px] font-semibold uppercase tracking-widest opacity-40 ${txt}`}>Gider</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400/60"/>
                  <span className={`text-[10px] font-semibold uppercase tracking-widest opacity-40 ${txt}`}>Gelir</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color.bg}`}/>
                  <span className={`text-[10px] font-semibold uppercase tracking-widest opacity-40 ${txt}`}>Bugün</span>
                </div>
              </div>
            </div>
          </SectionCard>

          <div>
            <div className={`rounded-[2.5rem] border overflow-hidden ${isDark ? 'bg-slate-900/42 border-white/10 shadow-pack-card backdrop-blur-xl' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/5">
          {DAYS.map(d => (
            <div key={d} className={`py-3 text-center text-[10px] font-semibold uppercase tracking-widest opacity-30 ${txt}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const txs = d ? txByDay[d] || [] : [];
            const dayExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
            const dayIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
            const intensity = maxExpense > 0 ? dayExpense / maxExpense : 0;
            const hasTx = txs.length > 0;
            const _isToday = d && isToday(d);

            return (
              <div
                key={i}
                onClick={() => handleDayClick(d)}
                className={`relative min-h-[80px] sm:min-h-[96px] p-2 sm:p-3 border-b border-r transition-all
                  ${isDark ? 'border-white/5' : 'border-slate-100'}
                  ${d ? (hasTx ? 'cursor-pointer hover:bg-white/5' : '') : 'opacity-20'}
                  ${i % 7 === 6 ? 'border-r-0' : ''}
                  ${Math.floor(i / 7) === Math.floor((cells.length - 1) / 7) ? 'border-b-0' : ''}
                `}
              >
                {d && (
                  <>
                    {/* Heat background */}
                    {dayExpense > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundColor: `rgba(244, 63, 94, ${intensity * 0.18})` }}
                      />
                    )}
                    {dayIncome > 0 && dayExpense === 0 && (
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: 'rgba(16,185,129,0.10)' }}/>
                    )}

                    {/* Day number */}
                    <div className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-full text-sm font-black mb-1
                      ${_isToday ? `${color.bg} text-white` : `${txt} opacity-70`}`}>
                      {d}
                    </div>

                    {/* Amount */}
                    {hasTx && (
                      <div className="relative z-10 space-y-0.5">
                        {dayExpense > 0 && (
                          <p className="text-[8px] sm:text-[9px] font-black text-rose-400 leading-tight truncate" title={`-${formatDayAmount(dayExpense)}`}>
                            -{formatDayAmount(dayExpense)}
                          </p>
                        )}
                        {dayIncome > 0 && (
                          <p className="text-[8px] sm:text-[9px] font-black text-emerald-400 leading-tight truncate" title={`+${formatDayAmount(dayIncome)}`}>
                            +{formatDayAmount(dayIncome)}
                          </p>
                        )}
                        {/* transaction count dot */}
                        <div className="flex gap-0.5 mt-1">
                          {txs.slice(0, 4).map((_, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full ${txs[idx]?.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'}`}/>
                          ))}
                          {txs.length > 4 && <span className="text-[8px] opacity-40 font-black">+{txs.length - 4}</span>}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedDay && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[300] flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setSelectedDay(null)}>
              <motion.div
                initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                className={`w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] border
                  ${isDark ? 'bg-slate-900/95 border-white/10 text-white shadow-pack-card backdrop-blur-2xl' : 'bg-white border-slate-100 shadow-[0_20px_50px_rgb(15,23,42,0.08)] text-slate-900'}`}
              >
                <div className="max-h-[86dvh] sm:max-h-[85vh] overflow-y-auto p-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className={`text-3xl font-black tracking-tighter ${txt}`}>
                        {selectedDay} {MONTHS[month]}
                      </h3>
                      <p className={`text-[11px] font-black uppercase tracking-widest opacity-30 mt-1 ${txt}`}>
                        {selectedDayTxs.length} işlem
                      </p>
                    </div>
                    <button onClick={() => setSelectedDay(null)}
                      className={`p-3 rounded-2xl ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>
                      <X size={20}/>
                    </button>
                  </div>

                {/* Day summary */}
                {(() => {
                  const inc = selectedDayTxs.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
                  const exp = selectedDayTxs.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
                  return (
                    <div className={`flex gap-4 mb-6 p-4 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                      {exp > 0 && (
                        <div className="flex items-center gap-2">
                          <TrendingDown size={14} className="text-rose-500"/>
                          <span className="text-rose-500 font-black text-sm">{cur}{convertFromTRY(exp, cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                        </div>
                      )}
                      {inc > 0 && (
                        <div className="flex items-center gap-2">
                          <TrendingUp size={14} className="text-emerald-500"/>
                          <span className="text-emerald-500 font-black text-sm">{cur}{convertFromTRY(inc, cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="space-y-3">
                  {selectedDayTxs.map((t, i) => {
                    const cat = catMap[t.categoryId];
                    return (
                      <div key={t.id || i} className={`flex items-center justify-between p-4 rounded-[1.5rem] border ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
                            style={{ backgroundColor: cat ? `${cat.color}20` : '#6366f120' }}>
                            {cat?.emoji || (t.type === 'income' ? '💰' : '💸')}
                          </div>
                          <div>
                            <p className={`font-black text-sm ${txt}`}>{t.title || 'İsimsiz'}</p>
                            <p className={`text-[10px] font-semibold uppercase tracking-widest opacity-30 ${txt}`}>
                              {cat?.name || '—'} {t.walletId ? `• ${t.walletId}` : ''}
                            </p>
                          </div>
                        </div>
                        <p className={`font-black text-base ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {t.type === 'income' ? '+' : '-'}{cur}{convertFromTRY(parseFloat(t.amount || 0), cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    );
                  })}
                </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PageShell>
    </motion.div>
  );
}
