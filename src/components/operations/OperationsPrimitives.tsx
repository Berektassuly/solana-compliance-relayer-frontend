'use client';

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import type { ChipTone } from './operations-utils';

const chipStyles: Record<ChipTone, { shell: string; dot: string; text: string }> = {
  healthy: {
    shell: 'border-[rgba(78,222,163,0.5)] bg-[rgba(108,248,187,0.3)]',
    dot: 'bg-[#006c49]',
    text: 'text-[#00714d]',
  },
  neutral: {
    shell: 'border-[rgba(200,197,202,0.5)] bg-[#e5e2e1]',
    dot: 'bg-[#78767b]',
    text: 'text-[#47464a]',
  },
  danger: {
    shell: 'border-[rgba(186,26,26,0.5)] bg-[#fff4f4]',
    dot: 'bg-[#ba1a1a]',
    text: 'text-[#ba1a1a]',
  },
  warning: {
    shell: 'border-[rgba(184,111,0,0.45)] bg-[#fff8eb]',
    dot: 'bg-[#8a5300]',
    text: 'text-[#8a5300]',
  },
  muted: {
    shell: 'border-[#e4e4e7] bg-[#fafafa]',
    dot: 'bg-[#a1a1aa]',
    text: 'text-[#71717a]',
  },
};

export function StatusChip({
  label,
  tone = 'neutral',
  className = '',
}: {
  label: string;
  tone?: ChipTone;
  className?: string;
}) {
  const styles = chipStyles[tone];
  return (
    <span
      className={`inline-flex h-[22px] items-center gap-2 rounded-[2px] border px-[8px] font-sans text-[11px] font-semibold leading-4 tracking-[0.55px] ${styles.shell} ${styles.text} ${className}`}
    >
      <span className={`h-[6px] w-[6px] rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
}

export function InlineStatus({ label, tone }: { label: string; tone: ChipTone }) {
  const dot = chipStyles[tone].dot;
  const text =
    tone === 'danger'
      ? 'text-[#ba1a1a]'
      : tone === 'healthy'
        ? 'text-[#00714d]'
        : tone === 'warning'
          ? 'text-[#8a5300]'
          : 'text-[#47464a]';
  return (
    <span className={`inline-flex items-center gap-[6px] text-[12px] leading-[18px] ${text}`}>
      <span className={`h-[6px] w-[6px] rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export function IconButton({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-[40px] w-[40px] items-center justify-center rounded-[2px] text-[#47464a] transition hover:bg-[#e5e2e1] hover:text-[#18181b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] disabled:cursor-not-allowed disabled:opacity-50 sm:h-[28px] sm:w-[28px]"
    >
      {children}
    </button>
  );
}

export function Panel({
  title,
  action,
  children,
  className = '',
  bodyClassName = '',
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`min-w-0 max-w-full overflow-hidden rounded-[2px] border border-[#c8c5ca] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] ${className}`}
    >
      <div className="flex min-h-[49px] items-center justify-between gap-[12px] border-b border-[#c8c5ca] bg-[#fafafa] px-[16px] py-[10px]">
        <h2 className="text-[18px] font-semibold leading-6 tracking-[-0.18px] text-[#1c1b1b]">
          {title}
        </h2>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function PrimaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex h-[36px] items-center justify-center gap-[8px] rounded-[2px] bg-black px-[16px] text-[13px] font-medium leading-[18px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition hover:bg-[#2b2b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex h-[36px] items-center justify-center gap-[8px] rounded-[2px] border border-[#c8c5ca] bg-white px-[14px] text-[13px] font-medium leading-[18px] text-[#1c1b1b] shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-w-0 max-w-full flex-col items-stretch justify-between gap-[10px] border border-[rgba(186,26,26,0.35)] bg-[#fff8f8] px-[12px] py-[10px] text-[12px] leading-4 text-[#ba1a1a] sm:flex-row sm:items-center sm:gap-[12px]">
      <div className="flex min-w-0 items-center gap-[8px]">
        <AlertCircle className="h-[14px] w-[14px] shrink-0" aria-hidden="true" />
        <span className="truncate">{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-[28px] shrink-0 items-center justify-center gap-[6px] rounded-[2px] border border-[rgba(186,26,26,0.35)] bg-white px-[8px] text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ba1a1a]"
        >
          <RefreshCw className="h-[12px] w-[12px]" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  compact = false,
}: {
  title: string;
  body: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-[8px] text-center text-[#71717a] ${
        compact ? 'px-[16px] py-[20px]' : 'px-[24px] py-[48px]'
      }`}
    >
      <Inbox className="h-[22px] w-[22px] opacity-60" aria-hidden="true" />
      <div>
        <p className="text-[13px] font-medium leading-[18px] text-[#47464a]">{title}</p>
        <p className="mt-[2px] max-w-[320px] text-[12px] leading-4">{body}</p>
      </div>
    </div>
  );
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[2px] bg-[#efebea] ${className}`} />;
}

export function KeyValue({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-[12px] border-b border-[#e4e4e7] py-[9px] last:border-b-0">
      <span className="text-[12px] leading-4 text-[#71717a]">{label}</span>
      <span
        className={`min-w-0 truncate text-right text-[12px] leading-4 text-[#1c1b1b] ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-[6px] block text-[12px] font-semibold uppercase leading-4 tracking-[0.55px] text-[#47464a]"
    >
      {children}
    </label>
  );
}

export function TextInput({
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-[36px] w-full rounded-[2px] border border-[#c8c5ca] bg-white px-[10px] text-[13px] leading-[18px] text-[#1c1b1b] outline-none placeholder:text-[#71717a] focus:border-[#18181b] focus-visible:ring-2 focus-visible:ring-[#18181b] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[#fafafa] disabled:text-[#71717a] ${className}`}
      {...props}
    />
  );
}

export function TextArea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-[76px] w-full resize-y rounded-[2px] border border-[#c8c5ca] bg-white px-[10px] py-[8px] text-[13px] leading-[18px] text-[#1c1b1b] outline-none placeholder:text-[#71717a] focus:border-[#18181b] focus-visible:ring-2 focus-visible:ring-[#18181b] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[#fafafa] disabled:text-[#71717a] ${className}`}
      {...props}
    />
  );
}
