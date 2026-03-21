import { useState, useMemo, useEffect, useRef, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, CheckCircle, Circle, Zap, CreditCard, Home as HomeIcon, Bell, Edit3 } from 'lucide-react';
import { MetricCard, PageHeader, PageShell, SectionCard } from '../components/UI';
import { EXPENSE_TYPES } from '../utils/constants';
import { convertFromTRY, convertToTRY, getPreferredInputCurrency, normalizeCurrencySymbol } from '../utils/currency';
import { usePageMeta } from '../hooks/usePageMeta';
import type { ExpenseItem, UserPrefs } from '../types';

type ExpenseType = ExpenseItem['type'];
type TabType = 'all' | ExpenseType;

interface AccentColor {
  bg: string;
}

interface LiveRates {
  USD?: number;
  EUR?: number;
  GOLD?: number;
}

interface ExpenseForm {
  type: ExpenseType;
  name: string;
  amount: string;
  currency: string;
  dueDay: number;
  serviceKey: string;
}

interface ExpensesProps {
  expenses?: ExpenseItem[];
  isDark: boolean;
  color: AccentColor;
  prefs?: UserPrefs;
  liveRates?: LiveRates;
  addExpense: (expense: Partial<ExpenseItem>) => void;
  removeExpense: (id: string) => void;
  toggleExpensePaid: (id: string) => void;
  updateExpense: (id: string, patch: Partial<ExpenseItem>) => void;
  fabTrigger?: number;
}

/* ─── streaming / known services ─────────────────────────────────────── */
const KNOWN_SERVICES = [
  { name: 'Netflix', bg: '#E50914', text: '#fff', abbr: 'N', emoji: '🎬' },
  { name: 'Spotify', bg: '#1DB954', text: '#fff', abbr: 'S', emoji: '🎵' },
  { name: 'YouTube Premium', bg: '#FF0000', text: '#fff', abbr: 'YT', emoji: '▶️' },
  { name: 'Disney+', bg: '#113CCF', text: '#fff', abbr: 'D+', emoji: '🏰' },
  { name: 'Apple TV+', bg: '#1C1C1E', text: '#fff', abbr: 'TV+', emoji: '🍎' },
  { name: 'Amazon Prime', bg: '#00A8E0', text: '#fff', abbr: 'AP', emoji: '📦' },
  { name: 'HBO Max', bg: '#5822C9', text: '#fff', abbr: 'HBO', emoji: '🎭' },
  { name: 'Mubi', bg: '#291208', text: '#fff', abbr: 'M', emoji: '🎥' },
  { name: 'Blutv', bg: '#00B4D8', text: '#fff', abbr: 'B', emoji: '📺' },
  { name: 'Gain', bg: '#7B2FBE', text: '#fff', abbr: 'G', emoji: '🎞️' },
  { name: 'Exxen', bg: '#FF4F00', text: '#fff', abbr: 'EX', emoji: '📡' },
  { name: 'Tabii', bg: '#C8102E', text: '#fff', abbr: 'TB', emoji: '🦅' },
  { name: 'Tidal', bg: '#000000', text: '#fff', abbr: 'TI', emoji: '🌊' },
  { name: 'Apple Music', bg: '#FC3C44', text: '#fff', abbr: 'AM', emoji: '🎶' },
  { name: 'Deezer', bg: '#A238FF', text: '#fff', abbr: 'DZ', emoji: '🎸' },
  { name: 'ChatGPT Plus', bg: '#10A37F', text: '#fff', abbr: 'AI', emoji: '🤖' },
  { name: 'Claude Pro', bg: '#CC785C', text: '#fff', abbr: 'CL', emoji: '🧠' },
  { name: 'Midjourney', bg: '#000', text: '#fff', abbr: 'MJ', emoji: '🎨' },
  { name: 'Adobe CC', bg: '#FF0000', text: '#fff', abbr: 'AD', emoji: '🖌️' },
  { name: 'Microsoft 365', bg: '#0078D4', text: '#fff', abbr: 'M365',emoji: '💼' },
  { name: 'Google One', bg: '#4285F4', text: '#fff', abbr: 'G1', emoji: '☁️' },
  { name: 'iCloud+', bg: '#3693EB', text: '#fff', abbr: 'iC', emoji: '🍎' },
  { name: 'Dropbox', bg: '#0061FF', text: '#fff', abbr: 'DB', emoji: '📂' },
  { name: 'Notion', bg: '#000000', text: '#fff', abbr: 'NO', emoji: '📝' },
  { name: 'Figma', bg: '#F24E1E', text: '#fff', abbr: 'FG', emoji: '✏️' },
  { name: 'GitHub Pro', bg: '#24292E', text: '#fff', abbr: 'GH', emoji: '💻' },
  { name: 'LinkedIn Premium', bg: '#0A66C2', text: '#fff', abbr: 'LI', emoji: '🔗' },
  { name: 'Duolingo', bg: '#58CC02', text: '#fff', abbr: 'DU', emoji: '🦉' },
  { name: 'VPN', bg: '#6366f1', text: '#fff', abbr: 'VPN', emoji: '🔒' },
  { name: 'Antivirus', bg: '#34d399', text: '#fff', abbr: 'AV', emoji: '🛡️' },
];

const TYPE_META = {
  bill:         { label: 'Fatura', icon: <Zap size={18}/>, color: '#818cf8', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  subscription: { label: 'Abonelik', icon: <CreditCard size={18}/>, color: '#60a5fa', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  rent:         { label: 'Sabit Giderler', icon: <HomeIcon size={18}/>, color: '#f87171', bg: 'bg-rose-500/10', text: 'text-rose-400' },
};

const RENT_PRESETS = [
  { name: 'Kira', emoji: '🏠' },
  { name: 'Aidat', emoji: '🧾' },
  { name: 'Site Yönetimi', emoji: '🏢' },
  { name: 'Otopark', emoji: '🚘' },
  { name: 'Depo / Apartman', emoji: '🧱' },
];

const BILL_PRESETS = [
  { name: 'Elektrik', emoji: '⚡' },
  { name: 'Su', emoji: '💧' },
  { name: 'Doğalgaz', emoji: '🔥' },
  { name: 'İnternet', emoji: '🌐' },
  { name: 'Telefon', emoji: '📱' },
  { name: 'TV / Kablo', emoji: '📺' },
];

type BasicPreset = { name: string; emoji: string };
type SubscriptionPreset = { name: string; badge: string; bg: string; text: string };
type ExpensePreset = BasicPreset | SubscriptionPreset;

const EXPENSE_PRESETS: Record<ExpenseType, ExpensePreset[]> = {
  rent: RENT_PRESETS,
  bill: BILL_PRESETS,
  subscription: KNOWN_SERVICES.map(service => ({
    name: service.name,
    badge: service.abbr,
    bg: service.bg,
    text: service.text,
  })),
};

function createExpenseForm(defaultCurrency = '₺', defaultType: ExpenseType = 'bill'): ExpenseForm {
  return { type: defaultType, name: '', amount: '', currency: defaultCurrency, dueDay: 1, serviceKey: '' };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function clampDueDay(year: number, month: number, dueDay: number | string) {
  const maxDay = new Date(year, month + 1, 0).getDate();
  const normalized = Math.max(1, parseInt(String(dueDay), 10) || 1);
  return Math.min(normalized, maxDay);
}

function buildDueDate(year: number, month: number, dueDay: number | string) {
  return new Date(year, month, clampDueDay(year, month, dueDay));
}

function getCurrentMonthDueDate(dueDay: number | string, referenceDate: Date) {
  return buildDueDate(referenceDate.getFullYear(), referenceDate.getMonth(), dueDay);
}

function getNextDueDate(dueDay: number | string, referenceDate: Date) {
  const currentMonthDue = getCurrentMonthDueDate(dueDay, referenceDate);
  if (currentMonthDue.getTime() >= referenceDate.getTime()) {
    return currentMonthDue;
  }

  const year = referenceDate.getMonth() === 11 ? referenceDate.getFullYear() + 1 : referenceDate.getFullYear();
  const month = referenceDate.getMonth() === 11 ? 0 : referenceDate.getMonth() + 1;
  return buildDueDate(year, month, dueDay);
}

/* ─── Expenses page ──────────────────────────────────────────────────── */
function Expenses({ expenses = [], isDark, color, prefs, liveRates, addExpense, removeExpense, toggleExpensePaid, updateExpense, fabTrigger = 0 }: ExpensesProps) {
  usePageMeta('Sabit Giderler', 'Fatura, kira ve abonelik giderlerinizi tek listede takip edin.');
  const [tab, setTab] = useState<TabType>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<ExpenseItem | null>(null);
  const [presetSearch, setPresetSearch] = useState('');
  const lastFabTriggerRef = useRef<number>(fabTrigger);
  const displayCurrency = normalizeCurrencySymbol(prefs?.currency);
  const defaultCurrency = getPreferredInputCurrency(prefs?.currency);
  const [form, setForm] = useState(() => createExpenseForm(defaultCurrency, 'rent'));

  const currentMonth = new Date().toISOString().slice(0, 7);

  const grouped = useMemo(() => {
    const list = tab === 'all' ? expenses : expenses.filter(e => e.type === tab);
    return {
      rent:         list.filter(e => e.type === 'rent'),
      bill:         list.filter(e => e.type === 'bill'),
      subscription: list.filter(e => e.type === 'subscription'),
    };
  }, [expenses, tab]);

  const totals = useMemo(() => {
    const monthly = expenses.reduce((s, e) => s + convertToTRY(e.amount || 0, e.currency, liveRates), 0);
    const paid = expenses.filter(e => (e.paidMonths || []).includes(currentMonth))
                            .reduce((s, e) => s + convertToTRY(e.amount || 0, e.currency, liveRates), 0);
    return { monthly, paid, unpaid: monthly - paid };
  }, [expenses, currentMonth, liveRates]);

  const txt = isDark ? 'text-white' : 'text-slate-900';
  const sub = isDark ? 'text-white/40' : 'text-slate-400';
  const cardBg = isDark ? 'bg-slate-900/48 border-white/10 shadow-pack-card backdrop-blur-xl' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
  const nestedCardBg = isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-100';
  const inputCls = isDark
    ? 'bg-slate-950/55 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-400/70 focus:bg-slate-950/70'
    : 'bg-white border-slate-100 text-slate-900 focus:border-indigo-300';
  const preferredType: ExpenseType = tab === 'all' ? 'rent' : tab;

  const closeModal = () => {
    setShowAdd(false);
    setEditItem(null);
    setPresetSearch('');
    setForm(createExpenseForm(defaultCurrency, preferredType));
  };

  useEffect(() => {
    if (fabTrigger <= lastFabTriggerRef.current) {
      return;
    }

    lastFabTriggerRef.current = fabTrigger;
    const forcedType = preferredType;
    const frame = window.requestAnimationFrame(() => {
      setForm(createExpenseForm(defaultCurrency, forcedType));
      setPresetSearch('');
      setEditItem(null);
      setShowAdd(true);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [fabTrigger, defaultCurrency, preferredType]);

  const handleAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.amount) return;
    const payload: Partial<ExpenseItem> = { ...form, amount: parseFloat(form.amount), dueDay: Number(form.dueDay) || 1 };
    if (editItem) {
      updateExpense(editItem.id, payload);
    } else {
      addExpense(payload);
    }
    closeModal();
  };

  const filteredPresets = useMemo(() => {
    const search = presetSearch.trim().toLowerCase();
    const presets = EXPENSE_PRESETS[form.type] || [];

    if (!search) {
      return presets;
    }

    return presets.filter(item => item.name.toLowerCase().includes(search));
  }, [form.type, presetSearch]);

  const renderExpenseRow = (item: ExpenseItem, type: ExpenseType) => {
    const meta = TYPE_META[type];
    const isPaid = (item.paidMonths || []).includes(currentMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentDueDate = getCurrentMonthDueDate(item.dueDay, today);
    const nextDueDate = getNextDueDate(item.dueDay, today);
    const daysLeft = Math.ceil((nextDueDate.getTime() - today.getTime()) / DAY_MS);
    const isOverdue = !isPaid && currentDueDate.getTime() < today.getTime();
    const isUrgent = !isPaid && (isOverdue || daysLeft <= 3);
    const svc = KNOWN_SERVICES.find(s => item.name?.toLowerCase().includes(s.name.toLowerCase()));
    const amountTRY = convertToTRY(item.amount || 0, item.currency, liveRates);
    const displayAmount = convertFromTRY(amountTRY, displayCurrency, liveRates);
    const originalCurrency = normalizeCurrencySymbol(item.currency);
    const showOriginalCurrency = originalCurrency !== displayCurrency;

    return (
      <motion.div layout key={item.id} whileHover={{ scale: 1.005 }}
        className={`flex items-center gap-4 p-4 rounded-[2rem] border transition-all group ${isPaid ? (isDark ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-emerald-50 border-emerald-200 opacity-70') : nestedCardBg}`}>

        {/* checkbox */}
        <button onClick={() => toggleExpensePaid(item.id)}
          className={`flex-shrink-0 transition-colors ${isPaid ? 'text-emerald-500' : isDark ? 'text-white/20 hover:text-white/60' : 'text-slate-300 hover:text-slate-600'}`}>
          {isPaid ? <CheckCircle size={22}/> : <Circle size={22}/>}
        </button>

        {/* icon — service badge or type icon */}
        {svc ? (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0"
            style={{ backgroundColor: svc.bg, color: svc.text }}>{svc.abbr}</div>
        ) : (
          <div className={`p-2 rounded-xl flex-shrink-0 ${meta.bg} ${meta.text}`}>{meta.icon}</div>
        )}

        {/* info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-black text-sm truncate ${isPaid ? 'line-through opacity-50' : ''} ${txt}`}>{item.name}</p>
            {isUrgent && !isPaid && (
              <span className="text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full flex-shrink-0">
                {isOverdue ? 'Gecikti' : daysLeft === 0 ? 'Bugün!' : `${daysLeft} gün`}
              </span>
            )}
          </div>
          <p className={`text-[10px] opacity-40 ${txt}`}>
            Her ay {item.dueDay}. günü{showOriginalCurrency ? ` · Orijinal ${parseFloat(String(item.amount)).toLocaleString('tr-TR')} ${originalCurrency}` : ''}
          </p>
        </div>

        {/* amount */}
        <p className={`text-lg font-black tracking-tighter flex-shrink-0 ${isPaid ? 'text-emerald-500' : txt}`}>
          {displayCurrency}{displayAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
        </p>

        {/* actions */}
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button onClick={() => { setEditItem(item); setForm({ type: item.type, name: item.name, amount: String(item.amount), currency: getPreferredInputCurrency(item.currency || defaultCurrency), dueDay: item.dueDay, serviceKey: '' }); setPresetSearch(''); setShowAdd(true); }}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
            <Edit3 size={13}/>
          </button>
          <button onClick={() => removeExpense(item.id)} className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 transition-colors">
            <Trash2 size={14}/>
          </button>
        </div>
      </motion.div>
    );
  };

  const renderExpenseSection = (items: ExpenseItem[], type: ExpenseType) => {
    const meta = TYPE_META[type];
    if (tab !== 'all' && tab !== type) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-xl ${meta.bg} ${meta.text}`}>{meta.icon}</div>
          <h2 className={`text-base font-black ${txt}`}>{meta.label}</h2>
          <span className={`text-xs opacity-30 font-black ${txt}`}>({items.length})</span>
        </div>
        {items.length === 0 ? (
          <div className={`p-6 rounded-[2rem] border border-dashed text-center ${isDark ? 'border-white/10 opacity-30' : 'border-slate-200 opacity-50'}`}>
            <p className={`text-xs font-black uppercase tracking-widest ${txt}`}>Henüz {meta.label.toLowerCase()} yok</p>
          </div>
        ) : (
          <div className="space-y-2.5">{items.map(item => renderExpenseRow(item, type))}</div>
        )}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageShell width="wide">
        <PageHeader
          isDark={isDark}
          title="Giderler."
          description="Sabit giderler, faturalar ve abonelikler"
          className="mb-6"
          titleClassName={`font-display text-step-4 sm:text-6xl mb-1 ${txt}`}
          descriptionClassName={`text-[10px] font-semibold uppercase tracking-widest ${sub}`}
          eyebrowClassName="font-black tracking-[0.5em] opacity-60"
        />

        <div className="space-y-6">
          <SectionCard isDark={isDark} padding="lg" className={cardBg}>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-white/6 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                <Bell size={16} />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.28em] ${sub}`}>Ödeme Akışı</p>
                <p className={`mt-2 text-sm font-semibold leading-6 ${txt}`}>Kira, aidat, faturalar ve abonelikler için sağ alttaki <span className="font-black">+</span> düğmesini kullan.</p>
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: 'Aylık Toplam', value: totals.monthly, cls: txt },
              { label: 'Ödendi', value: totals.paid, cls: 'text-emerald-500' },
              { label: 'Kalan', value: totals.unpaid, cls: totals.unpaid > 0 ? 'text-rose-500' : txt },
            ].map(({ label, value, cls }) => (
              <MetricCard
                key={label}
                isDark={isDark}
                centered
                label={label}
                value={`${displayCurrency}${convertFromTRY(value, displayCurrency, liveRates).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                valueClassName={`text-xl font-black tracking-tighter ${cls}`}
                className={cardBg}
              />
            ))}
          </div>

          <SectionCard isDark={isDark} padding="lg" className={cardBg}>
            <div className="flex gap-2 mb-2 flex-wrap">
              {([
                ['all', 'Tümü'],
                ['rent', 'Sabit'],
                ['bill', 'Faturalar'],
                ['subscription', 'Abonelikler'],
              ] as Array<[TabType, string]>).map(([val, label]) => (
                <button key={val} onClick={() => setTab(val)}
                  className={`px-4 py-2 rounded-xl text-xs font-black border transition-all ${tab===val ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40 hover:text-white' : 'border-slate-200 text-slate-400 hover:text-slate-700'}`}>
                  {label}
                </button>
              ))}
            </div>

            {expenses.length === 0 ? (
              <div className={`p-20 rounded-[3rem] border border-dashed text-center ${isDark ? 'border-white/10 bg-slate-900/24 opacity-80' : 'border-slate-200 bg-white/70 opacity-90'}`}>
                <Bell size={32} className={`mx-auto mb-4 ${txt}`}/>
                <p className={`font-black uppercase tracking-widest text-xs ${txt}`}>Sabit gider eklemediniz. Sağ alttaki + ile başlayın.</p>
              </div>
            ) : (
              <>
                {renderExpenseSection(grouped.rent, 'rent')}
                {renderExpenseSection(grouped.bill, 'bill')}
                {renderExpenseSection(grouped.subscription, 'subscription')}
              </>
            )}
          </SectionCard>
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md"
              onClick={e => e.target === e.currentTarget && closeModal()}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className={`w-full max-w-md rounded-t-[2.25rem] sm:rounded-[3rem] border ${isDark ? 'bg-slate-900/95 border-white/10 shadow-pack-card backdrop-blur-2xl' : 'bg-white border-slate-100 shadow-[0_20px_50px_rgb(15,23,42,0.08)]'}`}>
                <div className="max-h-[86dvh] sm:max-h-[92vh] overflow-y-auto p-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-2xl font-black ${txt}`}>{editItem ? 'Gideri Düzenle' : 'Yeni Sabit Gider'}</h2>
                    <button onClick={closeModal} className="opacity-40 hover:opacity-100"><X size={20} className={txt}/></button>
                  </div>

                  <form onSubmit={handleAdd} className="space-y-4">
                  {/* Type */}
                  <div className="flex gap-2">
                    {EXPENSE_TYPES.map(t => (
                      <button key={t.id} type="button" onClick={() => setForm(p => ({ ...p, type: t.id as ExpenseType }))}
                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${form.type===t.id ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {!editItem && (
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-3 ${txt}`}>
                        {form.type === 'subscription' ? 'Hazır Servisler' : form.type === 'bill' ? 'Hazır Fatura Türleri' : 'Hazır Sabit Giderler'}
                      </p>
                      <input type="text" placeholder="Ara..." value={presetSearch}
                        onChange={e => setPresetSearch(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium outline-none mb-2 ${inputCls}`}/>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                        {filteredPresets.map(preset => (
                          <button key={preset.name} type="button"
                            onClick={() => { setForm(p => ({ ...p, name: preset.name })); setPresetSearch(''); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${form.name === preset.name ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40 hover:text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400'}`}>
                            {'badge' in preset ? (
                              <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black" style={{ backgroundColor: preset.bg, color: preset.text }}>{preset.badge}</span>
                            ) : (
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-[11px] ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>{preset.emoji}</span>
                            )}
                            {preset.name}
                          </button>
                        ))}
                        {filteredPresets.length === 0 && (
                          <p className={`text-xs opacity-50 px-1 ${txt}`}>Aramaya uygun hazır seçenek bulunamadı.</p>
                        )}
                      </div>
                    </div>
                  )}

                  <input type="text" placeholder="Ad (Elektrik, Netflix...)" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                    className={`w-full px-5 py-4 rounded-2xl border text-sm font-medium outline-none ${inputCls}`}/>

                  <div className="flex gap-3 items-center">
                    <input type="number" placeholder="Tutar" value={form.amount}
                      onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required
                      className={`flex-1 px-5 py-4 rounded-2xl border text-sm font-medium outline-none ${inputCls}`}/>
                    <div className="flex gap-1.5">
                      {['₺','USD','EUR'].map(c => (
                        <button key={c} type="button" onClick={() => setForm(p => ({ ...p, currency: c }))}
                          className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${form.currency===c ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className={`text-xs font-black uppercase tracking-widest opacity-40 flex-shrink-0 ${txt}`}>Ödeme Günü</label>
                    <input type="number" min="1" max="31" value={form.dueDay}
                      onChange={e => setForm(p => ({ ...p, dueDay: Number(e.target.value) || 1 }))}
                      className={`w-20 px-4 py-3 rounded-2xl border text-sm font-black text-center outline-none ${inputCls}`}/>
                    <span className={`text-xs opacity-30 ${txt}`}>Her ayın {form.dueDay || 1}. günü</span>
                  </div>

                    <div className={`sticky bottom-0 pt-4 ${isDark ? 'bg-gradient-to-t from-slate-900 via-slate-900 to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
                      <button type="submit"
                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white ${color.bg}`}>
                        {editItem ? 'Güncelle' : 'Ekle'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </PageShell>
    </motion.div>
  );
}

export default Expenses;
