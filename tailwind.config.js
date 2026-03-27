/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        meta: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.01em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.005em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.005em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.015em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'step-0': ['1rem', { lineHeight: '1.6' }],
        'step-1': ['1.25rem', { lineHeight: '1.45', letterSpacing: '-0.01em' }],
        'step-2': ['1.5625rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        'step-3': ['1.9375rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'step-4': ['2.4375rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
      },
      colors: {
        pack: {
          bg: '#0F172A',
          surface: '#1E293B',
          primary: '#6366F1',
          success: '#10B981',
          border: 'rgba(255,255,255,0.10)',
        },
        knapsack: {
          dark: {
            bg: '#06060a',
            surface: 'rgba(255,255,255,0.035)',
            border: 'rgba(255,255,255,0.08)',
            text: '#eeecf5',
            'text-primary': '#eeecf5',
            'text-secondary': 'rgba(255,255,255,0.65)',
            'text-tertiary': 'rgba(255,255,255,0.45)',
            'text-muted': 'rgba(255,255,255,0.25)',
          },
          light: {
            bg: '#f2f1ed',
            surface: '#ffffff',
            border: 'rgba(0,0,0,0.07)',
            text: '#1a1920',
            'text-primary': '#1a1920',
            'text-secondary': 'rgba(0,0,0,0.6)',
            'text-tertiary': 'rgba(0,0,0,0.45)',
            'text-muted': 'rgba(0,0,0,0.35)',
          },
        },
      },
      borderRadius: {
        // Legacy
        bento: '1.5rem',
        ui: '0.75rem',
        // Semantic tokens
        card: '2rem',       // main cards and modals
        dock: '1.85rem',    // floating nav dock
        fab: '1.5rem',      // floating action button
        sheet: '1.75rem',   // bottom sheets
        pill: '9999px',     // pill badges/buttons
        tag: '0.5rem',      // small tags and chips
        btn: '0.75rem',     // standard buttons and inputs
        'btn-lg': '1rem',   // larger buttons
        widget: '1.25rem',  // widget cards, smaller panels
      },
      backgroundImage: {
        'pack-grid': 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
        'pack-noise': 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)',
      },
      boxShadow: {
        // Legacy
        'pack-glow': '0 0 30px rgba(99,102,241,0.15)',
        'pack-card': '0 24px 80px rgba(2,6,23,0.36)',
        // Semantic tokens
        'card-dark': '0 24px 80px rgba(2,6,23,0.36), inset 0 1px 0 rgba(255,255,255,0.06)',
        'card-light': '0 8px 32px rgba(0,0,0,0.05), 0 1px 0 rgba(0,0,0,0.03)',
        'modal-dark': '0 40px 120px rgba(2,6,23,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
        'modal-light': '0 20px 60px rgba(0,0,0,0.12)',
        'fab-dark': '0 18px 48px rgba(99,102,241,0.32), 0 0 0 1px rgba(255,255,255,0.06)',
        'fab-light': '0 8px 30px rgba(0,0,0,0.08)',
        'dock-dark': '0 28px 80px rgba(2,6,23,0.34)',
        'dock-light': '0 8px 32px rgba(0,0,0,0.06)',
        'btn-primary': '0 10px 28px rgba(99,102,241,0.28)',
        'btn-primary-hover': '0 14px 36px rgba(99,102,241,0.38)',
        'inner-highlight': 'inset 0 1px 0 rgba(255,255,255,0.08)',
        'glow-indigo': '0 0 30px rgba(99,102,241,0.18)',
        'glow-emerald': '0 0 30px rgba(16,185,129,0.18)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};

