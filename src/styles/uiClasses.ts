// ─── Focus ring utilities ──────────────────────────────────────────────────
export const focusRing = {
  dark: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060a]',
  light: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2f1ed]',
  base: (isDark: boolean) => isDark
    ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060a]'
    : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2f1ed]',
};

// ─── Surface utilities ─────────────────────────────────────────────────────
export const surface = {
  // Main card surface
  card: (isDark: boolean) => isDark
    ? 'rounded-card border border-white/10 bg-slate-900/55 shadow-card-dark backdrop-blur-xl'
    : 'rounded-card border border-slate-200/60 bg-white shadow-card-light',
  // Compact widget card
  widget: (isDark: boolean) => isDark
    ? 'rounded-widget border border-white/[0.08] bg-slate-900/50 backdrop-blur-xl'
    : 'rounded-widget border border-slate-200/50 bg-white shadow-card-light',
  // Input field
  input: (isDark: boolean) => isDark
    ? 'bg-slate-950/55 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-400/60 focus:bg-slate-950/70'
    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white',
  // Bottom sheet / modal overlay
  overlay: (isDark: boolean) => isDark
    ? 'bg-slate-950/80 backdrop-blur-xl'
    : 'bg-slate-900/40 backdrop-blur-sm',
};

// ─── Text utilities ────────────────────────────────────────────────────────
export const text = {
  primary: (isDark: boolean) => isDark ? 'text-white' : 'text-slate-900',
  secondary: (isDark: boolean) => isDark ? 'text-white/60' : 'text-slate-500',
  tertiary: (isDark: boolean) => isDark ? 'text-white/42' : 'text-slate-400',
  muted: (isDark: boolean) => isDark ? 'text-white/28' : 'text-slate-400/70',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  danger: 'text-rose-500',
  info: 'text-sky-500',
  brand: 'text-indigo-500',
};

// ─── Button variants ───────────────────────────────────────────────────────
export const btn = {
  primary: (colorBg = 'bg-indigo-600') =>
    `${colorBg} text-white border-white/10 shadow-btn-primary hover:shadow-btn-primary-hover hover:-translate-y-px active:translate-y-0 active:shadow-btn-primary transition-all`,
  secondary: (isDark: boolean) => isDark
    ? 'bg-white/[0.06] border-white/10 text-white hover:bg-white/[0.10] hover:border-white/18 transition-all'
    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-card-light transition-all',
  ghost: (isDark: boolean) => isDark
    ? 'border-transparent text-white/45 hover:text-white/75 hover:bg-white/[0.05] transition-all'
    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 transition-all',
  danger: 'border-rose-500/20 bg-rose-500/[0.06] text-rose-400 hover:bg-rose-500/12 hover:text-rose-300 hover:border-rose-500/30 transition-all',
  success: 'border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-400 hover:bg-emerald-500/12 hover:text-emerald-300 hover:border-emerald-500/30 transition-all',
};

// ─── Badge variants ────────────────────────────────────────────────────────
export const badge = {
  default: (isDark: boolean) => isDark ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  success: (isDark: boolean) => isDark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  warning: (isDark: boolean) => isDark ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-100',
  danger: (isDark: boolean) => isDark ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20' : 'bg-rose-50 text-rose-700 border border-rose-100',
  neutral: (isDark: boolean) => isDark ? 'bg-white/[0.07] text-white/55 border border-white/10' : 'bg-slate-100 text-slate-500 border border-slate-200',
};

// ─── Divider ───────────────────────────────────────────────────────────────
export const divider = (isDark: boolean) => isDark ? 'border-white/[0.08]' : 'border-slate-200/70';

// ─── Page layout helpers ───────────────────────────────────────────────────
export const page = {
  shell: {
    compact: 'pt-16 pb-[calc(env(safe-area-inset-bottom)+11rem)]',
    default: 'pt-20 pb-[calc(env(safe-area-inset-bottom)+11rem)]',
    hero: 'pt-4 pb-[calc(env(safe-area-inset-bottom)+11rem)]',
  },
  eyebrow: (isDark: boolean) =>
    `font-meta text-[10px] font-semibold uppercase tracking-[0.32em] mb-3 ${isDark ? 'text-indigo-300/75' : 'text-indigo-600/70'}`,
  title: 'font-display text-step-3 sm:text-step-4 font-extrabold tracking-[-0.03em] leading-[1.02]',
  description: (isDark: boolean) => isDark
    ? 'max-w-2xl text-sm sm:text-base text-white/60'
    : 'max-w-2xl text-sm sm:text-base text-slate-500',
};

// ─── Spacing ────────────────────────────────────────────────────────────────
export const spacing = {
  sectionX: 'px-4 sm:px-6 lg:px-8',
  sectionY: 'py-20 pb-44',
  cardPadding: 'p-5 sm:p-6',
  modalPadding: 'p-6 sm:p-8',
};

// ─── Max widths ────────────────────────────────────────────────────────────
export const maxWidth = {
  panel: 'max-w-2xl',
  narrow: 'max-w-3xl',
  section: 'max-w-4xl',
  wide: 'max-w-7xl',
  form: 'max-w-md',
  full: 'w-full',
};

// ─── Legacy uiClasses export (backwards compatibility) ─────────────────────
export const uiClasses = {
  text,
  card: {
    dark: surface.card(true),
    light: surface.card(false),
    base: surface.card,
  },
  input: {
    dark: surface.input(true),
    light: surface.input(false),
    base: surface.input,
  },
  button: btn,
  gradient: {
    darkOverlay: 'bg-gradient-to-b from-white/[0.08] via-transparent to-slate-950/45',
    lightOverlay: 'bg-gradient-to-b from-white/70 via-transparent to-slate-100/80',
  },
  spacing,
  page,
  rounded: {
    logo: 'rounded-card',
    large: 'rounded-card',
    medium: 'rounded-btn-lg',
    small: 'rounded-btn',
  },
  maxWidth,
};

export default uiClasses;
