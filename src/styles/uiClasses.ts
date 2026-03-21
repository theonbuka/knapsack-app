export const uiClasses = {
  // Text colors
  text: {
    primary: (isDark: boolean) => (isDark ? 'text-white' : 'text-slate-900'),
    secondary: (isDark: boolean) => (isDark ? 'text-slate-300/80' : 'text-slate-500'),
    muted: (isDark: boolean) => (isDark ? 'text-white/38' : 'text-slate-400'),
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-rose-500',
    info: 'text-sky-500',
  },

  // Card styles
  card: {
    dark: 'rounded-[2rem] border border-white/10 bg-slate-900/55 shadow-pack-card backdrop-blur-xl',
    light: 'rounded-[2rem] border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
    base: (isDark: boolean) =>
      isDark
        ? 'rounded-[2rem] border border-white/10 bg-slate-900/55 shadow-pack-card backdrop-blur-xl'
        : 'rounded-[2rem] border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
  },

  // Input styles
  input: {
    dark: 'bg-slate-950/55 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-400/70 focus:bg-slate-950/70',
    light: 'bg-white border-slate-100 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white',
    base: (isDark: boolean) =>
      isDark
        ? 'bg-slate-950/55 border-white/10 text-white placeholder:text-white/30 focus:border-indigo-400/70 focus:bg-slate-950/70'
        : 'bg-white border-slate-100 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white',
  },

  // Button styles
  button: {
    primary: (isDark: boolean, colorBg: string = 'bg-indigo-600') =>
      `${colorBg} text-white border-white/10 shadow-[0_18px_38px_rgba(99,102,241,0.32)] hover:-translate-y-0.5 transition-all`,
    secondary: (isDark: boolean) =>
      isDark
        ? 'bg-slate-900/70 border-white/10 text-white hover:border-white/20 hover:bg-slate-900/90 transition-all'
        : 'bg-white border-slate-100 text-slate-900 hover:border-slate-200 hover:bg-white transition-all',
    ghost: (isDark: boolean) =>
      isDark ? 'text-white/45 hover:text-white/75 transition-all' : 'text-slate-500 hover:text-slate-700 transition-all',
  },

  // Background gradients
  gradient: {
    darkOverlay: 'bg-gradient-to-b from-white/[0.08] via-transparent to-slate-950/45',
    lightOverlay: 'bg-gradient-to-b from-white/70 via-transparent to-slate-100/80',
  },

  // Spacing helpers
  spacing: {
    sectionX: 'px-4 sm:px-6 lg:px-8',
    sectionY: 'py-20 pb-44',
    cardPadding: 'p-5 sm:p-6',
    modalPadding: 'p-6 sm:p-8',
  },

  page: {
    shell: {
      compact: 'pt-16 pb-[calc(env(safe-area-inset-bottom)+11rem)]',
      default: 'pt-20 pb-[calc(env(safe-area-inset-bottom)+11rem)]',
      hero: 'pt-4 pb-[calc(env(safe-area-inset-bottom)+11rem)]',
    },
    eyebrow: (isDark: boolean) => `font-meta text-[10px] font-semibold uppercase tracking-[0.32em] mb-3 ${isDark ? 'text-indigo-300/75' : 'text-indigo-600/70'}`,
    title: 'font-display text-step-3 sm:text-step-4 font-extrabold tracking-[-0.03em] leading-[1.02]',
    description: (isDark: boolean) => (isDark ? 'max-w-2xl text-sm sm:text-base text-slate-300/80' : 'max-w-2xl text-sm sm:text-base text-slate-500'),
  },

  // Border radius presets
  rounded: {
    logo: 'rounded-[2rem]',
    large: 'rounded-[2rem]',
    medium: 'rounded-xl',
    small: 'rounded-lg',
  },

  // Max widths
  maxWidth: {
    panel: 'max-w-2xl',
    narrow: 'max-w-3xl',
    section: 'max-w-4xl',
    wide: 'max-w-7xl',
    form: 'max-w-md',
    full: 'w-full',
  },
};

export default uiClasses;
