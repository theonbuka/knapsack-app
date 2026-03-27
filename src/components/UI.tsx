import React, { useId, useEffect, useRef } from 'react';
import { surface, text, btn, badge, page, spacing, maxWidth, focusRing } from '../styles/uiClasses';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

// ─── Button ─────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isDark?: boolean;
  colorBg?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isDark = true,
  colorBg = 'bg-indigo-600',
  className,
  ariaLabel,
  ...props
}) => {
  const base = `inline-flex items-center justify-center gap-2 font-meta text-[11px] font-semibold uppercase tracking-[0.22em] transition-all duration-200 rounded-btn border active:scale-[0.97] ${focusRing.base(isDark)}`;

  const variants: Record<string, string> = {
    primary: btn.primary(colorBg),
    secondary: btn.secondary(isDark),
    ghost: btn.ghost(isDark),
    danger: btn.danger,
    success: btn.success,
  };

  const sizes = {
    sm: 'h-9 px-3.5 text-[10px] tracking-[0.2em]',
    md: 'h-11 px-5 text-[11px]',
    lg: 'h-12 px-6 text-xs rounded-btn-lg',
  };

  return (
    <button
      className={cx(base, variants[variant], sizes[size], className)}
      aria-label={ariaLabel}
      {...props}
    />
  );
};

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isDark?: boolean;
  children: React.ReactNode;
  role?: string;
  /** When true, omits the inner gradient shine overlay */
  flat?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ isDark = true, className, children, role, flat = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cx('relative overflow-hidden', surface.card(isDark), className)}
        role={role}
        {...props}
      >
        {!flat && (
          <div className={cx(
            'pointer-events-none absolute inset-0',
            isDark
              ? 'bg-gradient-to-br from-white/[0.07] via-transparent to-slate-950/30'
              : 'bg-gradient-to-br from-white via-transparent to-slate-50/60',
          )} />
        )}
        <div className="relative z-[1]">{children}</div>
      </div>
    );
  }
);
Card.displayName = 'Card';

// ─── Input ───────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isDark?: boolean;
  label?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  errorMessage?: string;
}

export const Input: React.FC<InputProps> = ({
  isDark = true,
  label,
  className,
  id,
  ariaLabel,
  ariaDescribedBy,
  errorMessage,
  ...props
}) => {
  const generatedId = useId();
  const errorId = useId();
  const inputId = id || generatedId;
  const focusStyles = isDark
    ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950'
    : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/70 focus-visible:ring-offset-1 focus-visible:ring-offset-white';

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className={cx('mb-2 block font-meta text-[10px] font-semibold uppercase tracking-[0.24em]', text.secondary(isDark))}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cx(
          'w-full rounded-btn border px-4 py-3 text-sm font-medium transition-all shadow-sm',
          surface.input(isDark),
          focusStyles,
          errorMessage && 'border-rose-400/60',
          className,
        )}
        aria-label={ariaLabel}
        aria-describedby={cx(ariaDescribedBy, errorMessage ? errorId : false) || undefined}
        aria-invalid={errorMessage ? true : undefined}
        {...props}
      />
      {errorMessage && (
        <p id={errorId} className="mt-1.5 text-xs text-rose-400" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

// ─── Badge ───────────────────────────────────────────────────────────────────

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
  isDark?: boolean;
  ariaLabel?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  isDark = true,
  children,
  ariaLabel,
}) => {
  const variants: Record<string, string> = {
    default: badge.default(isDark),
    success: badge.success(isDark),
    warning: badge.warning(isDark),
    danger: badge.danger(isDark),
    neutral: badge.neutral(isDark),
  };

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-pill px-2.5 py-1 font-meta text-[10px] font-semibold uppercase tracking-[0.18em]',
        variants[variant],
      )}
      role="status"
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
};

// ─── Modal ───────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  isDark?: boolean;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  isDark = true,
  ariaLabel,
  size = 'md',
}) => {
  const baseId = useId();
  const titleId = title ? `${baseId}-title` : undefined;
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const arr = Array.from(focusable);
    if (arr.length === 0) return;
    const first = arr[0];
    const last = arr[arr.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!isOpen) return null;

  const sizeClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-xl' : 'max-w-md';

  return (
    <div
      className={cx('fixed inset-0 z-50 flex items-center justify-center p-4', surface.overlay(isDark))}
      onClick={onClose}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <Card
        ref={dialogRef}
        isDark={isDark}
        className={cx('max-h-[92vh] w-full overflow-y-auto p-6 sm:p-7', sizeClass)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={ariaLabel || title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {title && (
          <h2
            id={titleId}
            className={cx('mb-5 font-display text-2xl font-extrabold tracking-[-0.025em]', text.primary(isDark))}
          >
            {title}
          </h2>
        )}
        {children}
      </Card>
    </div>
  );
};

// ─── PageShell ───────────────────────────────────────────────────────────────

type PageWidth = 'panel' | 'narrow' | 'section' | 'wide' | 'full';
type PageTopSpacing = 'compact' | 'default' | 'hero';

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: PageWidth;
  topSpacing?: PageTopSpacing;
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
  width = 'section',
  topSpacing = 'default',
  className,
  children,
  ...props
}) => {
  const widthClass = width === 'full' ? maxWidth.full : maxWidth[width];

  return (
    <div
      className={cx('mx-auto w-full', widthClass, spacing.sectionX, page.shell[topSpacing], className)}
      {...props}
    >
      {children}
    </div>
  );
};

// ─── PageHeader ──────────────────────────────────────────────────────────────

interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  isDark?: boolean;
  titleClassName?: string;
  descriptionClassName?: string;
  eyebrowClassName?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  eyebrow = 'Knapsack',
  actions,
  isDark = true,
  className,
  titleClassName,
  descriptionClassName,
  eyebrowClassName,
  ...props
}) => {
  return (
    <header
      className={cx(actions && 'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}
      {...props}
    >
      <div>
        {eyebrow ? (
          <div className={cx(page.eyebrow(isDark), eyebrowClassName)}>{eyebrow}</div>
        ) : null}
        <h1 className={cx(page.title, text.primary(isDark), titleClassName)}>{title}</h1>
        {description ? (
          <p className={cx('mt-3', page.description(isDark), descriptionClassName)}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 self-start">{actions}</div> : null}
    </header>
  );
};

// ─── SectionCard ─────────────────────────────────────────────────────────────

interface SectionCardProps extends CardProps {
  padding?: 'sm' | 'md' | 'lg';
}

export const SectionCard: React.FC<SectionCardProps> = ({
  isDark = true,
  padding = 'md',
  className,
  children,
  ...props
}) => {
  const paddingClass = padding === 'sm' ? 'p-4 sm:p-5' : padding === 'lg' ? 'p-6 sm:p-7' : spacing.cardPadding;

  return (
    <Card isDark={isDark} className={cx(paddingClass, className)} {...props}>
      {children}
    </Card>
  );
};

// ─── MetricCard ──────────────────────────────────────────────────────────────

interface MetricCardProps extends Omit<SectionCardProps, 'children'> {
  label: React.ReactNode;
  value: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  centered?: boolean;
  valueClassName?: string;
  labelClassName?: string;
  metaClassName?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  meta,
  icon,
  centered = false,
  isDark = true,
  className,
  valueClassName,
  labelClassName,
  metaClassName,
  ...props
}) => {
  return (
    <SectionCard
      isDark={isDark}
      padding="sm"
      className={cx('h-full', centered && 'text-center', className)}
      {...props}
    >
      <div className={cx('mb-3 flex gap-1.5', centered ? 'justify-center items-center' : 'items-center')}>
        {icon}
        <p className={cx('font-meta text-[10px] font-semibold uppercase tracking-[0.24em]', text.secondary(isDark), labelClassName)}>
          {label}
        </p>
      </div>
      <div className={cx('font-num text-xl sm:text-2xl font-extrabold tracking-[-0.02em]', valueClassName)}>
        {value}
      </div>
      {meta ? (
        <p className={cx('mt-3 text-xs leading-6', text.secondary(isDark), metaClassName)}>{meta}</p>
      ) : null}
    </SectionCard>
  );
};
