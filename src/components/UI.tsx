import React, { useId } from 'react';
import { uiClasses } from '../styles/uiClasses';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
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
  const baseStyles = `inline-flex items-center justify-center gap-2 font-meta text-[11px] font-semibold uppercase tracking-[0.22em] transition-all duration-200 rounded-xl border active:scale-[0.98] ${
    isDark
      ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]'
      : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8fafc]'
  }`;

  const variants = {
    primary: `${colorBg} text-white border-white/10 shadow-[0_18px_38px_rgba(99,102,241,0.30)] hover:-translate-y-0.5`,
    secondary: `${isDark ? 'bg-slate-900/75 border-white/10 text-white hover:border-white/20 hover:bg-slate-900/95' : 'bg-white/90 border-slate-200/80 text-slate-900 hover:border-slate-300 hover:bg-white'}`,
    ghost: `border-transparent ${isDark ? 'text-white/45 hover:text-white/75 hover:bg-white/[0.04]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/80'}`,
    danger: `border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10`,
  };

  const sizes = {
    sm: 'h-9 px-3.5 text-[10px]',
    md: 'h-11 px-4.5 text-[11px]',
    lg: 'h-12 px-6 text-xs',
  };

  return (
    <button
      className={cx(baseStyles, variants[variant], sizes[size], className)}
      aria-label={ariaLabel}
      {...props}
    />
  );
};

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  isDark?: boolean;
  children: React.ReactNode;
  role?: string;
}

export const Card: React.FC<CardProps> = ({ isDark = true, className, children, role, ...props }) => {
  const baseStyles = uiClasses.card.base(isDark);

  return (
    <div
      className={cx('relative overflow-hidden', baseStyles, className)}
      role={role}
      {...props}
    >
      <div className={cx('pointer-events-none absolute inset-0', isDark ? 'bg-gradient-to-br from-white/[0.08] via-transparent to-slate-950/35' : 'bg-gradient-to-br from-white/85 via-transparent to-slate-100/80')} />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  isDark?: boolean;
  label?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const Input: React.FC<InputProps> = ({ 
  isDark = true, 
  label, 
  className, 
  id,
  ariaLabel,
  ariaDescribedBy,
  ...props 
}) => {
  const baseStyles = uiClasses.input.base(isDark);
  const focusStyles = isDark
    ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a]'
    : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8fafc]';
  
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div>
      {label && <label htmlFor={inputId} className={cx('mb-2 block font-meta text-[10px] font-semibold uppercase tracking-[0.24em]', uiClasses.text.secondary(isDark))}>{label}</label>}
      <input
        id={inputId}
        className={cx('w-full rounded-xl border px-4 py-3 text-sm font-medium transition-all shadow-sm', baseStyles, focusStyles, className)}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        {...props}
      />
    </div>
  );
};

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
  isDark?: boolean;
  ariaLabel?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  isDark = true, 
  children,
  ariaLabel 
}) => {
  const variants = {
    default: isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700',
    success: isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-50 text-emerald-700',
    warning: isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700',
    danger: isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-50 text-rose-700',
  };

  return (
    <span 
      className={cx('inline-flex items-center rounded-full px-3 py-1.5 font-meta text-[10px] font-semibold uppercase tracking-[0.2em]', variants[variant])}
      role="status"
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  isDark?: boolean;
  ariaLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  isDark = true,
  ariaLabel 
}) => {
  const baseId = useId();
  const titleId = title ? `${baseId}-title` : undefined;
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/78 backdrop-blur-xl"
      onClick={onClose}
      role="presentation"
      aria-hidden={!isOpen}
    >
      <Card 
        isDark={isDark} 
        className="max-h-[92vh] w-full max-w-md overflow-y-auto p-6 sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={ariaLabel || title}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 id={titleId} className={cx('mb-4 font-display text-2xl font-extrabold tracking-[-0.02em]', isDark ? 'text-white' : 'text-slate-950')}>{title}</h2>}
        {children}
      </Card>
    </div>
  );
};

type PageWidth = 'panel' | 'narrow' | 'section' | 'wide' | 'full';
type PageTopSpacing = 'compact' | 'default' | 'hero';
type SectionPadding = 'sm' | 'md' | 'lg';

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
  const widthClass = width === 'full' ? uiClasses.maxWidth.full : uiClasses.maxWidth[width];

  return (
    <div
      className={cx('mx-auto w-full', widthClass, uiClasses.spacing.sectionX, uiClasses.page.shell[topSpacing], className)}
      {...props}
    >
      {children}
    </div>
  );
};

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
          <div className={cx(uiClasses.page.eyebrow(isDark), eyebrowClassName)}>{eyebrow}</div>
        ) : null}
        <h1 className={cx(uiClasses.page.title, uiClasses.text.primary(isDark), titleClassName)}>{title}</h1>
        {description ? (
          <p className={cx('mt-3', uiClasses.page.description(isDark), descriptionClassName)}>{description}</p>
        ) : null}
      </div>

      {actions ? <div className="flex items-center gap-2 self-start">{actions}</div> : null}
    </header>
  );
};

interface SectionCardProps extends CardProps {
  padding?: SectionPadding;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  isDark = true,
  padding = 'md',
  className,
  children,
  ...props
}) => {
  const paddingClass = padding === 'sm' ? 'p-4 sm:p-5' : padding === 'lg' ? 'p-6 sm:p-7' : uiClasses.spacing.cardPadding;

  return (
    <Card
      isDark={isDark}
      className={cx(paddingClass, className)}
      {...props}
    >
      {children}
    </Card>
  );
};

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
        <p className={cx('font-meta text-[10px] font-semibold uppercase tracking-[0.24em]', uiClasses.text.secondary(isDark), labelClassName)}>
          {label}
        </p>
      </div>
      <div className={cx('font-num text-xl sm:text-2xl font-extrabold tracking-[-0.02em]', valueClassName)}>{value}</div>
      {meta ? (
        <p className={cx('mt-3 text-xs leading-6', uiClasses.text.secondary(isDark), metaClassName)}>{meta}</p>
      ) : null}
    </SectionCard>
  );
};
