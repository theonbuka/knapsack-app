import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Wallet, Landmark, Trash2, X, TrendingUp, TrendingDown,
  CreditCard, Edit3, Calculator, AlertTriangle, ChevronDown, ChevronUp,
  DollarSign, Euro, Coins, Banknote, Crown,
} from 'lucide-react';
import { MetricCard, PageHeader, PageShell, SectionCard } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { UNIT_LABELS } from '../utils/constants';
import { convertFromTRY, getPreferredInputCurrency, normalizeCurrencySymbol } from '../utils/currency';
import type { Wallet as WalletType, UserPrefs } from '../types';

interface AccentColor {
  bg: string;
}

interface LiveRates {
  USD?: number;
  EUR?: number;
  GOLD?: number;
}

interface LoanFormState {
  name: string;
  balance: string;
  type: string;
  iconType: string;
  isDebt: boolean;
  months: string;
  interestRate: string;
  installmentAmount: string;
  dueDay: number | string;
  paidMonths: number | string;
}

interface CreditCardFormState {
  name: string;
  balance: string;
  type: string;
  iconType: string;
  isDebt: boolean;
  cardLimit: string;
  dueDay: number | string;
  kmhLimit: string;
}

interface AssetFormState {
  name: string;
  balance: string;
  type: string;
  iconType: string;
  isDebt: boolean;
}

interface LoanCalcModalProps {
  isDark: boolean;
  inputCls: string;
  onClose: () => void;
  onSubmit: (wallet: WalletType) => void;
  defaultCurrency: string;
  initialWallet?: WalletType | null;
  title: string;
  submitLabel: string;
}

interface CreditCardModalProps {
  isDark: boolean;
  color: AccentColor;
  inputCls: string;
  onClose: () => void;
  onSubmit: (wallet: WalletType) => void;
  defaultCurrency: string;
  initialWallet?: WalletType | null;
  title: string;
  submitLabel: string;
}

interface AssetModalProps {
  isDark: boolean;
  color: AccentColor;
  inputCls: string;
  onClose: () => void;
  onSubmit: (wallet: WalletType) => void;
  defaultCurrency: string;
  initialWallet?: WalletType | null;
  title: string;
  submitLabel: string;
  availableAssetTypes?: string[];
  availableCurrencyTypes?: string[];
  helperText?: string;
}

interface AssetsProps {
  mode?: AssetsMode;
  wallets?: WalletType[];
  isDark: boolean;
  color: AccentColor;
  liveRates?: LiveRates;
  prefs?: UserPrefs;
  addWallet?: (wallet: WalletType) => void;
  updateWallet?: (index: number, wallet: WalletType) => void;
  removeWallet?: (index: number) => void;
}

/* ─── helpers ─────────────────────────────────────────────────────────── */
// PMT — standart kredi taksit formülü
function calcPMT(principal: number, monthlyRatePct: number, months: number) {
  if (!principal || !months) return 0;
  const r = monthlyRatePct / 100;
  if (r === 0) return principal / months;
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

const ASSET_TYPES = ['Vadesiz Hesap', 'Vadeli Hesap', 'Nakit', 'Altın Hesabı', 'Dolar Hesabı', 'Euro Hesabı', 'Yatırım'];
const CREDIT_TYPES = ['Kredi Kartı', 'KMH', 'Kredi Kartı + KMH'];
const LOAN_TYPES = ['Taksitli Kredi', 'Kredi / Borç', 'Taksit'];
const ASSET_CURRENCY_TYPES = ['₺', 'USD', 'EUR', 'GOLD'];
const ENTRY_CURRENCY_TYPES = ['₺', 'USD', 'EUR'];

function createAssetForm(defaultCurrency = '₺'): WalletType {
  return { name: '', balance: '', type: 'Nakit', iconType: defaultCurrency, isDebt: false };
}

function createCreditCardForm(defaultCurrency = '₺'): WalletType {
  return {
    name: '',
    balance: '',
    type: 'Kredi Kartı',
    iconType: defaultCurrency,
    isDebt: true,
    cardLimit: '',
    dueDay: 1,
    kmhLimit: '',
  };
}

function createLoanForm(defaultCurrency = '₺'): WalletType {
  return {
    name: '',
    balance: '',
    type: 'Taksitli Kredi',
    iconType: defaultCurrency,
    isDebt: true,
    months: '',
    interestRate: '',
    installmentAmount: '',
    dueDay: 1,
    paidMonths: 0,
  };
}

function toTRYValue(amount: string | number, currencyType: string, rates: { USD: number; EUR: number; GOLD: number }) {
  const numericAmount = parseFloat(String(amount || 0));
  if (currencyType === 'USD') return numericAmount * rates.USD;
  if (currencyType === 'EUR') return numericAmount * rates.EUR;
  if (currencyType === 'GOLD') return numericAmount * rates.GOLD;
  return numericAmount;
}

function formatWalletAmount(amount: string | number, currencyType: string, maximumFractionDigits = 0) {
  const numericAmount = parseFloat(String(amount || 0));
  const unitLabel = (UNIT_LABELS as Record<string, string>)[currencyType] || currencyType || '₺';
  const formattedValue = numericAmount.toLocaleString('tr-TR', { maximumFractionDigits });

  if (currencyType === 'USD' || currencyType === 'EUR' || currencyType === '₺') {
    return `${unitLabel}${formattedValue}`;
  }

  return `${formattedValue} ${unitLabel}`;
}

function getWalletVisual(wallet: WalletType) {
  const descriptor = `${wallet.name || ''} ${wallet.type || ''}`.toLocaleLowerCase('tr-TR');

  if (wallet.isDebt) {
    if (LOAN_TYPES.includes(wallet.type)) {
      return {
        label: 'Kredi Hesabı',
        caption: 'Taksit planı ve kalan borç',
        Icon: Calculator,
        gradient: 'from-rose-500 via-red-500 to-orange-500',
        darkSurface: 'from-rose-500/20 via-rose-500/5 to-transparent',
        lightSurface: 'from-rose-100 via-white to-white',
        chipClass: 'bg-rose-500/12 text-rose-400',
      };
    }

    return {
      label: 'Kart / KMH',
      caption: 'Limit ve kullanım özeti',
      Icon: CreditCard,
      gradient: 'from-violet-500 via-fuchsia-500 to-rose-500',
      darkSurface: 'from-violet-500/18 via-fuchsia-500/8 to-transparent',
      lightSurface: 'from-violet-100 via-white to-white',
      chipClass: 'bg-violet-500/12 text-violet-400',
    };
  }

  if (wallet.iconType === 'GOLD' || descriptor.includes('altın')) {
    return {
      label: 'Altın Hesabı',
      caption: 'Gram bazlı birikim',
      Icon: Coins,
      gradient: 'from-amber-400 via-yellow-400 to-orange-400',
      darkSurface: 'from-amber-500/18 via-yellow-500/8 to-transparent',
      lightSurface: 'from-amber-100 via-white to-white',
      chipClass: 'bg-amber-500/12 text-amber-500',
    };
  }

  if (wallet.iconType === 'USD' || descriptor.includes('dolar')) {
    return {
      label: 'Dolar Hesabı',
      caption: 'USD bakiyesi',
      Icon: DollarSign,
      gradient: 'from-emerald-500 via-green-400 to-lime-400',
      darkSurface: 'from-emerald-500/18 via-emerald-500/8 to-transparent',
      lightSurface: 'from-emerald-100 via-white to-white',
      chipClass: 'bg-emerald-500/12 text-emerald-500',
    };
  }

  if (wallet.iconType === 'EUR' || descriptor.includes('euro')) {
    return {
      label: 'Euro Hesabı',
      caption: 'EUR bakiyesi',
      Icon: Euro,
      gradient: 'from-sky-500 via-cyan-400 to-blue-500',
      darkSurface: 'from-sky-500/18 via-sky-500/8 to-transparent',
      lightSurface: 'from-sky-100 via-white to-white',
      chipClass: 'bg-sky-500/12 text-sky-500',
    };
  }

  if (wallet.type === 'Banka' || descriptor.includes('vadesiz')) {
    return {
      label: 'Vadesiz Hesap',
      caption: 'Banka bakiyesi',
      Icon: Landmark,
      gradient: 'from-indigo-500 via-blue-500 to-sky-400',
      darkSurface: 'from-indigo-500/18 via-indigo-500/8 to-transparent',
      lightSurface: 'from-indigo-100 via-white to-white',
      chipClass: 'bg-indigo-500/12 text-indigo-500',
    };
  }

  if (wallet.type === 'Nakit' || descriptor.includes('nakit')) {
    return {
      label: 'Nakit',
      caption: 'Anında kullanılabilir bakiye',
      Icon: Banknote,
      gradient: 'from-slate-500 via-slate-400 to-stone-300',
      darkSurface: 'from-slate-500/18 via-slate-500/8 to-transparent',
      lightSurface: 'from-slate-100 via-white to-white',
      chipClass: 'bg-slate-500/12 text-slate-500',
    };
  }

  return {
    label: 'Birikim Hesabı',
    caption: 'Manuel eklenen varlık',
    Icon: Wallet,
    gradient: 'from-indigo-500 via-violet-500 to-fuchsia-500',
    darkSurface: 'from-violet-500/18 via-violet-500/8 to-transparent',
    lightSurface: 'from-violet-100 via-white to-white',
    chipClass: 'bg-violet-500/12 text-violet-500',
  };
}

/* ─── WalletCard ────────────────────────────────────────────────────────── */
function WalletCard({ wallet, globalIdx, isDark, color: _color, liveRates, displayCurrency, onEdit, onRemove }: {
  wallet: WalletType;
  globalIdx: number;
  isDark: boolean;
  color: AccentColor;
  liveRates?: LiveRates;
  displayCurrency: string;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const rates = { USD: 33, EUR: 35, GOLD: 3185, ...(liveRates || {}) };
  const val = parseFloat(String(wallet.balance || 0));
  const cardLimit = parseFloat(String(wallet.cardLimit || 0));
  const kmhLimit = parseFloat(String(wallet.kmhLimit || 0));
  const totalCreditLimit = cardLimit + kmhLimit;
  const previewLimit = totalCreditLimit > 0 ? totalCreditLimit : cardLimit;
  const usagePct = previewLimit > 0 ? Math.min((val / previewLimit) * 100, 100) : 0;
  const availableLimit = previewLimit > 0 ? Math.max(0, previewLimit - val) : 0;

  const isDebt = wallet.isDebt;
  const isCC = CREDIT_TYPES.includes(wallet.type);
  const isLoan = LOAN_TYPES.includes(wallet.type);
  const visual = getWalletVisual(wallet);
  const AccentIcon = visual.Icon;
  const baseValueTRY = toTRYValue(val, wallet.iconType, rates);
  const displayEquivalent = convertFromTRY(baseValueTRY, displayCurrency, rates);
  const showDisplayEquivalent = wallet.iconType === 'GOLD' || normalizeCurrencySymbol(wallet.iconType) !== displayCurrency;

  const monthlyPmt = isLoan && wallet.months && wallet.interestRate != null
    ? (parseFloat(String(wallet.installmentAmount || 0)) > 0
      ? parseFloat(String(wallet.installmentAmount || 0))
      : calcPMT(val, parseFloat(String(wallet.interestRate)), parseInt(String(wallet.months), 10)))
    : 0;

  const totalCost = monthlyPmt * parseInt(String(wallet.months || 0), 10);
  const totalInterest = totalCost - val;
  const totalInstallments = parseInt(String(wallet.months || 0), 10);
  const paidInstallments = parseInt(String(wallet.paidMonths || 0), 10);
  const remaining = isLoan ? Math.max(0, totalInstallments - paidInstallments) : 0;
  const loanProgressPct = totalInstallments > 0 ? Math.min(100, (paidInstallments / totalInstallments) * 100) : 0;

  return (
    <motion.div layout whileHover={{ y: -4 }} className={`rounded-[2.5rem] border relative group overflow-hidden ${isDark ? 'bg-slate-900/72 border-white/10 shadow-pack-card backdrop-blur-xl' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${isDark ? visual.darkSurface : visual.lightSurface}`} />
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${visual.gradient}`} />

      <div className="relative p-7">
        {/* top row */}
        <div className="flex justify-between items-start mb-6">
          <div className={`h-14 w-14 rounded-[1.35rem] bg-gradient-to-br ${visual.gradient} text-white flex items-center justify-center shadow-lg shadow-black/10`}>
            <AccentIcon size={24}/>
          </div>
          <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {(isCC || isLoan) && (
              <button onClick={() => setExpanded(p => !p)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                {expanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              </button>
            )}
            <button onClick={() => onEdit(globalIdx)}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
              <Edit3 size={13}/>
            </button>
            <button onClick={() => onRemove(globalIdx)}
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 transition-colors">
              <Trash2 size={13}/>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${visual.chipClass}`}>{visual.label}</span>
          <span className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${txt}`}>{wallet.type}</span>
        </div>
        <h3 className={`text-lg font-bold mb-2 ${txt}`}>{wallet.name}</h3>
        <p className={`text-xs opacity-50 mb-4 ${txt}`}>{visual.caption}</p>

        {/* balance */}
        <p className={`text-3xl font-black tracking-tight ${isDebt ? 'text-rose-500' : txt}`}>
          {isDebt ? '-' : ''}{formatWalletAmount(val, wallet.iconType)}
        </p>
        {showDisplayEquivalent && (
          <div className="flex items-center gap-1.5 mt-1">
            {isDebt ? <TrendingDown size={11} className="text-rose-400"/> : <TrendingUp size={11} className="text-indigo-400"/>}
            <p className={`text-xs font-black opacity-60 ${isDebt ? 'text-rose-400' : 'text-indigo-400'}`}>
              {isDebt ? '-' : '≈'} {displayCurrency}{displayEquivalent.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </p>
          </div>
        )}

        {!isDebt && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className={`rounded-2xl border px-3 py-3 ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-white/80 border-slate-200/80'}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest opacity-30 mb-1 ${txt}`}>Görüntülenen</p>
              <p className={`text-sm font-black ${txt}`}>{showDisplayEquivalent ? `${displayCurrency}${displayEquivalent.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}` : formatWalletAmount(val, wallet.iconType)}</p>
            </div>
            <div className={`rounded-2xl border px-3 py-3 ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-white/80 border-slate-200/80'}`}>
              <p className={`text-[9px] font-black uppercase tracking-widest opacity-30 mb-1 ${txt}`}>Birim</p>
              <p className={`text-sm font-black ${txt}`}>{wallet.iconType === 'GOLD' ? 'Gram altın' : (UNIT_LABELS as Record<string, string>)[wallet.iconType] || wallet.iconType}</p>
            </div>
          </div>
        )}

        {/* credit card quick info */}
        {isCC && previewLimit > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className={`opacity-40 font-black uppercase tracking-wider ${txt}`}>Kullanım</span>
              <span className="font-black text-rose-400">%{Math.round(usagePct)}</span>
            </div>
            <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              <motion.div initial={{ width: 0 }}
                animate={{ width: `${usagePct}%` }}
                className={`h-full rounded-full ${usagePct > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`}/>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className={`rounded-2xl border px-3 py-3 ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-white/80 border-slate-200/80'}`}>
                <p className={`text-[9px] font-black uppercase tracking-widest opacity-30 mb-1 ${txt}`}>Toplam Limit</p>
                <p className={`text-sm font-black ${txt}`}>{formatWalletAmount(previewLimit, wallet.iconType)}</p>
              </div>
              <div className={`rounded-2xl border px-3 py-3 ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-white/80 border-slate-200/80'}`}>
                <p className={`text-[9px] font-black uppercase tracking-widest opacity-30 mb-1 ${txt}`}>Kullanılabilir</p>
                <p className="text-sm font-black text-emerald-500">{formatWalletAmount(availableLimit, wallet.iconType)}</p>
              </div>
            </div>
          </div>
        )}

        {/* loan quick info */}
        {isLoan && monthlyPmt > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/10">
              <p className="text-sm font-black text-rose-400">
                {formatWalletAmount(monthlyPmt, wallet.iconType)} <span className="text-xs opacity-60">/ay</span>
              </p>
              <p className={`text-[10px] opacity-40 ${txt}`}>Aylık ödeme</p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/10">
              <p className={`text-sm font-black ${txt}`}>{remaining} taksit</p>
              <p className={`text-[10px] opacity-40 ${txt}`}>Kalan plan</p>
            </div>
            <div className="col-span-2 mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span className={`opacity-40 font-black uppercase tracking-wider ${txt}`}>Ödeme İlerlemesi</span>
                <span className="font-black text-rose-400">%{Math.round(loanProgressPct)}</span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <motion.div initial={{ width: 0 }}
                  animate={{ width: `${loanProgressPct}%` }}
                  className="h-full rounded-full bg-rose-500"/>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* expanded detail panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className={`border-t px-7 py-5 space-y-2 ${isDark ? 'border-white/10 bg-slate-950/45' : 'border-slate-100 bg-slate-50/50'}`}>
            {isCC && (
              <>
                {cardLimit > 0 && <Row label="Kart Limiti" val={formatWalletAmount(cardLimit, wallet.iconType)} txt={txt}/>}
                {(wallet.dueDay || 0) > 0 && <Row label="Son Ödeme Günü" val={`Her ay ${wallet.dueDay}. günü`} txt={txt}/>}
                {kmhLimit > 0 && <Row label="KMH Limiti" val={formatWalletAmount(kmhLimit, wallet.iconType)} txt={txt}/>}
                {cardLimit > 0 && <Row label="Kalan Limit" val={formatWalletAmount(Math.max(0, cardLimit - val), wallet.iconType)} txt={txt} highlight="text-emerald-500"/>}
              </>
            )}
            {isLoan && (
              <>
                <Row label="Faiz Oranı (aylık)" val={`%${wallet.interestRate}`} txt={txt}/>
                <Row label="Toplam Taksit" val={`${wallet.months} ay`} txt={txt}/>
                <Row label="Ödeme Günü" val={wallet.dueDay ? `Her ay ${wallet.dueDay}. günü` : '-'} txt={txt}/>
                <Row label="Ödenen Taksit" val={`${paidInstallments} ay`} txt={txt}/>
                <Row label="Kalan Taksit" val={`${remaining} ay`} txt={txt}/>
                <Row label="Aylık Taksit" val={formatWalletAmount(monthlyPmt, wallet.iconType, 2)} txt={txt} highlight="text-rose-400"/>
                <Row label="Toplam Ödenecek" val={formatWalletAmount(totalCost, wallet.iconType)} txt={txt}/>
                <Row label="Toplam Faiz" val={formatWalletAmount(totalInterest, wallet.iconType)} txt={txt} highlight="text-rose-400"/>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Row({ label, val, txt, highlight }: { label: string; val: string; txt: string; highlight?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-[11px] font-black uppercase tracking-widest opacity-30 ${txt}`}>{label}</span>
      <span className={`text-sm font-black ${highlight || txt}`}>{val}</span>
    </div>
  );
}

/* ─── LoanCalcModal ─────────────────────────────────────────────────────── */
function LoanCalcModal({ isDark, inputCls, onClose, onSubmit, defaultCurrency, initialWallet, title, submitLabel }: LoanCalcModalProps) {
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const [form, setForm] = useState<LoanFormState>(() => initialWallet ? {
    name: initialWallet.name || '',
    balance: String(initialWallet.balance || ''),
    type: initialWallet.type || 'Taksitli Kredi',
    iconType: initialWallet.iconType || defaultCurrency,
    isDebt: true,
    months: String(initialWallet.months || ''),
    interestRate: String(initialWallet.interestRate || ''),
    installmentAmount: String(initialWallet.installmentAmount || ''),
    dueDay: initialWallet.dueDay || 1,
    paidMonths: initialWallet.paidMonths || 0,
  } : createLoanForm(defaultCurrency));
  const set = <K extends keyof LoanFormState>(k: K, v: LoanFormState[K]) => setForm(p => ({ ...p, [k]: v }));
  const unitLabel = (UNIT_LABELS as Record<string, string>)[form.iconType] || form.iconType;

  const monthlyRate = parseFloat(String(form.interestRate || 0)) || 0;
  const months = parseInt(String(form.months || 0), 10) || 0;
  const principal = parseFloat(String(form.balance || 0)) || 0;
  const manualInstallment = parseFloat(String(form.installmentAmount || 0)) || 0;
  const pmt = manualInstallment > 0 ? manualInstallment : calcPMT(principal, monthlyRate, months);
  const totalCost = pmt * months;
  const totalInt = totalCost - principal;
  const annualEff = monthlyRate > 0 ? (Math.pow(1 + monthlyRate / 100, 12) - 1) * 100 : 0;
  const paidInstallments = parseInt(String(form.paidMonths || 0), 10) || 0;
  const progressPct = months > 0 ? Math.min(100, (paidInstallments / months) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className={`w-full max-w-lg rounded-t-[2.25rem] sm:rounded-[3rem] border ${isDark ? 'bg-slate-900/95 border-white/10 shadow-pack-card backdrop-blur-2xl' : 'bg-white border-slate-100 shadow-[0_20px_50px_rgb(15,23,42,0.08)]'}`}>
        <div className="max-h-[86dvh] sm:max-h-[92vh] overflow-y-auto p-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="flex justify-between items-center mb-7">
            <div>
              <h2 className={`text-2xl font-black ${txt}`}>{title}</h2>
              <p className={`text-xs opacity-40 mt-1 ${txt}`}>Faiz ve taksit hesaplama</p>
            </div>
            <button onClick={onClose} className="opacity-40 hover:opacity-100"><X size={20} className={txt}/></button>
          </div>

          <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, balance: principal, months, interestRate: monthlyRate, installmentAmount: manualInstallment, dueDay: parseInt(String(form.dueDay || 1), 10), paidMonths: paidInstallments, isDebt: true }); }} className="space-y-4">
            <input type="text" placeholder="Kredi / Borç adı" value={form.name}
              onChange={e => set('name', e.target.value)} required
              className={`w-full px-5 py-4 rounded-2xl border text-sm font-medium outline-none ${inputCls}`}/>

            {/* Tür seç */}
            <div className="flex gap-2">
              {LOAN_TYPES.map(t => (
                <button key={t} type="button" onClick={() => set('type', t)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wide border transition-all ${form.type === t ? 'bg-rose-500 text-white border-transparent' : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              {ENTRY_CURRENCY_TYPES.map(currencyType => (
                <button key={currencyType} type="button" onClick={() => set('iconType', currencyType)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black border transition-all ${form.iconType === currencyType ? 'bg-rose-500 text-white border-transparent' : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                  {currencyType}
                </button>
              ))}
            </div>

            {/* Ana borç */}
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Toplam Borç Tutarı ({unitLabel})</p>
              <input type="number" placeholder="100000" value={form.balance}
                onChange={e => set('balance', e.target.value)} required min="1" step="any"
                className={`w-full px-5 py-4 rounded-2xl border text-lg font-black outline-none ${inputCls}`}/>
            </div>

            {/* Faiz + Ay */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Aylık Faiz Oranı (%)</p>
                <div className="relative">
                  <input type="number" placeholder="3.50" step="0.01" min="0" max="100" value={form.interestRate}
                    onChange={e => set('interestRate', e.target.value)} required
                    className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none pr-10 ${inputCls}`}/>
                  <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm opacity-40 font-black ${txt}`}>%</span>
                </div>
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Taksit Sayısı (Ay)</p>
                <input type="number" placeholder="36" min="1" max="360" value={form.months}
                  onChange={e => set('months', e.target.value)} required
                  className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Aylık Taksit (Manuel)</p>
                <input type="number" placeholder="Otomatik hesap için boş bırak" min="0" step="any" value={form.installmentAmount}
                  onChange={e => set('installmentAmount', e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Ödeme Günü</p>
                <input type="number" min="1" max="31" placeholder="1" value={form.dueDay}
                  onChange={e => set('dueDay', e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
              </div>
            </div>

            {/* Ödenmiş taksit */}
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Ödenmiş Taksit Sayısı</p>
              <input type="number" placeholder="0" min="0" max={months} value={form.paidMonths || 0}
                onChange={e => set('paidMonths', e.target.value)}
                className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
            </div>

            {months > 0 && (
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`opacity-40 font-black uppercase tracking-wider ${txt}`}>Taksit İlerlemesi</span>
                  <span className="font-black text-rose-400">%{Math.round(progressPct)}</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                  <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${progressPct}%` }}/>
                </div>
              </div>
            )}

            {/* LIVE CALCULATOR */}
            {principal > 0 && months > 0 && monthlyRate > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-5 space-y-3 ${isDark ? 'bg-rose-500/5 border-rose-500/15' : 'bg-rose-50 border-rose-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Calculator size={16} className="text-rose-400"/>
                  <span className="text-sm font-black text-rose-400">Hesaplama Sonucu</span>
                </div>
                <Row label="Aylık Taksit" val={formatWalletAmount(pmt, form.iconType, 2)} txt={txt} highlight="text-rose-500"/>
                <Row label="Toplam Ödenecek" val={formatWalletAmount(totalCost, form.iconType)} txt={txt}/>
                <Row label="Toplam Faiz Maliyeti" val={formatWalletAmount(totalInt, form.iconType)} txt={txt} highlight="text-rose-400"/>
                <Row label="Yıllık Efektif Faiz" val={`%${annualEff.toFixed(2)}`} txt={txt}/>
                {Number(form.paidMonths || 0) > 0 && <Row label="Kalan Borç" val={formatWalletAmount(Math.max(0, pmt * (months - parseInt(String(form.paidMonths || 0), 10))), form.iconType)} txt={txt} highlight="text-rose-400"/>}
              </motion.div>
            )}

            {principal > 0 && months > 0 && monthlyRate === 0 && (
              <div className={`p-4 rounded-2xl flex items-center gap-3 ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                <AlertTriangle size={16} className="text-amber-400 flex-shrink-0"/>
                <p className="text-xs text-amber-400 font-black">Faiz oranı 0 — faizsiz eşit taksit hesaplanıyor.</p>
              </div>
            )}

            <div className={`sticky bottom-0 pt-4 ${isDark ? 'bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f] to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
              <button type="submit" className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white bg-rose-500 hover:bg-rose-600 transition-colors">
                {submitLabel}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── CreditCardModal ───────────────────────────────────────────────────── */
function CreditCardModal({ isDark, color, inputCls, onClose, onSubmit, defaultCurrency, initialWallet, title, submitLabel }: CreditCardModalProps) {
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const [form, setForm] = useState<CreditCardFormState>(() => initialWallet ? {
    name: initialWallet.name || '',
    balance: String(initialWallet.balance || ''),
    type: initialWallet.type || 'Kredi Kartı',
    iconType: initialWallet.iconType || defaultCurrency,
    isDebt: true,
    cardLimit: String(initialWallet.cardLimit || ''),
    dueDay: initialWallet.dueDay || 1,
    kmhLimit: String(initialWallet.kmhLimit || ''),
  } : createCreditCardForm(defaultCurrency));
  const set = <K extends keyof CreditCardFormState>(k: K, v: CreditCardFormState[K]) => setForm(p => ({ ...p, [k]: v }));
  const debt = parseFloat(String(form.balance || 0)) || 0;
  const limit = parseFloat(String(form.cardLimit || 0)) || 0;
  const usagePct = limit > 0 ? Math.min((debt / limit) * 100, 100) : 0;
  const unitLabel = (UNIT_LABELS as Record<string, string>)[form.iconType] || form.iconType;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className={`w-full max-w-lg rounded-t-[2.25rem] sm:rounded-[3rem] border ${isDark ? 'bg-slate-900/95 border-white/10 shadow-pack-card backdrop-blur-2xl' : 'bg-white border-slate-100 shadow-[0_20px_50px_rgb(15,23,42,0.08)]'}`}>
        <div className="max-h-[86dvh] sm:max-h-[92vh] overflow-y-auto p-6 sm:p-8 space-y-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className={`text-2xl font-black ${txt}`}>{title}</h2>
              <p className={`text-xs opacity-40 mt-1 ${txt}`}>Limit, borç ve ödeme bilgileri</p>
            </div>
            <button onClick={onClose} className="opacity-40 hover:opacity-100"><X size={20} className={txt}/></button>
          </div>

          {/* card type */}
          <div className="flex gap-2">
            {CREDIT_TYPES.map(t => (
              <button key={t} type="button" onClick={() => set('type', t)}
                className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wide border transition-all ${form.type === t ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap">
            {ENTRY_CURRENCY_TYPES.map(currencyType => (
              <button key={currencyType} type="button" onClick={() => set('iconType', currencyType)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black border transition-all ${form.iconType === currencyType ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                {currencyType}
              </button>
            ))}
          </div>

          <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, balance: debt, cardLimit: limit, kmhLimit: parseFloat(String(form.kmhLimit || 0)) || 0, dueDay: parseInt(String(form.dueDay || 1), 10), isDebt: true }); }} className="space-y-4">
            <input type="text" placeholder="Kart adı (Vakıfbank Kredi Kartı...)" value={form.name}
              onChange={e => set('name', e.target.value)} required
              className={`w-full px-5 py-4 rounded-2xl border text-sm font-medium outline-none ${inputCls}`}/>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Mevcut Borç ({unitLabel})</p>
                <input type="number" placeholder="0" min="0" step="any" value={form.balance}
                  onChange={e => set('balance', e.target.value)} required
                  className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Kart Limiti ({unitLabel})</p>
                <input type="number" placeholder="50000" min="0" step="any" value={form.cardLimit}
                  onChange={e => set('cardLimit', e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
              </div>
            </div>

            {(form.type === 'KMH' || form.type === 'Kredi Kartı + KMH') && (
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>KMH Limiti ({unitLabel})</p>
                <input type="number" placeholder="10000" min="0" step="any" value={form.kmhLimit}
                  onChange={e => set('kmhLimit', e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
              </div>
            )}

            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 ${txt}`}>Son Ödeme / Ekstre Günü</p>
              <input type="number" min="1" max="31" placeholder="1" value={form.dueDay}
                onChange={e => set('dueDay', e.target.value)}
                className={`w-32 px-5 py-4 rounded-2xl border text-sm font-black text-center outline-none ${inputCls}`}/>
            </div>

            {/* live usage bar */}
            {debt > 0 && limit > 0 && (
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-rose-500/5 border-rose-500/15' : 'bg-rose-50 border-rose-200'}`}>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-black text-rose-400">Limit Kullanımı</span>
                  <span className={`text-xs font-black ${usagePct > 80 ? 'text-rose-500' : 'text-emerald-500'}`}>%{usagePct.toFixed(1)}</span>
                </div>
                <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${usagePct}%`, backgroundColor: usagePct > 80 ? '#f43f5e' : '#6366f1' }}/>
                </div>
                <div className="flex justify-between mt-2">
                  <span className={`text-[10px] opacity-40 ${txt}`}>Borç: {formatWalletAmount(debt, form.iconType)}</span>
                  <span className={`text-[10px] opacity-40 ${txt}`}>Kalan: {formatWalletAmount(Math.max(0, limit - debt), form.iconType)}</span>
                </div>
              </div>
            )}

            <div className={`sticky bottom-0 pt-4 ${isDark ? 'bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f] to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
              <button type="submit" className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white ${color.bg}`}>
                {submitLabel}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── AssetModal ────────────────────────────────────────────────────────── */
function AssetModal({
  isDark,
  color,
  inputCls,
  onClose,
  onSubmit,
  defaultCurrency,
  initialWallet,
  title,
  submitLabel,
  availableAssetTypes = ASSET_TYPES,
  availableCurrencyTypes = ASSET_CURRENCY_TYPES,
  helperText = '',
}: AssetModalProps) {
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const [form, setForm] = useState<AssetFormState>(() => initialWallet ? {
    name: initialWallet.name || '',
    balance: String(initialWallet.balance || ''),
    type: availableAssetTypes.includes(initialWallet.type) ? initialWallet.type : availableAssetTypes[0] || 'Nakit',
    iconType: initialWallet.iconType || defaultCurrency,
    isDebt: false,
  } : {
    ...createAssetForm(defaultCurrency),
    type: availableAssetTypes[0] || 'Nakit',
  });
  const set = <K extends keyof AssetFormState>(k: K, v: AssetFormState[K]) => setForm(p => ({ ...p, [k]: v }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        className={`w-full max-w-md rounded-t-[2.25rem] sm:rounded-[3rem] border ${isDark ? 'bg-slate-900/95 border-white/10 shadow-pack-card backdrop-blur-2xl' : 'bg-white border-slate-100 shadow-[0_20px_50px_rgb(15,23,42,0.08)]'}`}>
        <div className="max-h-[86dvh] sm:max-h-[92vh] overflow-y-auto p-6 sm:p-8 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
          <div className="flex justify-between items-center mb-7">
            <h2 className={`text-2xl font-black ${txt}`}>{title}</h2>
            <button onClick={onClose} className="opacity-40 hover:opacity-100"><X size={20} className={txt}/></button>
          </div>
          <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, balance: parseFloat(String(form.balance || 0)), isDebt: false }); }} className="space-y-4">
            <input type="text" placeholder="Hesap / Cüzdan adı" value={form.name}
              onChange={e => set('name', e.target.value)} required
              className={`w-full px-5 py-4 rounded-2xl border text-sm font-medium outline-none ${inputCls}`}/>
            <div className="flex gap-3">
              <input type="number" placeholder={form.iconType === 'GOLD' ? 'Gram miktarı' : 'Bakiye'} value={form.balance}
                onChange={e => set('balance', e.target.value)} required min="0" step="any"
                className={`flex-1 px-5 py-4 rounded-2xl border text-sm font-black outline-none ${inputCls}`}/>
              <div className="flex gap-1.5 flex-wrap">
                {availableCurrencyTypes.map((c: string) => (
                  <button key={c} type="button" onClick={() => set('iconType', c)}
                    className={`px-3 py-2 rounded-xl text-xs font-black border transition-all ${form.iconType === c ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                    {c === 'GOLD' ? 'gr' : c}
                  </button>
                ))}
              </div>
            </div>
            {form.iconType === 'GOLD' && <p className={`text-xs opacity-40 px-1 ${txt}`}>Gram cinsinden girin. TL karşılığı otomatik hesaplanır.</p>}
            <div className="flex gap-2 flex-wrap">
              {availableAssetTypes.map((t: string) => (
                <button key={t} type="button" onClick={() => set('type', t)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black border transition-all ${form.type === t ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
                  {t}
                </button>
              ))}
            </div>
            {helperText && <p className={`text-xs opacity-50 px-1 ${txt}`}>{helperText}</p>}
            <div className={`sticky bottom-0 pt-4 ${isDark ? 'bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f] to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
              <button type="submit" className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white ${color.bg}`}>
                {submitLabel}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Assets page ──────────────────────────────────────────────────────── */
type AssetsMode = 'all' | 'credit-cards' | 'loans';

function Assets({ mode: _mode = 'all', wallets = [], isDark, color, liveRates, prefs, addWallet = () => {}, updateWallet = () => {}, removeWallet = () => {} }: AssetsProps) {
  const { isPremium } = useAuth();
  const _navigate = useNavigate();
  const [editor, setEditor] = useState<{ type: 'asset' | 'cc' | 'loan'; walletIndex?: number } | null>(null);
  const cur = normalizeCurrencySymbol(prefs?.currency);
  const defaultCurrency = getPreferredInputCurrency(prefs?.currency);

  const rates = { USD: 33, EUR: 35, GOLD: 3185, ...(liveRates || {}) };

  const toTL = (w: WalletType) => {
    return toTRYValue(w.balance || 0, w.iconType, rates);
  };

  const assets = wallets.filter(w => !w.isDebt);
  const debts = wallets.filter(w => w.isDebt);
  const visibleAssets = assets;
  const modeDebts = debts;

  const totalAssets = visibleAssets.reduce((s, w) => s + toTL(w), 0);
  const totalDebts = modeDebts.reduce((s, w) => s + toTL(w), 0);
  const netWorth = totalAssets - totalDebts;
  const totalAssetsDisplay = convertFromTRY(totalAssets, cur, liveRates);
  const totalDebtsDisplay = convertFromTRY(totalDebts, cur, liveRates);
  const netWorthDisplay = convertFromTRY(Math.abs(netWorth), cur, liveRates);

  // Total monthly debt obligations
  const monthlyDebtLoad = modeDebts.reduce((s, w) => {
    if (LOAN_TYPES.includes(w.type) && w.months && w.interestRate != null) {
      return s + toTRYValue(calcPMT(parseFloat(String(w.balance || 0)), parseFloat(String(w.interestRate || 0)), parseInt(String(w.months || 0), 10)), w.iconType, rates);
    }
    return s;
  }, 0);
  const monthlyDebtLoadDisplay = convertFromTRY(monthlyDebtLoad, cur, liveRates);

  const handleSave = (form: WalletType) => {
    if (!form.name?.trim()) return;

    if (editor?.walletIndex != null) {
      updateWallet?.(editor.walletIndex, form);
    } else {
      addWallet?.(form);
    }

    setEditor(null);
  };

  const handleEdit = (idx: number) => {
    const wallet = wallets[idx];
    if (!wallet) return;

    if (CREDIT_TYPES.includes(wallet.type)) {
      setEditor({ type: 'cc', walletIndex: idx });
      return;
    }

    if (LOAN_TYPES.includes(wallet.type)) {
      setEditor({ type: 'loan', walletIndex: idx });
      return;
    }

    setEditor({ type: 'asset', walletIndex: idx });
  };

  const activeWallet = editor?.walletIndex != null ? wallets[editor.walletIndex] : null;

  const txt = isDark ? 'text-white' : 'text-slate-900';
  const cardBg = isDark ? 'bg-slate-900/48 border-white/10 shadow-pack-card backdrop-blur-xl' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
  const inputCls = isDark
    ? 'bg-slate-950/55 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-400/70 focus:bg-slate-950/70'
    : 'bg-white border-slate-100 text-slate-900 focus:border-indigo-300';

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageShell width="wide">
        <PageHeader
          isDark={isDark}
          title="Finans Hesapları"
          description="Kredi kartları, kredi/taksit ve varlık hesapları tek ekranda manuel yönetilir"
          className="mb-8"
          titleClassName={`font-display text-step-4 sm:text-6xl mb-2 ${txt}`}
          descriptionClassName={`text-[10px] font-semibold uppercase tracking-widest mb-8 ${isDark ? 'text-white/40' : 'text-slate-500'}`}
          eyebrowClassName="font-black tracking-[0.5em] opacity-60"
        />

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MetricCard
              isDark={isDark}
              label="Toplam Varlık"
              value={`+${cur}${totalAssetsDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
              labelClassName="text-emerald-400"
              valueClassName="text-xl font-black text-emerald-500"
              className={isDark ? 'bg-emerald-500/8 border-emerald-400/20 shadow-[0_20px_60px_rgba(16,185,129,0.12)]' : 'bg-emerald-50 border-emerald-200 shadow-[0_8px_30px_rgb(16,185,129,0.08)]'}
            />
            {isPremium ? (
              <MetricCard
                isDark={isDark}
                label="Toplam Borç"
                value={`-${cur}${totalDebtsDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                labelClassName="text-rose-400"
                valueClassName="text-xl font-black text-rose-500"
                className={isDark ? 'bg-rose-500/8 border-rose-400/20 shadow-[0_20px_60px_rgba(244,63,94,0.12)]' : 'bg-rose-50 border-rose-200 shadow-[0_8px_30px_rgb(244,63,94,0.08)]'}
              />
            ) : (
              <MetricCard
                isDark={isDark}
                label="Plan"
                value="Basic"
                valueClassName={`text-xl font-black ${txt}`}
                className={cardBg}
              />
            )}
            <MetricCard
              isDark={isDark}
              label="Net Değer"
              value={`${netWorth >= 0 ? '+' : '-'}${cur}${netWorthDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
              valueClassName={`text-xl font-black ${netWorth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
              className={cardBg}
            />
            {isPremium ? (
              <MetricCard
                isDark={isDark}
                label="Aylık Borç Yükü"
                value={`${cur}${monthlyDebtLoadDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                valueClassName="text-xl font-black text-rose-400"
                className={isDark ? 'bg-rose-500/8 border-rose-400/16 shadow-[0_20px_60px_rgba(244,63,94,0.10)]' : 'bg-slate-50 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}
              />
            ) : (
              <MetricCard
                isDark={isDark}
                label="Aylık Borç Yükü"
                value={`${cur}${monthlyDebtLoadDisplay.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`}
                valueClassName="text-xl font-black text-rose-400"
                className={isDark ? 'bg-rose-500/8 border-rose-400/16 shadow-[0_20px_60px_rgba(244,63,94,0.10)]' : 'bg-slate-50 border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}
              />
            )}
          </div>

          <SectionCard isDark={isDark} padding="lg" className={cardBg}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${txt}`}>Hesaplarım</h2>
            <p className={`text-[10px] uppercase tracking-widest opacity-30 font-black ${txt}`}>{visibleAssets.length} hesap ve birikim</p>
          </div>
          <button onClick={() => setEditor({ type: 'asset' })}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm text-white ${color.bg}`}>
            <Plus size={15}/> Yeni Hesap
          </button>
        </div>
        <p className={`mb-4 text-xs leading-6 ${isDark ? 'text-white/45' : 'text-slate-500'}`}>
          Vadesiz, vadeli, altın, dolar, euro ve diğer varlık tiplerini manuel ekleyebilirsin.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleAssets.map((w, i) => (
            <WalletCard key={i} wallet={w} globalIdx={wallets.indexOf(w)} isDark={isDark} color={color} liveRates={liveRates} displayCurrency={cur} onEdit={handleEdit} onRemove={removeWallet}/>
          ))}
          {visibleAssets.length === 0 && (
            <button onClick={() => setEditor({ type: 'asset' })}
              className={`p-10 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 min-h-[180px] transition-all ${isDark ? 'border-white/10 bg-slate-900/24 hover:border-white/30 text-white/30 hover:text-white' : 'border-slate-200 hover:border-indigo-400 text-slate-300 hover:text-indigo-500'}`}>
              <Plus size={32} strokeWidth={2.5}/><span className="text-xs font-black uppercase tracking-widest">Hesap Ekle</span>
            </button>
          )}
        </div>
          </SectionCard>

            <SectionCard isDark={isDark} padding="lg" className={cardBg}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-rose-500">Kredi, Kart ve Taksitler</h2>
              <p className={`text-[10px] uppercase tracking-widest opacity-30 font-black ${txt}`}>{modeDebts.length} kayıt</p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <button onClick={() => setEditor({ type: 'cc' })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs text-white bg-violet-500 hover:bg-violet-600 transition-colors whitespace-nowrap">
                <CreditCard size={14}/> Kart / KMH
              </button>
              <button onClick={() => setEditor({ type: 'loan' })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs text-white bg-rose-500 hover:bg-rose-600 transition-colors whitespace-nowrap">
                <Calculator size={14}/> Kredi / Taksit
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modeDebts.map((w, i) => (
              <WalletCard key={i} wallet={w} globalIdx={wallets.indexOf(w)} isDark={isDark} color={color} liveRates={liveRates} displayCurrency={cur} onEdit={handleEdit} onRemove={removeWallet}/>
            ))}
            {modeDebts.length === 0 && (
              <div className={`p-8 rounded-[2.5rem] border-2 border-dashed flex items-center justify-center gap-3 col-span-full ${isDark ? 'border-rose-500/20 text-rose-500/30' : 'border-rose-200 text-rose-300'}`}>
                <span className="text-xs font-black uppercase tracking-widest">Kredi kartı veya taksitli borcunu ekle</span>
              </div>
            )}
          </div>
            </SectionCard>
        </div>

      <AnimatePresence>
        {editor?.type === 'asset' && <AssetModal key={`asset-${editor.walletIndex ?? 'new'}`} isDark={isDark} color={color} inputCls={inputCls} defaultCurrency={defaultCurrency} initialWallet={activeWallet} title={activeWallet ? 'Varlığı Düzenle' : 'Yeni Varlık Ekle'} submitLabel={activeWallet ? 'Güncelle' : 'Ekle'} onClose={() => setEditor(null)} onSubmit={handleSave} availableAssetTypes={ASSET_TYPES} availableCurrencyTypes={ASSET_CURRENCY_TYPES} helperText='Vadesiz/vadeli, altın, dolar, euro ve diğer hesap tiplerini manuel ekleyebilirsin.'/>}
        {editor?.type === 'cc' && <CreditCardModal key={`cc-${editor.walletIndex ?? 'new'}`} isDark={isDark} color={color} inputCls={inputCls} defaultCurrency={defaultCurrency} initialWallet={activeWallet} title={activeWallet ? 'Borç Hesabını Düzenle' : 'Kredi Kartı / KMH Ekle'} submitLabel={activeWallet ? 'Güncelle' : 'Kartı Ekle'} onClose={() => setEditor(null)} onSubmit={handleSave}/>}
        {editor?.type === 'loan' && <LoanCalcModal key={`loan-${editor.walletIndex ?? 'new'}`} isDark={isDark} inputCls={inputCls} defaultCurrency={defaultCurrency} initialWallet={activeWallet} title={activeWallet ? 'Kredi / Borcu Düzenle' : 'Taksitli Kredi / Borç'} submitLabel={activeWallet ? 'Güncelle' : 'Kaydet'} onClose={() => setEditor(null)} onSubmit={handleSave}/>}
      </AnimatePresence>
      </PageShell>
    </motion.div>
  );
}

export default Assets;
