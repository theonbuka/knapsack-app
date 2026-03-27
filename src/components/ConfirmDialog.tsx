import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDark?: boolean;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDark = true,
  variant = 'danger',
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const resolvedTitle = title ?? t('confirm.deleteTitle');
  const resolvedMessage = message ?? t('confirm.deleteMessage');
  const resolvedConfirm = confirmLabel ?? t('confirm.confirmButton');
  const resolvedCancel = cancelLabel ?? t('confirm.cancelButton');

  // Focus management: move focus to cancel button when dialog opens
  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus();
    }
  }, [isOpen]);

  // ESC key closes dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  // Focus trap: keep focus within dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLElement[];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          role="presentation"
          aria-hidden={!isOpen}
          onClick={e => e.target === e.currentTarget && onCancel()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            onKeyDown={handleKeyDown}
            className={`w-full max-w-sm rounded-card p-6 ${
              isDark
                ? 'bg-slate-900/95 border border-white/[0.08] shadow-modal-dark backdrop-blur-2xl'
                : 'bg-white border border-slate-100 shadow-modal-light'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${variant === 'danger' ? 'bg-rose-500/15' : 'bg-amber-500/15'}`}>
                  <AlertTriangle
                    size={20}
                    className={variant === 'danger' ? 'text-rose-400' : 'text-amber-400'}
                    aria-hidden="true"
                  />
                </div>
                <h2
                  id="confirm-dialog-title"
                  className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}
                >
                  {resolvedTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={onCancel}
                aria-label={t('common.close')}
                className={`p-1.5 rounded-xl transition-colors ${isDark ? 'text-white/40 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <p
              id="confirm-dialog-message"
              className={`text-sm leading-6 mb-6 ${isDark ? 'text-white/65' : 'text-slate-600'}`}
            >
              {resolvedMessage}
            </p>

            <div className="flex gap-2.5">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                className={`flex-1 py-3 rounded-btn-lg text-xs font-black uppercase tracking-widest border transition-all ${
                  isDark
                    ? 'border-white/10 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/5'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {resolvedCancel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={onConfirm}
                className={`flex-1 py-3 rounded-btn-lg text-xs font-black uppercase tracking-widest text-white transition-all active:scale-[0.97] ${
                  variant === 'danger'
                    ? 'bg-rose-500 hover:bg-rose-400 shadow-[0_8px_20px_rgba(244,63,94,0.28)]'
                    : 'bg-amber-500 hover:bg-amber-400 shadow-[0_8px_20px_rgba(245,158,11,0.28)]'
                }`}
              >
                {resolvedConfirm}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
