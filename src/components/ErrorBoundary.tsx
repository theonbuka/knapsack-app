import React, { ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDark = localStorage.getItem('knapsack_theme') === 'true';

      return (
        <div
          className={`min-h-screen flex items-center justify-center p-4 ${
            isDark ? 'pack-grid-shell bg-pack-bg' : 'bg-[#f8fafc]'
          }`}
        >
          <div
            className={`max-w-md w-full rounded-[2rem] p-8 ${
              isDark
                ? 'border border-white/10 bg-slate-900/70 shadow-pack-card backdrop-blur-xl'
                : 'border border-slate-200/80 bg-white/92 shadow-[0_24px_60px_rgba(15,23,42,0.08)]'
            }`}
          >
            <div className="flex justify-center mb-6">
              <div
                className={`p-3 rounded-full ${
                  isDark ? 'bg-red-500/10' : 'bg-red-50'
                }`}
              >
                <AlertCircle className="text-red-500" size={32} />
              </div>
            </div>

            <h1
              className={`mb-2 text-center font-display text-2xl font-extrabold tracking-[-0.02em] ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Bir hata oluştu
            </h1>

            <p
              className={`text-center mb-6 ${
                isDark ? 'text-white/60' : 'text-slate-600'
              }`}
            >
              Uygulamada beklenmeyen bir hata meydana geldi. Lütfen aşağıdaki
              seçeneklerden birini deneyin.
            </p>

            {this.state.error && (
              <div
                className={`mb-6 p-3 rounded-lg text-sm overflow-auto max-h-32 ${
                  isDark
                    ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                <p className="font-mono break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold uppercase tracking-[0.18em] transition-colors ${
                  isDark
                    ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_14px_32px_rgba(99,102,241,0.24)]'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                }`}
              >
                <RefreshCw size={18} strokeWidth={1.5} />
                Yenile
              </button>

              <button
                onClick={this.handleReset}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold uppercase tracking-[0.18em] transition-colors ${
                  isDark
                    ? 'bg-slate-950/55 hover:bg-slate-950/75 text-white border border-white/10'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                }`}
              >
                <Home size={18} strokeWidth={1.5} />
                Ana Sayfa
              </button>
            </div>

            <p
              className={`text-center text-xs mt-4 ${
                isDark ? 'text-white/40' : 'text-slate-500'
              }`}
            >
              Sorun devam ederse, lütfen iletişime geçin
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
