import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Crown,
  CreditCard,
  ExternalLink,
  Receipt,
  Shield,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { PageShell } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { getPremiumUpgradeUrl, PREMIUM_LIVE_FEATURES } from '../utils/premium';
import { usePageMeta } from '../hooks/usePageMeta';

const BASIC_MODULES = [
  {
    id: 'basic-cashflow',
    title: 'Gelir / Gider Akışı',
    description: 'Günlük kişisel harcamaları, gelirleri ve notları tek akış içinde kaydet.',
    Icon: Shield,
  },
  {
    id: 'basic-expenses',
    title: 'Sabit Giderler',
    description: 'Kira, abonelik ve düzenli ödemeleri aylık düzende takip et.',
    Icon: Receipt,
  },
  {
    id: 'basic-assets',
    title: 'Temel Hesaplar',
    description: 'Vadesiz, USD, EUR ve altın hesaplarını tek ekranda yönet.',
    Icon: Wallet,
  },
];

const PREMIUM_MODULES = [
  {
    id: 'premium-analytics',
    title: 'Analytics',
    description: 'Aylık tahmin, kategori yoğunluğu ve harcama hızı tek panelde açılır.',
    Icon: BarChart3,
  },
  {
    id: 'premium-debts',
    title: 'Kart / KMH / Kredi',
    description: 'Kredi kartı, KMH ve taksitli borç portföyün premium katmanda yönetilir.',
    Icon: CreditCard,
  },
  {
    id: 'premium-brief',
    title: 'Brief ve Export',
    description: 'Paylaşılabilir aylık brief ile gelişmiş dışa aktarma akışları açılır.',
    Icon: Sparkles,
  },
];

function ModuleCard({ title, description, Icon, isDark, accentClass, surfaceClass }) {
  return (
    <div className={`rounded-[1.8rem] border p-5 ${surfaceClass}`}>
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${accentClass}`}>
        <Icon size={18} />
      </div>
      <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</p>
      <p className={`mt-2 text-xs leading-6 ${isDark ? 'text-white/58' : 'text-slate-500'}`}>{description}</p>
    </div>
  );
}

function PrimaryLink({ href, children, className = '' }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white ${className}`}
    >
      {children}
    </a>
  );
}

export default function Premium({ isDark, color }) {
  usePageMeta('Premium', 'Premium moduller ve plan avantajlarini karsilastirin.');
  const { auth, isPremium } = useAuth();
  const premiumUpgradeUrl = getPremiumUpgradeUrl();
  const premiumHighlights = PREMIUM_LIVE_FEATURES.slice(0, 3);
  const txt = isDark ? 'text-white' : 'text-slate-900';
  const sub = isDark ? 'text-white/55' : 'text-slate-500';
  const softCard = isDark ? 'bg-slate-900/48 border-white/10 shadow-pack-card backdrop-blur-xl' : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]';
  const strongCard = isPremium
    ? isDark
      ? 'bg-amber-500/[0.08] border-amber-400/20 shadow-[0_24px_80px_rgba(245,158,11,0.16)] backdrop-blur-xl'
      : 'bg-white border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
    : softCard;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <PageShell width="wide">
      <header className="mb-10">
        <p className="mb-3 font-meta text-[10px] font-semibold uppercase tracking-[0.34em] text-amber-300/80">Knapsack Plan</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className={`font-display text-step-4 sm:text-6xl font-extrabold tracking-[-0.04em] ${txt}`}>
            {isPremium ? 'Premium Merkezi' : 'Plan Merkezi'}
          </h1>
          <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.32em] ${isPremium ? 'bg-amber-500 text-white' : isDark ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-600'}`}>
            {isPremium ? 'Premium' : 'Basic'}
          </span>
        </div>
        <p className={`mt-3 max-w-2xl text-sm leading-7 ${sub}`}>
          {isPremium
            ? 'Bu hesapta premium modüller açık. Analytics, borç yönetimi ve premium rapor akışları ayrı bir merkezden yönetiliyor.'
            : 'Basic hesapta günlük finans akışı sade tutulur. Analytics ve borç modülleri ayrı premium merkezinde kilitli kalır.'}
        </p>
        {auth?.email && <p className={`mt-3 text-[10px] font-black uppercase tracking-[0.32em] ${sub}`}>{auth.email}</p>}
      </header>

      <div className="space-y-6">
      <section className={`rounded-[2.7rem] border p-7 sm:p-8 ${strongCard}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-[1.5rem] ${isPremium ? 'bg-amber-500/15 text-amber-500' : isDark ? 'bg-slate-950/55 text-white/60' : 'bg-slate-100 text-slate-600'}`}>
              {isPremium ? <Crown size={24} /> : <Shield size={24} />}
            </div>
            <h2 className={`text-2xl font-black ${txt}`}>
              {isPremium ? 'Premium hesap aktif' : 'Basic hesap aktif'}
            </h2>
            <p className={`mt-2 text-sm leading-7 ${sub}`}>
              {isPremium
                ? 'Alt menüde Analytics görünür, borç tipleri Varlıklar ekranında aktif olur ve aylık brief dışa aktarımı Ayarlar içinde açık kalır.'
                : 'Alt menüde Premium merkezi görünür, yeni işlem para birimi Ayarlar seçimiyle gelir ve temel hesaplar karışık premium kartlarla boğulmaz.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isPremium ? (
              <>
                <Link
                  to="/analytics"
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_14px_32px_rgba(99,102,241,0.24)] ${color.bg}`}
                >
                  Analytics Aç
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/assets"
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] border ${isDark ? 'border-white/10 bg-slate-950/45 text-white hover:bg-slate-950/65' : 'border-slate-200 text-slate-700 hover:bg-white'}`}
                >
                  Varlıklara Dön
                </Link>
              </>
            ) : premiumUpgradeUrl ? (
              <>
                <PrimaryLink href={premiumUpgradeUrl} className={color.bg}>
                  Premium'a Geç
                  <ExternalLink size={15} />
                </PrimaryLink>
                <Link
                  to="/settings"
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] border ${isDark ? 'border-white/10 bg-slate-950/45 text-white hover:bg-slate-950/65' : 'border-slate-200 text-slate-700 hover:bg-white'}`}
                >
                  Ayarları Aç
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/settings"
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_14px_32px_rgba(99,102,241,0.24)] ${color.bg}`}
                >
                  Plan Durumunu Kontrol Et
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/assets"
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] border ${isDark ? 'border-white/10 bg-slate-950/45 text-white hover:bg-slate-950/65' : 'border-slate-200 text-slate-700 hover:bg-white'}`}
                >
                  Temel Hesaplara Dön
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
      <section className={`rounded-[2.5rem] border p-7 ${softCard}`}>
          <div className="mb-6 flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-950/55 text-white/65' : 'bg-slate-100 text-slate-600'}`}>
              <Shield size={18} />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.35em] ${sub}`}>Basic Akış</p>
              <h2 className={`text-xl font-black ${txt}`}>Günlük kullanım için sade katman</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {BASIC_MODULES.map(module => (
              <ModuleCard
                key={module.id}
                title={module.title}
                description={module.description}
                Icon={module.Icon}
                isDark={isDark}
                accentClass={isDark ? 'bg-white/[0.06] text-white/65' : 'bg-slate-100 text-slate-600'}
                surfaceClass={isDark ? 'bg-slate-950/45 border-white/10' : 'bg-slate-50 border-slate-200'}
              />
            ))}
          </div>
      </section>

      <section className={`rounded-[2.5rem] border p-7 ${isPremium ? strongCard : isDark ? 'bg-amber-500/[0.08] border-amber-400/20 shadow-[0_24px_80px_rgba(245,158,11,0.16)] backdrop-blur-xl' : 'bg-white/92 border-slate-200/80 shadow-[0_24px_80px_rgba(245,158,11,0.10)]'}`}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
              <Crown size={18} />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.35em] ${isDark ? 'text-amber-300/70' : 'text-amber-700/70'}`}>Premium Katman</p>
              <h2 className={`text-xl font-black ${txt}`}>Analiz ve borç modülleri burada açılır</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {PREMIUM_MODULES.map(module => (
              <ModuleCard
                key={module.id}
                title={module.title}
                description={module.description}
                Icon={module.Icon}
                isDark={isDark}
                accentClass="bg-amber-500/15 text-amber-500"
                surfaceClass={isDark ? 'bg-slate-950/45 border-white/10' : 'bg-white/80 border-slate-200/80'}
              />
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {premiumHighlights.map(feature => (
              <div
                key={feature.id}
                className={`rounded-[1.6rem] border px-4 py-3 ${isDark ? 'border-white/10 bg-slate-950/45' : 'border-slate-200/80 bg-white/80'}`}
              >
                <p className={`text-sm font-black ${txt}`}>{feature.title}</p>
                <p className={`mt-1 text-xs leading-6 ${sub}`}>{feature.description}</p>
              </div>
            ))}
          </div>
      </section>
      </div>
      </div>
      </PageShell>
    </motion.div>
  );
}