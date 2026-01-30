'use client';

import { cn } from '@/lib/utils';
import type { BlockchainStatus } from '@/types/transfer-request';

/**
 * Status configuration mapping blockchain_status to UI representation.
 * Colors match the design system in tailwind.config.ts.
 * 
 * v0.3.0: Added 'received' (initial state) and 'expired' (terminal error).
 */
const statusConfig: Record<
  BlockchainStatus,
  { label: string; colorClass: string; bgClass: string; pulse: boolean; description?: string }
> = {
  received: {
    label: 'Validating',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-400',
    pulse: true,
    description: 'Request received, running compliance checks...',
  },
  pending: {
    // Legacy status - treat same as 'received'
    label: 'Validating',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-400',
    pulse: true,
    description: 'Request received, running compliance checks...',
  },
  pending_submission: {
    label: 'Queued',
    colorClass: 'text-status-pending',
    bgClass: 'bg-status-pending',
    pulse: true,
    description: 'Approved, waiting for blockchain submission...',
  },
  processing: {
    label: 'Processing',
    colorClass: 'text-status-pending',
    bgClass: 'bg-status-pending',
    pulse: true,
    description: 'Submitting to Solana...',
  },
  submitted: {
    label: 'Submitted',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-400',
    pulse: true,
    description: 'On-chain, awaiting finalization...',
  },
  confirmed: {
    label: 'Confirmed',
    colorClass: 'text-status-confirmed',
    bgClass: 'bg-status-confirmed',
    pulse: false,
    description: 'Transaction finalized on Solana',
  },
  failed: {
    label: 'Failed',
    colorClass: 'text-status-failed',
    bgClass: 'bg-status-failed',
    pulse: false,
    description: 'Submission failed after max retries',
  },
  expired: {
    label: 'Expired',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500',
    pulse: false,
    description: 'Blockhash expired - please re-sign and retry',
  },
};

interface StatusBadgeProps {
  status: BlockchainStatus;
  /** Show tooltip with status description on hover */
  showTooltip?: boolean;
}

export function StatusBadge({ status, showTooltip = false }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.received;

  return (
    <div 
      className="flex items-center gap-2"
      title={showTooltip ? config.description : undefined}
    >
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

/**
 * Get the user-friendly description for a status.
 * Useful for displaying in modals or detail views.
 */
export function getStatusDescription(status: BlockchainStatus): string {
  const config = statusConfig[status] ?? statusConfig.received;
  return config.description ?? 'Unknown status';
}
