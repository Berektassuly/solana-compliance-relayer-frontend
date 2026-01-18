'use client';

import { cn } from '@/lib/utils';
import type { TransactionStatus } from '@/types/transaction';

interface StatusBadgeProps {
  status: TransactionStatus;
}

const statusConfig: Record<TransactionStatus, { label: string; className: string; pulse: boolean }> = {
  pending: {
    label: 'Pending',
    className: 'text-status-pending',
    pulse: true,
  },
  confirmed: {
    label: 'Confirmed',
    className: 'text-status-confirmed',
    pulse: false,
  },
  failed: {
    label: 'Failed',
    className: 'text-status-failed',
    pulse: false,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              status === 'pending' && 'bg-status-pending'
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            status === 'pending' && 'bg-status-pending',
            status === 'confirmed' && 'bg-status-confirmed',
            status === 'failed' && 'bg-status-failed'
          )}
        />
      </span>
      <span className={cn('text-sm font-medium', config.className)}>
        {config.label}
      </span>
    </div>
  );
}
