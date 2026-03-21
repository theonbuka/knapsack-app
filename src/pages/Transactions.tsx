import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Search, Trash2, Edit3, X, Check, Filter } from 'lucide-react';
import { MetricCard, PageHeader, PageShell, SectionCard } from '../components/UI';
import { convertFromTRY, getPreferredInputCurrency, normalizeCurrencySymbol } from '../utils/currency';
import { usePageMeta } from '../hooks/usePageMeta';

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.04 } } },
  item: { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } },
};

function EditModal({ tx, cats, isDark, color, wallets, defaultCurrency, onSave, onClose }) {
  const fallbackCategoryId = tx.categoryId || cats[0]?.id || 'c1';
  const [form, setForm] = useState({
    type: tx.type || 'expense',
    amount: tx.amount || '',
    currency: getPreferredInputCurrency(tx.currency || defaultCurrency),
    title: tx.title || '',
    note: tx.note || '',
    categoryId: fallbackCategoryId,
    walletId: tx.walletId || '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const inputCls = isDark
    ? 'bg-slate-950/55 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-400/70 focus:bg-slate-950/70'
    : 'bg-white border-slate-100 text-slate-900 focus:border-indigo-300';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={`w-full max-w-md rounded-t-[2.25rem] sm:rounded-[2.5rem] border ${isDark ? 'bg-slate-900/95 border-white/10 shadow-pack-card backdrop-blur-2xl' : 'bg-white border-slate-100 shadow-[0_20px_50px_rgb(15,23,42,0.08)]'}`}
      >
        <div className="max-h-[86dvh] sm:max-h-[92vh] overflow-y-auto p-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`font-num text-2xl font-bold tracking-tighter ${txt}`}>İşlemi Düzenle</h2>
            <button onClick={onClose} className={`p-2.5 rounded-2xl transition-colors ${isDark ? 'bg-slate-950/55 hover:bg-slate-950/75' : 'bg-slate-100 hover:bg-slate-200'}`}>
              <X size={18} className={txt} />
            </button>
          </div>
          <div className="space-y-3.5">
            <div className={`flex gap-1.5 p-1.5 rounded-2xl ${isDark ? 'bg-slate-950/55' : 'bg-slate-100'}`}>
              {[['expense', 'Gider'], ['income', 'Gelir']].map(([t, label]) => (
                <button key={t} type="button" onClick={() => set('type', t)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${form.type === t ? (t === 'income' ? 'bg-emerald-500 text-white shadow' : 'bg-rose-500 text-white shadow') : 'opacity-40 hover:opacity-70'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 items-stretch">
              <input
                type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
                className={`flex-1 px-4 py-3.5 rounded-2xl border font-num text-xl font-bold outline-none transition-all ${inputCls}`}
                style={{ color: form.type === 'income' ? '#10b981' : '#f43f5e' }}
              />
              <div className="flex gap-1">
                {['₺', 'USD', 'EUR'].map(c => (
                  <button key={c} type="button" onClick={() => set('currency', c)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-black border transition-all ${form.currency === c ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <input type="text" placeholder="Başlık" value={form.title} onChange={e => set('title', e.target.value)}
              className={`w-full px-4 py-3.5 rounded-2xl border text-sm font-medium outline-none transition-all ${inputCls}`} />
            <input type="text" placeholder="Not (opsiyonel)" value={form.note} onChange={e => set('note', e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl border text-sm outline-none opacity-70 focus:opacity-100 transition-all ${inputCls}`} />
            <div className="flex flex-wrap gap-1.5">
              {cats.map(cat => (
                <button key={cat.id} type="button" onClick={() => set('categoryId', cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all ${form.categoryId === cat.id ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                  <span>{cat.emoji || '📌'}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
            {wallets.length > 0 && (
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 opacity-30 ${txt}`}>Ödeme Kaynağı</p>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => set('walletId', '')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all ${!form.walletId ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                    Belirtilmemiş
                  </button>
                  {wallets.map((w, i) => (
                    <button key={i} type="button" onClick={() => set('walletId', w.name)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all ${form.walletId === w.name ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className={`sticky bottom-0 pt-4 ${isDark ? 'bg-gradient-to-t from-slate-900 via-slate-900 to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
              <button onClick={() => onSave(form)}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-opacity hover:opacity-90 ${color.bg}`}>
                <Check size={15} className="inline mr-2" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Transactions({ transactions = [], isDark, color, prefs, liveRates, cats = [], wallets = [], updateTransaction, removeTransaction }) {
  usePageMeta('İşlemler', 'Tüm gelir ve gider kayıtlarını filtreleyip düzenleyin.');
  const catMap = useMemo(() => Object.fromEntries(cats.map(c => [c.id, c])), [cats]);
  const cur = normalizeCurrencySymbol(prefs?.currency);
  const defaultCurrency = getPreferredInputCurrency(prefs?.currency);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [monthFilter, setMonth] = useState('all');
  const [yearFilter, setYear] = useState('all');
  const [editTx, setEditTx] = useState(null);

  const years = useMemo(() =>
    [...new Set(transactions.map(t => new Date(t.created).getFullYear()))].sort((a, b) => b - a),
    [transactions]);

  const filtered = useMemo(() => transactions.filter(t => {
    if (filter === 'income' && t.type !== 'income') return false;
    if (filter === 'expense' && t.type !== 'expense') return false;
    if (search && !(t.title || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (monthFilter !== 'all' && new Date(t.created).getMonth() !== parseInt(monthFilter)) return false;
    if (yearFilter !== 'all' && new Date(t.created).getFullYear() !== parseInt(yearFilter)) return false;
    return true;
  }), [transactions, filter, search, monthFilter, yearFilter]);

  const totals = useMemo(() => {
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  const handleSave = (form) => {
    if (updateTransaction) updateTransaction(editTx.id, form);
    setEditTx(null);
  };

  const txt = isDark ? 'text-white' : 'text-slate-900';
  const sub = isDark ? 'text-white/60' : 'text-slate-600';
  const cardBg = isDark ? 'bg-slate-900/48 border-white/10 shadow-pack-card backdrop-blur-xl' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
  const nestedCardBg = isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-100';
  const inputCls = isDark ? 'bg-slate-950/55 border-white/10 text-white placeholder:text-white/30 backdrop-blur-xl' : 'bg-white border-slate-100 text-slate-900';
  const selCls = isDark ? 'bg-slate-950/55 border-white/10 text-white' : 'bg-white border-slate-100 text-slate-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <PageShell width="wide">
        <PageHeader
          isDark={isDark}
          title="İşlem Geçmişi"
          description="Gelir ve gider kayıtları"
          className="mb-8"
          titleClassName={`font-display text-step-4 sm:text-6xl ${txt}`}
          descriptionClassName={`text-[10px] font-semibold uppercase tracking-widest ${sub}`}
        />

        <div className="space-y-6">
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {[
              { label: 'Gelir', value: totals.income, cls: 'text-emerald-500' },
              { label: 'Gider', value: totals.expense, cls: 'text-rose-500' },
              { label: 'Net', value: totals.net, cls: totals.net >= 0 ? 'text-emerald-500' : 'text-rose-500' },
            ].map(({ label, value, cls }) => (
              <motion.div key={label} variants={stagger.item}>
                <MetricCard
                  isDark={isDark}
                  centered
                  label={label}
                  value={(
                    <>
                      {value > 0 ? '+' : value < 0 ? '-' : ''}
                      {cur}
                      {convertFromTRY(Math.abs(value), cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </>
                  )}
                  valueClassName={`font-num text-base sm:text-xl font-bold ${cls}`}
                  className={cardBg}
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="block"
          >
            <SectionCard isDark={isDark} padding="lg" className={`h-full ${cardBg}`}>
              <div className={`mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3 ${inputCls}`}>
                <Search size={15} className={`flex-shrink-0 ${sub}`} />
                <input
                  type="text" placeholder="İşlem ara..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-transparent outline-none text-sm font-medium w-full"
                />
                {search && (
                  <button onClick={() => setSearch('')} className={`flex-shrink-0 ${sub} hover:opacity-100`}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <div className={`mr-1 flex flex-shrink-0 items-center gap-1 rounded-xl p-1 ${isDark ? 'bg-slate-950/55' : 'bg-slate-100'}`}>
                  <Filter size={12} className={sub} />
                </div>
                {[['all', 'Tümü'], ['income', 'Gelir'], ['expense', 'Gider']].map(([val, label]) => (
                  <button key={val} onClick={() => setFilter(val)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-widest border flex-shrink-0 transition-all ${filter === val ? `${color.bg} text-white border-transparent shadow-sm` : isDark ? 'border-white/10 text-white/40 hover:text-white/70' : 'border-slate-200 text-slate-400 hover:text-slate-600'}`}>
                    {label}
                  </button>
                ))}
                <select value={monthFilter} onChange={e => setMonth(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-black border outline-none cursor-pointer flex-shrink-0 ${selCls}`}>
                  <option value="all">Tüm Aylar</option>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                {years.length > 0 && (
                  <select value={yearFilter} onChange={e => setYear(e.target.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-black border outline-none cursor-pointer flex-shrink-0 ${selCls}`}>
                    <option value="all">Tüm Yıllar</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}
              </div>
            </SectionCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="block"
          >
            <SectionCard isDark={isDark} padding="lg" className={cardBg}>
              {filtered.length === 0 ? (
                <div className={`p-16 text-center rounded-[2.5rem] border border-dashed ${isDark ? 'border-white/10 bg-slate-900/28 opacity-80' : 'border-slate-200 bg-white/70 opacity-90'}`}>
                  <p className={`font-black uppercase tracking-widest text-xs ${txt}`}>
                    {transactions.length === 0 ? 'Henüz işlem yok' : 'Sonuç bulunamadı'}
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={stagger.container}
                  initial="hidden"
                  animate="show"
                  className="space-y-2.5"
                >
                  {filtered.map((t, idx) => {
                    const cat = catMap[t.categoryId] || cats[0] || { name: 'Genel', emoji: '📌', color: '#6366f1' };
                    return (
                      <motion.div
                        key={t.id || idx}
                        variants={stagger.item}
                        whileHover={{ scale: 1.005, transition: { duration: 0.15 } }}
                        className={`group flex items-center justify-between p-4 sm:p-5 rounded-[2rem] border transition-all ${nestedCardBg}`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className={`p-2.5 rounded-2xl flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                          </div>
                          <div className="min-w-0">
                            <h4 className={`font-bold text-sm truncate ${txt}`}>{t.title || cat.name}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-sm leading-none">{cat.emoji || '📌'}</span>
                              <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: cat.color }}>{cat.name}</span>
                              {t.walletId && <span className={`text-[9px] font-black ${sub}`}>· {t.walletId}</span>}
                              <span className={`text-[9px] ${sub}`}>{t.created ? new Date(t.created).toLocaleDateString('tr-TR') : ''}</span>
                            </div>
                            {t.note && <p className={`text-xs italic mt-0.5 truncate ${sub}`}>{t.note}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 pl-2">
                          <div className="text-right">
                            <p className={`font-num text-base sm:text-lg font-bold ${t.type === 'income' ? 'text-emerald-500' : txt}`}>
                              {t.type === 'income' ? '+' : '-'}
                              {cur}
                              {convertFromTRY(parseFloat(t.amount || 0), cur, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                            </p>
                            {t.currency && t.currency !== '₺' && <p className={`text-[9px] mt-0.5 ${sub}`}>{t.currency}</p>}
                          </div>
                          <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditTx(t)}
                              className={`p-1.5 rounded-xl transition-colors ${isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}>
                              <Edit3 size={12} />
                            </button>
                            <button onClick={() => removeTransaction?.(t.id)}
                              className="p-1.5 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </SectionCard>
          </motion.div>
        </div>

        <AnimatePresence>
          {editTx && (
            <EditModal
              tx={editTx} cats={cats} isDark={isDark} color={color}
              wallets={wallets} defaultCurrency={defaultCurrency}
              onSave={handleSave} onClose={() => setEditTx(null)}
            />
          )}
        </AnimatePresence>
      </PageShell>
    </motion.div>
  );
}

export default Transactions;
