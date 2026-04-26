'use client';

import type { HealthStatus } from '@/services/health';
import type {
  BlockchainStatus,
  ComplianceStatus,
  TransferRequest,
} from '@/types/transfer-request';
import { formatAddress } from '@/lib/utils';

export type ChipTone = 'healthy' | 'neutral' | 'danger' | 'warning' | 'muted';

export const INITIAL_HEALTH = {
  status: 'degraded' as HealthStatus,
  database: 'degraded' as HealthStatus,
  blockchain: 'degraded' as HealthStatus,
  timestamp: '1970-01-01T00:00:00.000Z',
  version: '0.3.0',
};

export const numberFormatter = new Intl.NumberFormat('en-US');

export function statusTone(
  status: HealthStatus | BlockchainStatus | ComplianceStatus | null | undefined
): ChipTone {
  if (status === 'healthy' || status === 'confirmed' || status === 'approved') {
    return 'healthy';
  }
  if (
    status === 'unhealthy' ||
    status === 'failed' ||
    status === 'expired' ||
    status === 'rejected'
  ) {
    return 'danger';
  }
  if (status === 'processing' || status === 'submitted') {
    return 'warning';
  }
  if (!status) {
    return 'muted';
  }
  return 'neutral';
}

export function healthLabel(status: HealthStatus, healthyLabel = 'Online'): string {
  if (status === 'healthy') return healthyLabel;
  if (status === 'degraded') return 'Degraded';
  return 'Unhealthy';
}

export function titleCaseStatus(status: string): string {
  return status
    .split('_')
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ');
}

export function complianceLabel(status: ComplianceStatus): string {
  if (status === 'approved') return 'Clear';
  if (status === 'rejected') return 'Flagged';
  return 'Pending';
}

export function settlementLabel(transfer: TransferRequest): string {
  if (transfer.compliance_status === 'rejected') {
    return 'rejected_before_settlement';
  }
  if (transfer.blockchain_status === 'confirmed') {
    return 'confirmed';
  }
  if (transfer.blockchain_status === 'failed' || transfer.blockchain_status === 'expired') {
    return 'failed_or_expired';
  }
  return transfer.blockchain_status;
}

export function settlementTone(transfer: TransferRequest): ChipTone {
  const settlement = settlementLabel(transfer);
  if (settlement === 'rejected_before_settlement' || settlement === 'failed_or_expired') {
    return 'danger';
  }
  return statusTone(transfer.blockchain_status);
}

export function getTokenSymbol(tokenMint: string | null | undefined): string {
  if (!tokenMint) return 'SOL';
  const knownMints: Record<string, string> = {
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
  };
  return knownMints[tokenMint] ?? 'TOKEN';
}

export function formatTransferAmount(transfer: TransferRequest): string {
  if (transfer.transfer_details.type === 'confidential') {
    return 'Confidential';
  }

  const token = getTokenSymbol(transfer.token_mint);
  const divisor = token === 'SOL' ? 1_000_000_000 : 1_000_000;
  const amount = transfer.transfer_details.amount / divisor;

  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: amount >= 1 ? 2 : 4,
    maximumFractionDigits: token === 'SOL' ? 6 : 4,
  })} ${token}`;
}

export function formatAuditAmount(
  amount:
    | { visibility: 'public'; amount: number }
    | { visibility: 'confidential'; marker: string },
  tokenMint?: string | null
): string {
  if (amount.visibility === 'confidential') {
    return amount.marker || 'Confidential';
  }

  const token = getTokenSymbol(tokenMint);
  const divisor = token === 'SOL' ? 1_000_000_000 : 1_000_000;
  const normalized = amount.amount / divisor;
  return `${normalized.toLocaleString('en-US', {
    minimumFractionDigits: normalized >= 1 ? 2 : 4,
    maximumFractionDigits: token === 'SOL' ? 6 : 4,
  })} ${token}`;
}

export function formatDateTime(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Unavailable';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTraceTime(isoDate: string | null | undefined): string {
  if (!isoDate) return '--:--:--.---';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '--:--:--.---';
  const time = date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${time}.${date.getMilliseconds().toString().padStart(3, '0')}`;
}

export function isWithinLast24Hours(isoDate: string): boolean {
  return Date.now() - new Date(isoDate).getTime() <= 24 * 60 * 60 * 1000;
}

export function transferShortId(transfer: TransferRequest): string {
  return `tx_${transfer.id.slice(0, 8)}`;
}

export function transferCounterparty(transfer: TransferRequest): string {
  return `${formatAddress(transfer.to_address, 4)} / ${formatAddress(transfer.from_address, 4)}`;
}

export function transferMatchesQuery(transfer: TransferRequest, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [
    transfer.id,
    transfer.from_address,
    transfer.to_address,
    transfer.blockchain_signature ?? '',
    transfer.nonce ?? '',
    formatTransferAmount(transfer),
    transfer.compliance_status,
    transfer.blockchain_status,
  ]
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

export function transferAmountNumber(transfer: TransferRequest): number {
  return transfer.transfer_details.type === 'public' ? transfer.transfer_details.amount : -1;
}

export function activeTransferCount(transfers: TransferRequest[]): number {
  return transfers.filter((transfer) =>
    ['received', 'pending', 'pending_submission', 'processing', 'submitted'].includes(
      transfer.blockchain_status
    )
  ).length;
}
