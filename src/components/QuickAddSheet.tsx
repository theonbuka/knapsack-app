import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { surface as surfaceCls, text as textCls, focusRing } from '../styles/uiClasses';

interface QuickAddFormState {
  type: string;
  amount: string;
  currency: string;
  title: string;
  categoryId: string;
  note: string;
  walletId: string;
  entryDate: string;
}

interface QuickAddCategory {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
}

interface QuickAddWallet {
  name: string;
  isDebt?: boolean;
}

interface RecentTransaction {
  type?: string;
  categoryId?: string;
  title?: string;
  walletId?: string;
}

interface AccentColor {
  bg: string;
  hex: string;
}

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  form: QuickAddFormState;
  setForm: React.Dispatch<React.SetStateAction<QuickAddFormState>>;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isDark: boolean;
  activeColor: AccentColor;
  cats: QuickAddCategory[];
  wallets: QuickAddWallet[];
  recentTransactions: RecentTransaction[];
  submitError: string;
  onClearError: () => void;
  fixedCurrencyLabel?: string;
  isSubmitting?: boolean;
}

function getQuickAmountPresets(type: string, currency: string) {
  if (currency === 'USD' || currency === 'EUR') {
    return type === 'income' ? [25, 50, 100, 250] : [10, 20, 50, 100];
  }

  return type === 'income' ? [1000, 2500, 5000, 10000] : [100, 250, 500, 1000];
}

export function QuickAddSheet({
  isOpen,
  onClose,
  form,
  setForm,
  handleSubmit,
  isDark,
  activeColor,
  cats,
  wallets,
  recentTransactions,
  submitError,
  onClearError,
  fixedCurrencyLabel,
  isSubmitting = false,
}: QuickAddSheetProps) {
  const { t } = useTranslation();
  const inputCls = surfaceCls.input(isDark);
  const fieldFocusCls = focusRing.base(isDark);
  const buttonFocusCls = focusRing.base(isDark);
  const txt = textCls.primary(isDark);
  const txtSec = textCls.secondary(isDark);
  const txtMuted = textCls.muted(isDark);
  const displayCurrency = fixedCurrencyLabel || form.currency;
  const quickAmounts = useMemo(() => getQuickAmountPresets(form.type, displayCurrency), [displayCurrency, form.type]);
  const selectedWallet = wallets.find(wallet => wallet.name === form.walletId);
  const categoryUsage = useMemo(() => {
    const usage = new Map<string, number>();

    recentTransactions
      .filter(tx => tx?.type === form.type && tx?.categoryId)
      .forEach(tx => {
        usage.set(tx.categoryId as string, (usage.get(tx.categoryId as string) || 0) + 1);
      });

    return usage;
  }, [form.type, recentTransactions]);
  const recommendedCategories = useMemo(
    () => cats
      .filter(cat => categoryUsage.has(cat.id))
      .sort((left, right) => (categoryUsage.get(right.id) || 0) - (categoryUsage.get(left.id) || 0))
      .slice(0, 4),
    [cats, categoryUsage],
  );
  const sortedCategories = useMemo(
    () => [...cats].sort((left, right) => {
      const usageDelta = (categoryUsage.get(right.id) || 0) - (categoryUsage.get(left.id) || 0);
      if (usageDelta !== 0) {
        return usageDelta;
      }

      return left.name.localeCompare(right.name, 'tr');
    }),
    [cats, categoryUsage],
  );
  const overviewChips = useMemo(() => {
    const chips = [
      {
        key: 'entry-date',
        label: form.entryDate,
      },
    ];

    if (selectedWallet) {
      chips.unshift({
        key: 'wallet',
        label: `${selectedWallet.isDebt ? '💳' : '🏦'} ${selectedWallet.name}`,
      });
    }

    return chips;
  }, [form.entryDate, selectedWallet]);
  const recentSuggestions = useMemo(() => {
    const seen = new Set<string>();

    return recentTransactions
      .filter(tx => tx?.type === form.type && typeof tx.title === 'string' && tx.title.trim())
      .filter(tx => {
        const key = `${tx.title}|${tx.categoryId || ''}|${tx.walletId || ''}`;
        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }, [form.type, recentTransactions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-slate-950/84 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: '100%', opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 340, mass: 0.9 }}
        role="dialog"
        aria-modal="true"
        aria-label={t('quickAdd.title')}
        className={`relative w-full max-w-md rounded-t-sheet sm:rounded-card border overflow-hidden ${
          isDark ? 'bg-slate-900/92 border-white/[0.08] shadow-modal-dark backdrop-blur-2xl' : 'bg-white/96 border-slate-200/70 shadow-modal-light backdrop-blur-xl'
        }`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -top-10 left-8 h-28 w-28 rounded-full blur-3xl ${form.type === 'income' ? 'bg-emerald-500/18' : 'bg-rose-500/14'}`} />
          <div className={`absolute bottom-0 right-0 h-36 w-36 rounded-full blur-3xl ${isDark ? 'bg-indigo-500/18' : 'bg-indigo-200/60'}`} />
          <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-white/[0.06] via-transparent to-slate-950/30' : 'bg-gradient-to-br from-white/90 via-transparent to-slate-100/70'}`} />
        </div>

        <div className="flex justify-center pt-3.5 pb-0 sm:hidden">
          <div className={`w-9 h-1 rounded-full ${isDark ? 'bg-white/12' : 'bg-slate-200'}`} />
        </div>

        <div className="relative max-h-[86dvh] sm:max-h-[90vh] overflow-y-auto p-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className={`font-meta text-[10px] font-semibold uppercase tracking-[0.32em] ${isDark ? 'text-indigo-300/70' : 'text-indigo-500/70'}`}>{t('quickAdd.title')}</p>
              <h2 className={`mt-2 font-display text-3xl font-extrabold tracking-[-0.03em] ${txt}`}>
                {form.type === 'income' ? t('quickAdd.addIncome') : t('quickAdd.addExpense')}
              </h2>
              <p className={`mt-2 text-sm ${txtSec}`}>
                {t('quickAdd.subtitle')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className={`flex gap-1 rounded-btn-lg border p-1 ${isDark ? 'border-white/[0.08] bg-slate-950/55' : 'border-slate-200 bg-slate-100/80'}`}>
                {[['expense', 'Gider'], ['income', 'Gelir']].map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm(previous => ({ ...previous, type }))}
                    aria-pressed={form.type === type}
                    className={`px-3 py-2 rounded-btn text-[10px] font-black uppercase tracking-[0.24em] transition-all ${buttonFocusCls} ${
                      form.type === type
                        ? type === 'income'
                          ? 'bg-emerald-500 text-white shadow-[0_10px_24px_rgba(16,185,129,0.28)]'
                          : 'bg-rose-500 text-white shadow-[0_10px_24px_rgba(244,63,94,0.24)]'
                        : isDark ? 'text-white/30 hover:text-white/65' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Hızlı işlem panelini kapat"
                className={`rounded-xl border p-2.5 transition-colors ${buttonFocusCls} ${isDark ? 'border-white/[0.08] bg-slate-950/55 hover:bg-slate-950/75 text-white/50' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600'}`}
              >
                <X size={17} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {overviewChips.map(chip => (
              <span key={chip.key} className={`rounded-pill px-3 py-1.5 font-meta text-[10px] font-semibold uppercase tracking-[0.24em] ${isDark ? 'bg-white/[0.05] text-white/60 border border-white/[0.07]' : 'bg-slate-100 text-slate-600 border border-slate-200/70'}`}>
                {chip.label}
              </span>
            ))}
          </div>

          <div className={`mb-7 rounded-card border px-4 py-5 text-center ${isDark ? 'border-white/[0.07] bg-slate-950/40' : 'border-slate-200/70 bg-white/80'}`}>
            <div className="flex items-start justify-center gap-1">
              <span className={`font-num text-2xl font-light mt-3 ${isDark ? 'text-white/25' : 'text-slate-300'}`}>
                {displayCurrency === 'USD' ? '$' : displayCurrency === 'EUR' ? '€' : '₺'}
              </span>
              <input
                type="number" placeholder="0" required value={form.amount}
                aria-label={t('common.amount')}
                onChange={event => {
                  if (submitError) onClearError();
                  setForm(previous => ({ ...previous, amount: event.target.value }));
                }}
                className={`font-num w-[200px] rounded-fab bg-transparent text-center text-7xl font-extrabold tracking-tight sm:text-8xl ${fieldFocusCls}`}
                style={{ color: form.type === 'income' ? '#34d399' : '#f87171' }}
                autoFocus
              />
            </div>
            <p className={`mt-3 font-meta text-[10px] font-semibold uppercase tracking-[0.28em] ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
              Para birimi Ayarlar ekranındaki seçime göre gelir.
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {quickAmounts.map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    if (submitError) onClearError();
                    setForm(previous => ({ ...previous, amount: String(amount) }));
                  }}
                  className={`rounded-full px-3 py-1.5 font-meta text-[10px] font-semibold uppercase tracking-[0.24em] border transition-all ${buttonFocusCls} ${isDark ? 'border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-white hover:border-white/20' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
                >
                  {displayCurrency === 'USD' ? '$' : displayCurrency === 'EUR' ? '€' : '₺'}{amount}
                </button>
              ))}
            </div>
          </div>

          <div className={`h-px mb-6 ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text" placeholder={t('common.title')} value={form.title}
              onChange={event => {
                if (submitError) onClearError();
                setForm(previous => ({ ...previous, title: event.target.value }));
              }}
              required
              className={`w-full px-4 py-3 rounded-btn-lg border text-sm font-medium transition-all ${inputCls} ${fieldFocusCls}`}
            />

            {recentSuggestions.length > 0 && (
              <div>
                <p className={`mb-2 font-meta text-[10px] font-semibold uppercase tracking-[0.24em] ${txtMuted}`}>
                  Son Kullanılanlar
                </p>
                <div className="flex flex-wrap gap-2">
                  {recentSuggestions.map(item => (
                    <button
                      key={`${item.title}-${item.categoryId || ''}-${item.walletId || ''}`}
                      type="button"
                      onClick={() => {
                        if (submitError) onClearError();
                        setForm(previous => ({
                          ...previous,
                          title: item.title || previous.title,
                          categoryId: item.categoryId || previous.categoryId,
                          walletId: item.walletId || previous.walletId,
                        }));
                      }}
                      className={`rounded-full px-3 py-1.5 font-meta text-[10px] font-semibold uppercase tracking-[0.2em] border transition-all ${buttonFocusCls} ${isDark ? 'border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-white hover:border-white/20' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recommendedCategories.length > 0 && (
              <div>
                <p className={`mb-2 font-meta text-[10px] font-semibold uppercase tracking-[0.24em] ${txtMuted}`}>
                  Sık Kategoriler
                </p>
                <div className="flex flex-wrap gap-2">
                  {recommendedCategories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (submitError) onClearError();
                        setForm(previous => ({ ...previous, categoryId: cat.id }));
                      }}
                      aria-pressed={form.categoryId === cat.id}
                      className={`flex items-center gap-2 rounded-full px-3 py-2 font-meta text-[10px] font-semibold uppercase tracking-[0.2em] border transition-all ${buttonFocusCls} ${form.categoryId === cat.id ? 'text-white border-transparent shadow-[0_10px_24px_rgba(99,102,241,0.22)]' : isDark ? 'border-white/[0.08] bg-white/[0.03] text-white/55 hover:text-white hover:border-white/20' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
                      style={form.categoryId === cat.id ? { backgroundColor: cat.color || '#6366f1' } : {}}
                    >
                      <span>{cat.emoji || '📌'}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <input
              type="text" placeholder={`${t('common.note')} (${t('common.optional')})`} value={form.note || ''}
              onChange={event => {
                if (submitError) onClearError();
                setForm(previous => ({ ...previous, note: event.target.value }));
              }}
              className={`w-full px-4 py-2.5 rounded-btn-lg border text-sm transition-all ${inputCls} ${fieldFocusCls} opacity-60 focus:opacity-100`}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <p className={`mb-2 font-meta text-[10px] font-semibold uppercase tracking-[0.24em] ${txtMuted}`}>Tarih</p>
                <input
                  type="date"
                  value={form.entryDate}
                  onChange={event => {
                    if (submitError) onClearError();
                    setForm(previous => ({ ...previous, entryDate: event.target.value }));
                  }}
                  className={`w-full px-4 py-3 rounded-btn-lg border text-sm font-medium transition-all ${inputCls} ${fieldFocusCls}`}
                />
              </label>

              <div className={`rounded-widget border px-4 py-3 ${isDark ? 'border-white/[0.07] bg-white/[0.03] text-white/65' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                <p className="font-meta text-[10px] font-semibold uppercase tracking-[0.24em] opacity-60">Akış</p>
                <p className="mt-2 text-sm font-black">{form.type === 'income' ? 'Gelir hanesine işlenecek' : 'Gider hanesine işlenecek'}</p>
                <p className="mt-1 text-xs opacity-60">Kaydettiğinde işlem geçmişi ve ana sayfa kartları anında güncellenir.</p>
              </div>
            </div>

            <div>
              <p className={`mb-2 font-meta text-[10px] font-semibold uppercase tracking-[0.24em] ${txtMuted}`}>Kategori</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {sortedCategories.map(cat => (
                  <button
                    key={cat.id} type="button"
                    onClick={() => {
                      if (submitError) onClearError();
                      setForm(previous => ({ ...previous, categoryId: cat.id }));
                    }}
                    aria-pressed={form.categoryId === cat.id}
                    className={`flex items-center gap-2 rounded-btn-lg px-3 py-3 text-xs font-semibold border transition-all ${buttonFocusCls} ${
                      form.categoryId === cat.id
                        ? 'border-transparent text-white shadow-btn-primary'
                        : isDark ? 'border-white/[0.08] text-white/35 hover:text-white/65' : 'border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                    style={form.categoryId === cat.id ? { backgroundColor: cat.color || '#6366f1' } : {}}
                  >
                    <span>{cat.emoji || '📌'}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {wallets.length > 0 && (
              <div>
                <p className={`mb-2 font-meta text-[10px] font-semibold uppercase tracking-[0.24em] ${txtMuted}`}>Ödeme Kaynağı</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (submitError) onClearError();
                      setForm(previous => ({ ...previous, walletId: '' }));
                    }}
                    aria-pressed={!form.walletId}
                    className={`rounded-xl px-3 py-2.5 text-xs font-semibold border transition-all ${buttonFocusCls} ${
                      !form.walletId
                        ? `${activeColor.bg} text-white border-transparent shadow-[0_10px_24px_rgba(99,102,241,0.22)]`
                        : isDark ? 'border-white/[0.08] text-white/35' : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    Belirtilmemiş
                  </button>
                  {wallets.map((wallet, index) => (
                    <button
                      key={`${wallet.name}-${index}`} type="button"
                      onClick={() => {
                        if (submitError) onClearError();
                        setForm(previous => ({ ...previous, walletId: wallet.name }));
                      }}
                      aria-pressed={form.walletId === wallet.name}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold border transition-all ${buttonFocusCls} ${
                        form.walletId === wallet.name
                          ? (wallet.isDebt ? 'bg-rose-500 text-white border-transparent' : `${activeColor.bg} text-white border-transparent`)
                          : isDark ? 'border-white/[0.08] text-white/35' : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      {wallet.isDebt ? '💳' : '🏦'} {wallet.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {submitError && (
              <p className="text-xs font-semibold text-rose-400" role="alert">
                {submitError}
              </p>
            )}

            <div className={`sticky bottom-0 pt-4 ${isDark ? 'bg-gradient-to-t from-slate-900 via-slate-900 to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className={`w-full rounded-btn-lg py-4 text-sm font-semibold uppercase tracking-[0.4em] text-white transition-all ${buttonFocusCls} ${activeColor.bg} ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 active:scale-[0.97]'}`}
                style={{ boxShadow: `0 14px 32px ${activeColor.hex}40` }}
              >
                {isSubmitting ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default QuickAddSheet;