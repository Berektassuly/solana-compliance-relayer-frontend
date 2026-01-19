'use client';

import { cn } from '@/lib/utils';
import type { BlockchainStatus } from '@/types/transfer-request';

interface StatusBadgeProps {
  status: BlockchainStatus;
}

/**
 * Status configuration mapping blockchain_status to UI representation.
 * Colors match the design system in tailwind.config.ts.
 */
const statusConfig: Record<
  BlockchainStatus,
  { label: string; colorClass: string; bgClass: string; pulse: boolean }
> = {
  pending: {
    label: 'Pending',
    colorClass: 'text-gray-400',
    bgClass: 'bg-gray-400',
    pulse: false,
  },
  pending_submission: {
    label: 'Queued',
    colorClass: 'text-status-pending',
    bgClass: 'bg-status-pending',
    pulse: true,
  },
  processing: {
    label: 'Processing',
    colorClass: 'text-status-pending',
    bgClass: 'bg-status-pending',
    pulse: true,
  },
  submitted: {
    label: 'Submitted',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-400',
    pulse: true,
  },
  confirmed: {
    label: 'Confirmed',
    colorClass: 'text-status-confirmed',
    bgClass: 'bg-status-confirmed',
    pulse: false,
  },
  failed: {
    label: 'Failed',
    colorClass: 'text-status-failed',
    bgClass: 'bg-status-failed',
    pulse: false,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.pending;

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              config.bgClass
            )}
          />
        )}
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            config.bgClass
          )}
        />
      </span>
      <span className={cn('text-sm font-medium', config.colorClass)}>
        {config.label}
      </span>
    </div>
  );
}
