import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Upload, Trash2, Palette, DollarSign, Shield, LogOut, User, Tags, Plus, Check, Target, Edit3, ExternalLink, Crown, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageShell, SectionCard } from '../components/UI';
import { themeColors, customDB, PRESET_EMOJIS, PRESET_COLORS } from '../utils/constants';
import { APP_VERSION_LABEL } from '../utils/appVersion';
import { useAuth } from '../contexts/AuthContext';
import { clearLocalSyncStamp, getAllScopedDataKeys, getAuthStorageId, getCloudSyncAccountId } from '../utils/accountStorage';
import { deleteCloudSnapshot, isCloudSyncConfigured } from '../utils/cloudSync';
import { convertFromTRY, convertToTRY, normalizeCurrencySymbol } from '../utils/currency';
import { buildPremiumReportText } from '../utils/premiumInsights';
import { usePageMeta } from '../hooks/usePageMeta';

const CURRENCIES = ['₺', '$', '€'];
const BASIC_PLAN_MODULES = [
  'Gelir ve gider kaydı',
  'Kira ve abonelik takibi',
  'Vadesiz, USD, EUR ve altın hesapları',
];
const PREMIUM_PLAN_MODULES = [
  'Analytics tahmin masası',
  'Kredi kartı, KMH ve kredi yönetimi',
  'Premium brief ve gelişmiş dışa aktarma',
];

function EmojiPicker({ value, onChange, isDark }) {
  return (
    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
      {PRESET_EMOJIS.map(em => (
        <button key={em} type="button" onClick={() => onChange(em)}
          className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${value === em ? 'bg-indigo-600 ring-2 ring-indigo-400' : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>
          {em}
        </button>
      ))}
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map(c => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className={`w-8 h-8 rounded-full transition-all ${value === c ? 'ring-2 ring-offset-2 ring-offset-transparent scale-110' : 'opacity-70 hover:opacity-100'}`}
          style={{ backgroundColor: c, '--tw-ring-color': c }}/>
      ))}
    </div>
  );
}

function CategoryEditor({ cats, saveCats, isDark, color, displayCurrency, liveRates }) {
  const [editId, setEditId] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', emoji: '📌', color: '#6366f1', limit: '' });
  const [editData, setEditData] = useState({});

  const txt = isDark ? 'text-white' : 'text-slate-900';
  const inputCls = isDark
    ? 'bg-slate-950/55 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-400/70 focus:bg-slate-950/70'
    : 'bg-white border-slate-100 text-slate-900 focus:border-indigo-300';

  const limitPrecision = displayCurrency === '₺' ? 0 : 2;

  const toDisplayLimit = (limit) => {
    if (!limit) return '';

    const convertedLimit = convertFromTRY(limit, displayCurrency, liveRates);
    return String(Number(convertedLimit.toFixed(limitPrecision)));
  };

  const formatLimit = (limit) => {
    const convertedLimit = convertFromTRY(limit || 0, displayCurrency, liveRates);
    return `${displayCurrency}${convertedLimit.toLocaleString('tr-TR', { maximumFractionDigits: limitPrecision })}`;
  };

  const startEdit = (cat) => {
    setEditId(cat.id);
    setEditData({
      name: cat.name,
      emoji: cat.emoji || '📌',
      color: cat.color,
      limit: toDisplayLimit(cat.limit),
    });
  };

  const saveEdit = (id) => {
    const updated = cats.map(c => c.id === id ? {
      ...c,
      ...editData,
      limit: convertToTRY(editData.limit || 0, displayCurrency, liveRates),
    } : c);
    saveCats(updated);
    setEditId(null);
  };

  const deletecat = (id) => {
    saveCats(cats.filter(c => c.id !== id));
  };

  const addCat = () => {
    if (!newCat.name.trim()) return;
    const id = `cu${ Date.now()}`;
    saveCats([...cats, {
      ...newCat,
      id,
      limit: convertToTRY(newCat.limit || 0, displayCurrency, liveRates),
    }]);
    setNewCat({ name: '', emoji: '📌', color: '#6366f1', limit: '' });
    setShowNew(false);
  };

  return (
    <div className="space-y-3">
      {cats.map(cat => (
        <div key={cat.id}>
          {editId === cat.id ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-200'} space-y-3`}>
              <div className="flex gap-3">
                <input type="text" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none ${inputCls}`}/>
                <input type="number" step="any" value={editData.limit || ''} placeholder={`Bütçe limiti (${displayCurrency})`}
                  onChange={e => setEditData(p => ({ ...p, limit: e.target.value }))}
                  className={`w-28 px-3 py-2.5 rounded-xl border text-sm outline-none ${inputCls}`}/>
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${txt}`}>Emoji</p>
              <EmojiPicker value={editData.emoji} onChange={v => setEditData(p => ({ ...p, emoji: v }))} isDark={isDark}/>
              <p className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${txt}`}>Renk</p>
              <ColorPicker value={editData.color} onChange={v => setEditData(p => ({ ...p, color: v }))}/>
              <div className="flex gap-2 pt-1">
                <button onClick={() => saveEdit(cat.id)}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs text-white ${color.bg}`}>
                  <Check size={14} className="inline mr-1"/>Kaydet
                </button>
                <button onClick={() => setEditId(null)}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs border ${isDark ? 'border-white/10 text-white/60' : 'border-slate-200 text-slate-500'}`}>
                  İptal
                </button>
              </div>
            </motion.div>
          ) : (
            <div className={`flex items-center gap-3 p-3 rounded-2xl group ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-colors`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${cat.color}20` }}>{cat.emoji || '📌'}</div>
              <div className="flex-1 min-w-0">
                <p className={`font-black text-sm truncate ${txt}`}>{cat.name}</p>
                {cat.limit > 0 && <p className={`text-[10px] opacity-30 ${txt}`}>Limit: {formatLimit(cat.limit)}</p>}
              </div>
              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(cat)}
                  className={`p-1.5 rounded-lg transition-colors ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                  <Edit3 size={13}/>
                </button>
                <button onClick={() => deletecat(cat.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 transition-colors">
                  <Trash2 size={13}/>
                </button>
              </div>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}/>
            </div>
          )}
        </div>
      ))}

      {/* ADD NEW */}
      <AnimatePresence>
        {showNew ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-200'} space-y-3 overflow-hidden`}>
            <div className="flex gap-3">
              <input type="text" value={newCat.name} placeholder="Kategori adı" onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium outline-none ${inputCls}`}/>
              <input type="number" step="any" value={newCat.limit} placeholder={`Limit (${displayCurrency})`}
                onChange={e => setNewCat(p => ({ ...p, limit: e.target.value }))}
                className={`w-28 px-3 py-2.5 rounded-xl border text-sm outline-none ${inputCls}`}/>
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${txt}`}>Emoji</p>
            <EmojiPicker value={newCat.emoji} onChange={v => setNewCat(p => ({ ...p, emoji: v }))} isDark={isDark}/>
            <p className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${txt}`}>Renk</p>
            <ColorPicker value={newCat.color} onChange={v => setNewCat(p => ({ ...p, color: v }))}/>
            <div className="flex gap-2 pt-1">
              <button onClick={addCat}
                className={`flex-1 py-2.5 rounded-xl font-black text-xs text-white ${color.bg}`}>
                Ekle
              </button>
              <button onClick={() => setShowNew(false)}
                className={`px-5 py-2.5 rounded-xl font-black text-xs border ${isDark ? 'border-white/10 text-white/60' : 'border-slate-200 text-slate-500'}`}>
                İptal
              </button>
            </div>
          </motion.div>
        ) : (
          <button onClick={() => setShowNew(true)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed text-xs font-black uppercase tracking-widest transition-all ${isDark ? 'border-white/10 text-white/30 hover:border-white/30 hover:text-white/60' : 'border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-500'}`}>
            <Plus size={14}/> Yeni Kategori
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}

function Settings({ isDark, color, prefs, savePrefs, cats = [], saveCats, liveRates, transactions = [], expenses = [] }) {
  usePageMeta('Ayarlar', 'Hesap, tema, kategori ve veri yonetimi ayarlari.');
  const navigate = useNavigate();
  const importInputRef = useRef(null);
  const { auth, logout, isPremium, subscriptionPlan } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [premiumNotice, setPremiumNotice] = useState('');
  const fullName = `${auth?.name || ''} ${auth?.surname || ''}`.trim() || 'Kullanıcı';
  const cloudSyncEnabled = isCloudSyncConfigured() && Boolean(getCloudSyncAccountId(auth));
  const displayCurrency = normalizeCurrencySymbol(prefs?.currency);
  const subscriptionPlanLabel = subscriptionPlan === 'premium' ? 'Premium' : 'Basic';
  const savingsGoalDisplay = prefs?.savingsGoal
    ? Number(convertFromTRY(prefs.savingsGoal, displayCurrency, liveRates).toFixed(displayCurrency === '₺' ? 0 : 2))
    : '';
  const accountProviderLabel = auth?.googleId ? 'Google hesabı' : 'E-posta hesabı';
  const accountSyncLabel = cloudSyncEnabled ? 'Bulut senkron aktif' : 'Yalnızca bu cihaz';

  const txt = isDark ? 'text-white' : 'text-slate-900';
  const cardBg = isDark ? 'bg-slate-900/48 border-white/10 shadow-pack-card backdrop-blur-xl' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  const handleExport = () => {
    if (!isPremium) {
      setPremiumNotice('JSON dışa aktarma ve paylaşılabilir raporlar Premium plan ile açılır.');
      return;
    }

    const exportData = {
      wallets:      customDB.get('knapsack_w', []),
      transactions: customDB.get('knapsack_t', []),
      expenses:     customDB.get('knapsack_exp', []),
      cats:         customDB.get('knapsack_cats', []),
      prefs:        customDB.get('knapsack_p', {}),
      exportedAt:   new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `knapsack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    setPremiumNotice('JSON yedeği indirildi.');
  };

  const handleExportPremiumBrief = () => {
    if (!isPremium) {
      setPremiumNotice('Aylık premium brief yalnızca Premium planda indirilebilir.');
      return;
    }

    const reportText = buildPremiumReportText({
      transactions,
      cats,
      expenses,
      displayCurrency,
      liveRates,
      referenceDate: new Date(),
    });

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knapsack-premium-brief-${new Date().toISOString().slice(0, 7)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setPremiumNotice('Premium aylık brief indirildi.');
  };

  const handleImportBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const wallets = Array.isArray(parsed?.wallets) ? parsed.wallets : [];
      const importedTransactions = Array.isArray(parsed?.transactions) ? parsed.transactions : [];
      const importExpenses = Array.isArray(parsed?.expenses) ? parsed.expenses : [];
      const importCats = Array.isArray(parsed?.cats) ? parsed.cats : [];
      const importPrefs = parsed?.prefs && typeof parsed.prefs === 'object' ? parsed.prefs : {};

      customDB.set('knapsack_w', wallets);
      customDB.set('knapsack_t', importedTransactions);
      customDB.set('knapsack_exp', importExpenses);
      customDB.set('knapsack_cats', importCats);
      customDB.set('knapsack_p', importPrefs);

      setPremiumNotice('Yedek geri yuklendi. Sayfa yenileniyor...');
      window.setTimeout(() => {
        window.location.reload();
      }, 350);
    } catch (err) {
      console.error('Backup import failed:', err);
      setPremiumNotice('Yedek dosyasi gecersiz veya bozuk. Lutfen dogru JSON dosyasini sec.');
    } finally {
      event.target.value = '';
    }
  };

  const handleClearData = async () => {
    const storageId = getAuthStorageId(auth);
    const cloudAccountId = getCloudSyncAccountId(auth);
    const scopedKeys = getAllScopedDataKeys(storageId);
    scopedKeys.forEach(k => localStorage.removeItem(k));
    clearLocalSyncStamp(storageId);
    if (cloudAccountId && cloudAccountId !== storageId) {
      clearLocalSyncStamp(cloudAccountId);
    }

    // Clean any leftover legacy global finance keys.
    ['knapsack_w', 'knapsack_t', 'knapsack_p', 'knapsack_exp', 'knapsack_cats'].forEach(k => localStorage.removeItem(k));

    try {
      if (cloudAccountId) {
        await deleteCloudSnapshot(cloudAccountId);
      }
    } catch (err) {
      console.error('Cloud account cleanup failed:', err);
    }

    logout(true);
    navigate('/landing');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <PageShell width="wide">
        <PageHeader
          isDark={isDark}
          title="Ayarlar"
          description="Tercihler ve veri yönetimi"
          className="mb-10"
          titleClassName={`font-display text-step-4 sm:text-6xl mb-1 ${txt}`}
          descriptionClassName={`text-[10px] font-semibold uppercase tracking-widest ${isDark ? 'text-white/38' : 'text-black/38'}`}
          eyebrowClassName="font-black tracking-[0.5em] opacity-60"
        />

        <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <SectionCard isDark={isDark} padding="lg" className={cardBg}>
        <div className="flex items-center gap-3 mb-6">
          <User size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Hesap</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-black text-base ${txt}`}>{fullName}</p>
            {auth?.email && <p className={`text-xs opacity-55 ${txt}`}>{auth.email}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                data-testid="settings-auth-provider"
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-white/8 text-white/65' : 'bg-slate-100 text-slate-600'}`}
              >
                {accountProviderLabel}
              </span>
              <span
                data-testid="settings-sync-status"
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${cloudSyncEnabled ? 'bg-emerald-500/15 text-emerald-400' : isDark ? 'bg-white/8 text-white/55' : 'bg-slate-100 text-slate-500'}`}
              >
                {accountSyncLabel}
              </span>
              <span
                data-testid="settings-plan-status"
                className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${isPremium ? 'bg-amber-500 text-white' : isDark ? 'bg-white/8 text-white/55' : 'bg-slate-100 text-slate-500'}`}
              >
                {subscriptionPlanLabel}
              </span>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-all text-sm font-black">
            <LogOut size={14}/> Çıkış
          </button>
        </div>
        </SectionCard>

        <SectionCard isDark={isDark} padding="lg" className={isPremium ? (isDark ? 'bg-amber-500/[0.08] border-amber-400/20 shadow-[0_24px_80px_rgba(245,158,11,0.16)] backdrop-blur-xl' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]') : cardBg}>
        <div className="flex items-center gap-3 mb-6">
          <Crown size={18} className="text-amber-500"/>
          <h2 className={`text-base font-black ${txt}`}>Hesap Planı</h2>
          <span
            data-testid="settings-plan-pill"
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isPremium ? 'bg-amber-500 text-white' : isDark ? 'bg-white/8 text-white/55' : 'bg-slate-100 text-slate-500'}`}
          >
            {subscriptionPlanLabel}
          </span>
        </div>

        <div className={`p-5 rounded-[1.8rem] border mb-4 ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-white/80 border-slate-200/80'}`}>
          <p className={`text-sm font-black mb-2 ${txt}`}>
            {isPremium ? 'Bu hesapta premium modüller aktif.' : 'Bu hesap basic planda çalışıyor.'}
          </p>
          <p className={`text-xs leading-6 ${txt}`}>
            {isPremium
              ? 'Analytics, borç yönetimi ve premium dışa aktarma bu hesap için açık kalır.'
              : 'Basic hesapta günlük takip akışı sade tutulur. Premium modüller ayrı plan merkezinden açılır.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {(isPremium ? PREMIUM_PLAN_MODULES : BASIC_PLAN_MODULES).map(module => (
            <div key={module} className={`p-4 rounded-[1.6rem] border ${isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-sm font-black mb-1 ${txt}`}>{module}</p>
              <p className={`text-xs leading-5 ${txt}`}>{isPremium ? 'Bu modül hesap planında aktif durumda.' : 'Bu modül basic deneyimde açık durumda.'}</p>
            </div>
          ))}
        </div>

        {isPremium ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/analytics')}
              className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/45 border-emerald-500/20 hover:border-emerald-500/40 text-white' : 'border-emerald-200 hover:border-emerald-400 text-slate-700 bg-white/80'}`}
            >
              <div className="text-left">
                <p className="font-black text-sm">Analytics'e Git</p>
                <p className={`text-xs opacity-50 ${txt}`}>Premium tahmin ve öngörü panelini aç</p>
              </div>
              <Crown size={16} className="text-amber-500 flex-shrink-0"/>
            </button>
            <button
              onClick={() => navigate('/premium')}
              className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/45 border-white/10 hover:border-white/30 text-white' : 'border-slate-200 hover:border-indigo-400 text-slate-700 bg-white/80'}`}
            >
              <div className="text-left">
                <p className="font-black text-sm">Premium Merkezini Aç</p>
                <p className={`text-xs opacity-50 ${txt}`}>Plan modüllerini ve kilitleri tek yerde gör</p>
              </div>
              <ExternalLink size={16} className="text-amber-500 flex-shrink-0"/>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/premium')}
              className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/45 border-amber-500/20 hover:border-amber-500/50 text-white' : 'border-amber-300 hover:border-amber-500 text-slate-700'}`}
            >
              <div className="text-left">
                <p className="font-black text-sm">Premium Merkezini Aç</p>
                <p className={`text-xs opacity-50 ${txt}`}>Analytics ve borç modüllerinin kazanımlarını gör</p>
              </div>
              <ExternalLink size={16} className="text-amber-500 flex-shrink-0"/>
            </button>
            <button
              onClick={() => navigate('/assets')}
              className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/45 border-white/10 hover:border-white/30 text-white' : 'border-slate-200 hover:border-indigo-400 text-slate-700 bg-white/80'}`}
            >
              <div className="text-left">
                <p className="font-black text-sm">Basic Hesaplara Dön</p>
                <p className={`text-xs opacity-50 ${txt}`}>Temel hesap tiplerini yönetmeye devam et</p>
              </div>
              <Crown size={16} className="text-amber-500 flex-shrink-0"/>
            </button>
          </div>
        )}
        </SectionCard>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
        <SectionCard isDark={isDark} padding="lg" className={cardBg}>
        <div className="flex items-center gap-3 mb-6">
          <Target size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Aylık Tasarruf Hedefi</h2>
        </div>
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${isDark ? 'bg-slate-950/55 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <span className={`text-sm font-black opacity-40 ${txt}`}>{displayCurrency}</span>
          <input
            type="number" min="0" step="any"
            value={savingsGoalDisplay}
            onChange={e => savePrefs({ ...prefs, savingsGoal: convertToTRY(e.target.value, displayCurrency, liveRates) })}
            className={`flex-1 bg-transparent text-xl font-black outline-none ${txt}`}
            placeholder="0"
          />
        </div>
        <p className={`text-xs opacity-30 mt-2 ${txt}`}>Seçili görüntüleme para biriminde düzenlenir ve ana sayfada ilerleme çubuğu olarak gösterilir.</p>
        </SectionCard>

        <SectionCard isDark={isDark} padding="lg" className={cardBg}>
        <div className="flex items-center gap-3 mb-6">
          <Palette size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Tema Rengi</h2>
        </div>
        <div className="flex gap-3 flex-wrap">
          {Object.entries(themeColors).map(([key, val]) => (
            <button key={key} onClick={() => savePrefs({ ...prefs, themeColor: key })}
              className={`w-12 h-12 rounded-2xl ${val.bg} transition-all ${prefs?.themeColor === key ? 'ring-4 ring-offset-2 ring-offset-transparent scale-110' : 'opacity-50 hover:opacity-90'}`}
              style={{ '--tw-ring-color': val.hex }}/>
          ))}
        </div>
        </SectionCard>

        <SectionCard isDark={isDark} padding="lg" className={cardBg}>
        <div className="flex items-center gap-3 mb-6">
          <DollarSign size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Para Birimi Sembolü</h2>
        </div>
        <div className="flex gap-3">
          {CURRENCIES.map(c => (
            <button key={c} onClick={() => savePrefs({ ...prefs, currency: c })}
              className={`flex-1 py-3.5 rounded-2xl text-base font-black border transition-all ${prefs?.currency === c ? `${color.bg} text-white border-transparent` : isDark ? 'border-white/10 text-white/40' : 'border-slate-200 text-slate-400'}`}>
              {c}
            </button>
          ))}
        </div>
        <p className={`text-xs opacity-30 mt-2 ${txt}`}>Yeni işlem formu para birimini bu seçimden alır; işlem bazında ayrıca seçilmez.</p>
        </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <SectionCard isDark={isDark} padding="lg" className={cardBg}>
        <div className="flex items-center gap-3 mb-6">
          <Tags size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Kategoriler</h2>
          <span className={`text-[10px] font-black opacity-30 ${txt}`}>{cats.length} adet</span>
        </div>
        <CategoryEditor cats={cats} saveCats={saveCats} isDark={isDark} color={color} displayCurrency={displayCurrency} liveRates={liveRates}/>
        </SectionCard>

        <SectionCard isDark={isDark} padding="lg" className={cardBg}>
        <div className="flex items-center gap-3 mb-6">
          <Shield size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Veri Yönetimi</h2>
        </div>
        <div className="space-y-3">
          <button onClick={handleExport}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/45 border-white/10 hover:border-white/30 text-white' : 'border-slate-200 hover:border-indigo-400 text-slate-700'}`}>
            <Download size={18} className="text-indigo-500 flex-shrink-0"/>
            <div className="text-left">
              <p className="font-black text-sm">{isPremium ? 'Dışa Aktar (JSON)' : 'Dışa Aktar (JSON) · Premium'}</p>
              <p className={`text-xs opacity-40 ${txt}`}>{isPremium ? 'Tüm veriyi yedekle' : 'JSON yedekleme premium kullanıcılara açık'}</p>
            </div>
          </button>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImportBackup}
          />

          <button
            onClick={() => importInputRef.current?.click()}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/45 border-white/10 hover:border-white/30 text-white' : 'border-slate-200 hover:border-indigo-400 text-slate-700'}`}
          >
            <Upload size={18} className="text-indigo-500 flex-shrink-0"/>
            <div className="text-left">
              <p className="font-black text-sm">Yedek Içe Aktar (JSON)</p>
              <p className={`text-xs opacity-40 ${txt}`}>Kaybolan veriyi bu cihaza geri yukler</p>
            </div>
          </button>

          <button onClick={handleExportPremiumBrief}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/45 border-white/10 hover:border-white/30 text-white' : 'border-slate-200 hover:border-indigo-400 text-slate-700'}`}>
            <FileText size={18} className="text-indigo-500 flex-shrink-0"/>
            <div className="text-left">
              <p className="font-black text-sm">{isPremium ? 'Aylık Brief İndir' : 'Aylık Brief İndir · Premium'}</p>
              <p className={`text-xs opacity-40 ${txt}`}>{isPremium ? 'Executive brief, renewal radar ve anomaly watch özetini al' : 'Paylaşılabilir aylık brief premium kullanıcılara açık'}</p>
            </div>
          </button>

          {premiumNotice && (
            <p className={`text-xs font-black ${isPremium ? 'text-emerald-500' : 'text-amber-500'}`}>
              {premiumNotice}
            </p>
          )}

          {!showConfirm ? (
            <button onClick={() => setShowConfirm(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-rose-500/20 hover:border-rose-500/50 transition-all text-rose-500">
              <Trash2 size={18} className="flex-shrink-0"/>
              <div className="text-left">
                <p className="font-black text-sm">Tüm Verileri Sil</p>
                <p className="text-xs opacity-60">Geri alınamaz</p>
              </div>
            </button>
          ) : (
            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5">
              <p className="text-sm font-black text-rose-500 mb-3">Emin misin? Tüm veriler silinecek.</p>
              <div className="flex gap-3">
                <button onClick={handleClearData} className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-black text-sm">Evet, Sil</button>
                <button onClick={() => setShowConfirm(false)} className={`flex-1 py-3 rounded-xl border font-black text-sm ${isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-600'}`}>İptal</button>
              </div>
            </div>
          )}
        </div>
        </SectionCard>
        </div>

        <SectionCard isDark={isDark} padding="lg" className={cardBg}>
        <div className="flex items-center gap-3 mb-6">
          <Shield size={18} className="text-indigo-500"/>
          <h2 className={`text-base font-black ${txt}`}>Yasal</h2>
        </div>
        <div className="space-y-3">
          <a
            href="/privacy-policy.html"
            target="_blank"
            rel="noreferrer"
            className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/45 border-white/10 hover:border-white/30 text-white' : 'border-slate-200 hover:border-indigo-400 text-slate-700'}`}
          >
            <div className="text-left">
              <p className="font-black text-sm">Gizlilik Politikası</p>
              <p className={`text-xs opacity-40 ${txt}`}>Play Store için gerekli politika sayfası</p>
            </div>
            <ExternalLink size={16} className="text-indigo-500 flex-shrink-0"/>
          </a>

          <a
            href="/account-deletion.html"
            target="_blank"
            rel="noreferrer"
            className={`w-full flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-950/45 border-white/10 hover:border-white/30 text-white' : 'border-slate-200 hover:border-indigo-400 text-slate-700'}`}
          >
            <div className="text-left">
              <p className="font-black text-sm">Hesap Silme Bilgilendirmesi</p>
              <p className={`text-xs opacity-40 ${txt}`}>Uygulama içi veri silme akışı ve bulut temizliği</p>
            </div>
            <ExternalLink size={16} className="text-indigo-500 flex-shrink-0"/>
          </a>
        </div>
        </SectionCard>

        <div className={`text-center opacity-20 text-xs font-black uppercase tracking-widest ${txt}`}>
          {APP_VERSION_LABEL} - Local First · Sunucusuz Çekirdek
        </div>
        </div>
      </PageShell>
    </motion.div>
  );
}

export default Settings;
