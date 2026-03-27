import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { getSupabaseAuthClient, readAuthCallbackParams } from '../utils/supabaseAuth';

const inputClassName = 'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200';

type AuthMode = 'login' | 'register';

export default function Landing() {
  const { t } = useTranslation();
  usePageMeta(t('landing.login'), 'Payonar hesabına giriş veya yeni hesap oluşturma ekranı.');

  const navigate = useNavigate();
  const {
    login,
    register,
    loginWithGoogleRedirect,
    loginAsDemo,
    requestPasswordReset,
    updatePassword,
    isAuthenticated,
    canUseGoogleRedirect,
    error: authError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);

  const error = localError || authError || '';

  useEffect(() => {
    const params = readAuthCallbackParams(window.location.href);
    const code = params.get('code');
    const tokenHash = params.get('token_hash');
    const token = params.get('token');
    const callbackType = params.get('type');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const googleIdToken = params.get('google_id_token');
    const googleError = params.get('google_error');

    if (!code && !((tokenHash || token) && callbackType) && !(accessToken && refreshToken) && !googleIdToken && !googleError) {
      return;
    }

    window.history.replaceState({}, '', window.location.pathname);

    if (googleError) {
      setLocalError(googleError);
      setIsGoogleLoading(false);
      return;
    }

    const supabase = getSupabaseAuthClient();
    if (!supabase) {
      setLocalError(t('landing.errors.authConnectError'));
      return;
    }

    setIsGoogleLoading(true);
    const applyCallback = async () => {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          throw exchangeError;
        }
        return;
      }

      if ((tokenHash || token) && callbackType) {
        const verifyPayload = tokenHash
          ? {
            token_hash: tokenHash,
            type: callbackType as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'email',
          }
          : {
            token: token as string,
            type: callbackType as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'email',
          };

        const { error: verifyError } = await supabase.auth.verifyOtp(verifyPayload as never);
        if (verifyError) {
          throw verifyError;
        }

        if (callbackType === 'recovery') {
          setIsRecoveryMode(true);
          setIsForgotPasswordMode(false);
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setInfoMessage(t('landing.info.newPasswordHint'));
          return;
        }

        setInfoMessage(t('landing.info.emailVerified'));
        return;
      }

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) {
          throw sessionError;
        }
        return;
      }

      if (googleIdToken) {
        const { error: idTokenError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: googleIdToken,
        });
        if (idTokenError) {
          throw idTokenError;
        }
      }
    };

    void applyCallback()
      .then(() => {
        setLocalError('');
        setIsGoogleLoading(false);
      })
      .catch((err) => {
        console.error('Auth callback exception:', err);
        setLocalError(t('landing.errors.callbackFailed'));
        setIsGoogleLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isRecoveryMode) {
      setIsGoogleLoading(false);
      navigate('/');
    }
  }, [isAuthenticated, isRecoveryMode, navigate]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');
    setInfoMessage('');

    if (mode === 'register') {
      const result = await register(name, surname, email, password);
      if (result.success) {
        navigate('/');
        return;
      }

      if (result.requiresVerification) {
        setMode('login');
        setPassword('');
        setInfoMessage(result.message || t('landing.info.verificationSent'));
        return;
      }

      if (!authError) {
        setLocalError(result.message || t('landing.errors.registerFailed'));
      }
      return;
    }

    const ok = await login(email, password);
    if (ok) {
      navigate('/');
      return;
    }

    if (!authError) {
      setLocalError(t('landing.errors.loginFailed'));
    }
  };

  const onGoogleLogin = async () => {
    setLocalError('');
    setInfoMessage('');
    setIsGoogleLoading(true);

    try {
      if (isAuthenticated) {
        setLocalError(t('landing.errors.alreadyLoggedIn'));
        return;
      }

      if (!canUseGoogleRedirect) {
        setLocalError(t('landing.errors.googleNotConfigured'));
        return;
      }

      const result = await loginWithGoogleRedirect();
      if (!result.success) {
        setLocalError(result.message || t('landing.errors.googleFailed'));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onForgotPassword = async () => {
    setLocalError('');
    setInfoMessage('');

    const result = await requestPasswordReset(email);
    if (result.success) {
      setInfoMessage(result.message || t('landing.info.resetSent'));
      return;
    }

    if (!authError) {
      setLocalError(result.message || t('landing.errors.resetFailed'));
    }
  };

  const onUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');
    setInfoMessage('');

    if (password !== confirmPassword) {
      setLocalError(t('landing.errors.passwordMismatch'));
      return;
    }

    setIsRecoveryLoading(true);
    try {
      const result = await updatePassword(password);
      if (!result.success) {
        if (!authError) {
          setLocalError(result.message || t('landing.errors.passwordUpdateFailed'));
        }
        return;
      }

      setIsRecoveryMode(false);
      setPassword('');
      setConfirmPassword('');
      setInfoMessage(result.message || t('landing.info.passwordUpdated'));
    } finally {
      setIsRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-2 lg:items-center lg:px-10">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            <Wallet size={14} /> Payonar
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t('landing.headline')}</h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              {t('landing.subheadline')}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('landing.securityTitle')}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t('landing.securityDesc')}</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t('landing.googleLoginTitle')}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t('landing.googleLoginDesc')}</p>
            </article>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs text-slate-600">
            <ShieldCheck size={16} className="text-emerald-600" />
            {t('landing.authGuard')}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_12px_50px_rgba(15,23,42,0.08)] sm:p-8"
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('landing.account')}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{mode === 'login' ? t('landing.welcome') : t('landing.createAccount')}</h2>
            </div>
            <Sparkles size={18} className="text-slate-500" />
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setIsForgotPasswordMode(false);
                setIsRecoveryMode(false);
                setLocalError('');
                setInfoMessage('');
              }}
              className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${mode === 'login' ? 'bg-white text-slate-900' : 'text-slate-500'}`}
            >
              {t('landing.login')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setIsForgotPasswordMode(false);
                setIsRecoveryMode(false);
                setLocalError('');
                setInfoMessage('');
              }}
              className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${mode === 'register' ? 'bg-white text-slate-900' : 'text-slate-500'}`}
            >
              {t('landing.register')}
            </button>
          </div>

          {isRecoveryMode ? (
            <form onSubmit={onUpdatePassword} className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                {t('landing.recovery.title')}
              </div>

              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${inputClassName} pl-11 pr-12`}
                  placeholder={t('landing.newPassword')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? t('landing.hidePassword') : t('landing.showPassword')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${inputClassName} pl-11 pr-12`}
                  placeholder={t('landing.confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  onClick={() => setShowConfirmPassword(value => !value)}
                  aria-label={showConfirmPassword ? t('landing.hidePassword') : t('landing.showPassword')}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
              {infoMessage ? <p className="text-xs font-medium text-emerald-700">{infoMessage}</p> : null}

              <button
                type="submit"
                disabled={isRecoveryLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                {isRecoveryLoading ? t('landing.recovery.saving') : t('landing.recovery.savePassword')}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'register' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <input className={inputClassName} placeholder={t('landing.firstName')} value={name} onChange={event => setName(event.target.value)} autoComplete="given-name" />
                <input className={inputClassName} placeholder={t('landing.lastName')} value={surname} onChange={event => setSurname(event.target.value)} autoComplete="family-name" />
              </div>
            ) : null}

            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClassName} pl-11`}
                placeholder="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
              />
            </div>

            <div className="relative">
              <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputClassName} pl-11 pr-12`}
                  placeholder={t('landing.password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? t('landing.hidePassword') : t('landing.showPassword')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {mode === 'login' ? (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordMode(true);
                    setLocalError('');
                    setInfoMessage(t('landing.forgotHint'));
                  }}
                  className="text-xs font-semibold text-slate-500 transition hover:text-slate-900"
                >
                  {t('landing.forgotPassword')}
                </button>
              </div>
            ) : null}

            {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
            {infoMessage ? <p className="text-xs font-medium text-emerald-700">{infoMessage}</p> : null}

            {isForgotPasswordMode ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {t('landing.sendResetEmail')}
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordMode(false);
                    setLocalError('');
                    setInfoMessage('');
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                >
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {mode === 'login' ? t('landing.loginButton') : t('landing.registerButton')}
                <ArrowRight size={16} />
              </button>
            )}
          </form>
          )}

          <div className="my-6 h-px bg-slate-200" />

          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={isGoogleLoading || !canUseGoogleRedirect}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {isGoogleLoading ? t('landing.googleLoading') : t('landing.googleLogin')}
          </button>

          <button
            type="button"
            onClick={() => { loginAsDemo(); navigate('/'); }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 mt-3"
          >
            {t('landing.demoLogin')}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            {t('landing.authSupport')}
          </p>
        </motion.section>
      </div>
    </div>
  );
}
