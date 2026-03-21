import React from 'react';
import { Link } from 'react-router-dom';
import { motion, type AnimationControls } from 'framer-motion';
import { Moon, Plus, Sun } from 'lucide-react';

interface AccentColor {
  bg: string;
  hex: string;
}

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

interface IndicatorFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

interface AppLoadingScreenProps {
  activeColor: AccentColor;
  isDark: boolean;
}

export function AppLoadingScreen({ activeColor, isDark }: AppLoadingScreenProps) {
  return (
    <div className={`${isDark ? 'pack-grid-shell bg-pack-bg text-white' : 'pack-grid-shell pack-grid-shell-light bg-slate-50 text-slate-900'} flex h-screen flex-col items-center justify-center gap-4`}>
      <p className={`font-meta text-[10px] font-semibold tracking-[0.45em] ${isDark ? 'text-white/35' : 'text-slate-500'}`}>
        SURVIVAL KIT
      </p>
      <h1 className={`font-display text-3xl font-extrabold tracking-[-0.03em] ${isDark ? 'text-white' : 'text-slate-950'}`}>
        Payonar
      </h1>
      <div className={`h-px w-16 ${isDark ? 'bg-white/10' : 'bg-slate-300'}`} />
      <div className={`h-2 w-2 rounded-full animate-pulse ${activeColor.bg}`} />
    </div>
  );
}

interface AppAmbientBackgroundProps {
  activeColor: AccentColor;
  isDark: boolean;
}

export function AppAmbientBackground({ activeColor, isDark }: AppAmbientBackgroundProps) {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      <div className={`ambient-blob1 absolute -top-[12%] right-[-8%] h-[42rem] w-[42rem] rounded-full blur-[135px] ${isDark ? 'opacity-[0.14]' : 'opacity-[0.06]'} ${isDark ? activeColor.bg : 'bg-indigo-100'}`} />
      <div className={`ambient-blob2 absolute bottom-[-8%] left-[-10%] h-[30rem] w-[30rem] rounded-full blur-[120px] ${isDark ? 'opacity-[0.10]' : 'opacity-[0.05]'} ${isDark ? 'bg-emerald-500' : 'bg-sky-100'}`} />
      <div className={`absolute inset-x-0 top-0 h-40 ${isDark ? 'bg-gradient-to-b from-slate-950/35 to-transparent' : 'bg-gradient-to-b from-white/90 to-transparent'}`} />
    </div>
  );
}

interface AppFloatingActionButtonProps {
  activeColor: AccentColor;
  isDark: boolean;
  isExpensesRoute: boolean;
  isExpanded: boolean;
  onPress: () => void;
}

export function AppFloatingActionButton({
  activeColor,
  isDark,
  isExpensesRoute,
  isExpanded,
  onPress,
}: AppFloatingActionButtonProps) {
  const focusRingCls = isDark
    ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060a]'
    : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

  return (
    <button
      type="button"
      onClick={onPress}
      className={`fixed bottom-[calc(env(safe-area-inset-bottom)+6.75rem)] left-1/2 z-[250] flex h-[60px] w-[60px] -translate-x-1/2 items-center justify-center rounded-[1.5rem] border active:scale-90 transition-transform backdrop-blur-xl ${focusRingCls} ${isDark ? 'border-white/[0.10] bg-slate-900/84 text-white' : 'border-slate-200 bg-white/90 text-indigo-600'}`}
      style={{ boxShadow: isDark ? `0 18px 42px ${activeColor.hex}4d, 0 0 0 1px rgba(255,255,255,0.06)` : '0 8px 30px rgb(0 0 0 / 0.06)' }}
      aria-label={isExpensesRoute ? 'Yeni sabit gider ekle' : 'Yeni işlem ekle'}
      aria-expanded={isExpensesRoute ? false : isExpanded}
    >
      <div className={`pointer-events-none absolute inset-0 rounded-[1.5rem] bg-gradient-to-br ${isDark ? 'from-white/[0.12] via-transparent to-transparent' : 'from-white via-transparent to-transparent'}`} />
      <Plus size={22} strokeWidth={1.5} />
    </button>
  );
}

interface AppNavigationDockProps {
  activeColor: AccentColor;
  activeNavIndex: number;
  dockRef: React.RefObject<HTMLDivElement>;
  indicatorFrame: IndicatorFrame;
  isDark: boolean;
  navButtonRefs: React.MutableRefObject<Array<HTMLAnchorElement | null>>;
  navItems: NavItem[];
  onToggleTheme: () => void;
  themeToggleControls: AnimationControls;
  toolbarPlate: string;
}

export function AppNavigationDock({
  activeColor,
  activeNavIndex,
  dockRef,
  indicatorFrame,
  isDark,
  navButtonRefs,
  navItems,
  onToggleTheme,
  themeToggleControls,
  toolbarPlate,
}: AppNavigationDockProps) {
  const focusRingCls = isDark
    ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060a]'
    : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

  return (
    <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+1.1rem)] left-0 right-0 z-[150] flex justify-center px-3 sm:px-4">
      <div className="relative pointer-events-auto" style={{ '--toolbar-plate': toolbarPlate } as React.CSSProperties}>
        <div className="floating-nav-ambient" style={{ background: isDark ? `radial-gradient(circle, ${activeColor.hex}33 0%, rgba(232, 175, 72, 0.16) 32%, transparent 72%)` : 'radial-gradient(circle, rgba(99, 102, 241, 0.14) 0%, rgba(255, 255, 255, 0) 72%)' }} />
        <div
          ref={dockRef}
          className={`floating-nav-shell ${isDark ? 'bg-slate-900/78 text-white' : 'bg-white/80 text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md'} rounded-[1.85rem] border ${isDark ? 'border-white/[0.10]' : 'border-slate-200'}`}
        >
          <div className="floating-nav-grain" />

          {indicatorFrame.visible && (
            isDark ? (
              <motion.div
                className="nav-ring-indicator"
                initial={false}
                animate={{
                  x: indicatorFrame.x,
                  y: indicatorFrame.y,
                  width: indicatorFrame.width,
                  height: indicatorFrame.height,
                  opacity: 1,
                }}
                transition={{ duration: 0.48, ease: [0.34, 1.2, 0.64, 1] }}
              >
                <div className="nav-ring-indicator__glow" />
                <div className="nav-ring-indicator__clip">
                  <div className="nav-ring-indicator__spin" />
                </div>
                <div className="nav-ring-indicator__plate" />
              </motion.div>
            ) : (
              <motion.div
                className="absolute rounded-[1rem] border border-indigo-100 bg-indigo-50 shadow-[0_8px_30px_rgba(99,102,241,0.08)]"
                initial={false}
                animate={{
                  x: indicatorFrame.x + 4,
                  y: indicatorFrame.y + 4,
                  width: indicatorFrame.width - 8,
                  height: indicatorFrame.height - 8,
                  opacity: 1,
                }}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              />
            )
          )}

          <div className="relative z-[1] flex items-center gap-1.5 px-2 py-2 sm:px-2.5">
            {navItems.map(({ to, icon, label }, index) => {
              const isActive = activeNavIndex === index;

              return (
                <React.Fragment key={to}>
                  {index > 0 && <span className={`h-7 w-px ${isDark ? 'bg-white/[0.07]' : 'bg-slate-300/80'}`} />}
                  <Link
                    ref={node => {
                      navButtonRefs.current[index] = node;
                    }}
                    to={to}
                    aria-label={label}
                    title={label}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-[1rem] transition-colors duration-200 active:scale-95 sm:h-11 sm:w-11 ${focusRingCls} ${isActive ? (isDark ? 'text-white' : 'text-indigo-600') : (isDark ? 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100')}`}
                  >
                    {icon}
                  </Link>
                </React.Fragment>
              );
            })}

            <span className={`ml-1 h-8 w-px ${isDark ? 'bg-white/[0.08]' : 'bg-slate-300/80'}`} />

            <motion.button
              type="button"
              onClick={onToggleTheme}
              animate={themeToggleControls}
              className={`relative ml-0.5 flex h-10 w-10 items-center justify-center rounded-[1rem] border transition-colors sm:h-11 sm:w-11 ${focusRingCls} ${isDark ? 'border-white/[0.08] bg-white/[0.04] text-white/65 hover:text-white' : 'border-slate-200 bg-white/90 text-slate-600 hover:text-slate-950'}`}
              aria-label={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
              aria-pressed={!isDark}
            >
              <motion.span
                className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: isDark ? 1 : 0, rotate: isDark ? 0 : -90, scale: isDark ? 1 : 0.7 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <Sun size={17} strokeWidth={1.5} />
              </motion.span>
              <motion.span
                className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: isDark ? 0 : 1, rotate: isDark ? 90 : 0, scale: isDark ? 0.7 : 1 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <Moon size={17} strokeWidth={1.5} />
              </motion.span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}