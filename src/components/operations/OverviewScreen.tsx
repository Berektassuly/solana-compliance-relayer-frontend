'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Clock3,
  CreditCard,
  Database,
  Download,
  LockKeyhole,
  MoreHorizontal,
  Radio,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  TerminalSquare,
} from 'lucide-react';

import { fetchHealth, type HealthResponse, type HealthStatus } from '@/services/health';
import { fetchTransferRequests } from '@/services/transfer-requests';
import type { BlockchainStatus, TransferRequest } from '@/types/transfer-request';
import { formatAddress } from '@/lib/utils';
import { OperationsShell } from './OperationsShell';
import {
  EmptyState,
  ErrorBanner,
  IconButton,
  InlineStatus,
  Panel,
  SecondaryButton,
  SkeletonBlock,
  StatusChip,
} from './OperationsPrimitives';
import {
  activeTransferCount,
  complianceLabel,
  formatDateTime,
  formatTraceTime,
  formatTransferAmount,
  healthLabel,
  INITIAL_HEALTH,
  isWithinLast24Hours,
  numberFormatter,
  settlementLabel,
  settlementTone,
  statusTone,
  titleCaseStatus,
  transferMatchesQuery,
  transferShortId,
} from './operations-utils';

interface QueueMetric {
  label: string;
  value: string;
  tone?: 'healthy' | 'danger';
}

interface QueueRow {
  id: string;
  status: BlockchainStatus;
  subtitle: string;
  amount: string;
  meta: string;
  tone: ReturnType<typeof statusTone>;
  icon: 'pending' | 'approved';
}

interface TraceEvent {
  id: string;
  time: string;
  source: string;
  title: string;
  detail: string;
  tone: ReturnType<typeof statusTone>;
}

function useOverviewData() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);

    const [healthResult, transfersResult] = await Promise.allSettled([
      fetchHealth(),
      fetchTransferRequests(100),
    ]);

    const errors: string[] = [];

    if (healthResult.status === 'fulfilled') {
      setHealth(healthResult.value);
    } else {
      errors.push(healthResult.reason instanceof Error ? healthResult.reason.message : 'Health unavailable');
    }

    if (transfersResult.status === 'fulfilled') {
      setTransfers(transfersResult.value.items);
    } else {
      errors.push(
        transfersResult.reason instanceof Error
          ? transfersResult.reason.message
          : 'Transfer queue unavailable'
      );
    }

    setError(errors.length > 0 ? errors.join(' / ') : null);
    setLastUpdated(new Date());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refresh(true);
    }, 0);
    const interval = window.setInterval(() => refresh(false), 10_000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { health, transfers, isLoading, error, lastUpdated, refresh };
}

function buildQueueMetrics(transfers: TransferRequest[]): QueueMetric[] {
  const pending = transfers.filter((transfer) =>
    ['received', 'pending', 'pending_submission'].includes(transfer.blockchain_status)
  ).length;
  const processing = transfers.filter((transfer) =>
    ['processing', 'submitted'].includes(transfer.blockchain_status)
  ).length;
  const failed24h = transfers.filter(
    (transfer) =>
      ['failed', 'expired'].includes(transfer.blockchain_status) &&
      isWithinLast24Hours(transfer.updated_at)
  ).length;
  const blocked = transfers.filter((transfer) => transfer.compliance_status === 'rejected').length;

  return [
    { label: 'PENDING', value: numberFormatter.format(pending) },
    { label: 'PROCESSING', value: numberFormatter.format(processing), tone: 'healthy' },
    { label: 'FAILED (24H)', value: numberFormatter.format(failed24h), tone: 'danger' },
    { label: 'BLOCKED', value: numberFormatter.format(blocked) },
  ];
}

function buildQueueRows(transfers: TransferRequest[]): QueueRow[] {
  return transfers
    .filter((transfer) =>
      ['received', 'pending', 'pending_submission', 'processing', 'submitted'].includes(
        transfer.blockchain_status
      )
    )
    .slice(0, 3)
    .map((transfer): QueueRow => ({
      id: transferShortId(transfer),
      status: transfer.blockchain_status,
      subtitle:
        transfer.blockchain_status === 'submitted'
          ? 'Awaiting confirmation'
          : transfer.compliance_status === 'approved'
            ? 'Approved for settlement'
            : 'Compliance review',
      amount: formatTransferAmount(transfer),
      meta: transfer.blockchain_signature
        ? `Sig ${formatAddress(transfer.blockchain_signature, 4)}`
        : `Retries ${transfer.blockchain_retry_count}/10`,
      tone: statusTone(transfer.blockchain_status),
      icon: transfer.blockchain_status === 'submitted' ? 'approved' : 'pending',
    }));
}

function buildTraceEvents(transfers: TransferRequest[]): TraceEvent[] {
  return transfers.slice(0, 6).map((transfer) => {
    const title =
      transfer.blockchain_status === 'failed'
        ? 'SETTLEMENT_ERROR'
        : transfer.blockchain_status === 'confirmed'
          ? 'TRANSFER_CONFIRMED'
          : transfer.blockchain_status === 'submitted'
            ? 'SIGNATURE_SUBMITTED'
            : transfer.compliance_status === 'rejected'
              ? 'COMPLIANCE_REJECTED'
              : 'STATUS_UPDATE';

    return {
      id: transfer.id,
      time: formatTraceTime(transfer.updated_at),
      source: 'Relayer',
      title,
      detail: transfer.blockchain_last_error
        ? transfer.blockchain_last_error
        : transfer.blockchain_signature
          ? `Signature ${formatAddress(transfer.blockchain_signature, 5)}`
          : `${transfer.compliance_status} / ${transfer.blockchain_status}`,
      tone:
        transfer.compliance_status === 'rejected'
          ? 'danger'
          : statusTone(transfer.blockchain_status),
    };
  });
}

function PageHeader({
  transfers,
  health,
}: {
  transfers: TransferRequest[];
  health: HealthResponse;
}) {
  const handleExport = useCallback(() => {
    const payload = {
      generated_at: new Date().toISOString(),
      health,
      transfers,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relayer-operations-${new Date().toISOString().replaceAll(':', '-')}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [health, transfers]);

  return (
    <div className="flex flex-col gap-[16px] pb-[2px] md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-[4px]">
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.48px] text-[#1c1b1b]">
          Overview
        </h1>
        <p className="text-[13px] leading-[18px] text-[#47464a]">
          Real-time settlement operations and compliance monitoring.
        </p>
      </div>
      <div className="flex items-center gap-[8px]">
        <SecondaryButton onClick={handleExport}>
          <Download className="h-[12px] w-[12px]" aria-hidden="true" />
          Export Logs
        </SecondaryButton>
        <Link
          href="/dashboard/checkout"
          className="inline-flex h-[36px] items-center gap-[8px] rounded-[2px] bg-black px-[16px] text-[13px] font-medium leading-[18px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition hover:bg-[#2b2b2b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] focus-visible:ring-offset-2"
        >
          <CreditCard className="h-[12px] w-[12px]" aria-hidden="true" />
          New Checkout
        </Link>
      </div>
    </div>
  );
}

function DataNotice({
  isLoading,
  error,
  lastUpdated,
  onRefresh,
}: {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  onRefresh: () => void;
}) {
  if (error) {
    return <ErrorBanner message={error} onRetry={onRefresh} />;
  }

  return (
    <div className="flex items-center justify-between border border-[#e4e4e7] bg-white px-[12px] py-[8px] text-[12px] leading-4 text-[#47464a]">
      <div className="flex min-w-0 items-center gap-[8px]">
        <Activity className="h-[14px] w-[14px] shrink-0" aria-hidden="true" />
        <span className="truncate">
          Live backend data active
          {lastUpdated ? ` · updated ${lastUpdated.toLocaleTimeString()}` : ''}
        </span>
      </div>
      <IconButton label="Refresh operations data" onClick={onRefresh} disabled={isLoading}>
        <RefreshCw className={`h-[13px] w-[13px] ${isLoading ? 'animate-spin' : ''}`} />
      </IconButton>
    </div>
  );
}

function NodeStatusPanel({ health }: { health: HealthResponse }) {
  const nodes = [
    {
      label: 'Backend API',
      meta: `v${health.version}`,
      icon: TerminalSquare,
      status: health.status,
      chipLabel: healthLabel(health.status),
    },
    {
      label: 'PostgreSQL DB',
      meta: 'health.database',
      icon: Database,
      status: health.database,
      chipLabel: healthLabel(health.database, 'Healthy'),
    },
    {
      label: 'RPC Client',
      meta: 'health.blockchain',
      icon: Radio,
      status: health.blockchain,
      chipLabel: healthLabel(health.blockchain),
    },
    {
      label: 'Range / AML',
      meta: 'not exposed by /health',
      icon: LockKeyhole,
      status: null,
      chipLabel: 'Unavailable',
    },
  ] satisfies Array<{
    label: string;
    meta: string;
    icon: typeof TerminalSquare;
    status: HealthStatus | null;
    chipLabel: string;
  }>;

  return (
    <Panel
      title="Node Status"
      className="min-h-[345px]"
      action={<Server className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />}
      bodyClassName="px-[16px] pt-[16px]"
    >
      <div className="flex flex-col gap-[16px]">
        {nodes.map((node) => {
          const Icon = node.icon;
          return (
            <div key={node.label} className="flex min-h-[34px] items-center justify-between gap-[12px]">
              <div className="flex min-w-0 items-center gap-[12px]">
                <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[2px] bg-[#f1edec] text-[#47464a]">
                  <Icon className="h-[15px] w-[15px]" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium leading-[18px] text-[#1c1b1b]">
                    {node.label}
                  </div>
                  <div className="truncate font-mono text-[12px] leading-4 text-[#47464a]">
                    {node.meta}
                  </div>
                </div>
              </div>
              <StatusChip label={node.chipLabel} tone={statusTone(node.status)} />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function SettlementQueuePanel({ transfers, isLoading }: { transfers: TransferRequest[]; isLoading: boolean }) {
  const metrics = useMemo(() => buildQueueMetrics(transfers), [transfers]);
  const rows = useMemo(() => buildQueueRows(transfers), [transfers]);
  const activeCount = activeTransferCount(transfers);

  return (
    <Panel
      title="Settlement Queue"
      className="min-h-[345px] lg:col-span-2"
      action={
        <div className="flex items-center gap-[8px] text-[13px] leading-[18px] text-[#47464a]">
          <span>Active: {numberFormatter.format(activeCount)}</span>
          <IconButton label="Queue options">
            <MoreHorizontal className="h-[12px] w-[12px]" aria-hidden="true" />
          </IconButton>
        </div>
      }
      bodyClassName="flex min-h-[296px] flex-col"
    >
      <div className="grid min-h-[85px] grid-cols-2 gap-x-[16px] gap-y-[12px] border-b border-[rgba(200,197,202,0.5)] px-[16px] py-[16px] sm:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex flex-col gap-[4px]">
            <div className="text-[11px] font-semibold uppercase leading-4 tracking-[0.55px] text-[#47464a]">
              {metric.label}
            </div>
            <div
              className={`font-mono text-[24px] font-semibold leading-8 ${
                metric.tone === 'healthy'
                  ? 'text-[#00714d]'
                  : metric.tone === 'danger'
                    ? 'text-[#ba1a1a]'
                    : 'text-[#09090b]'
              }`}
            >
              {metric.value}
            </div>
          </div>
        ))}
      </div>
      <div className="flex min-h-[174px] flex-1 flex-col gap-[12px] px-[16px] py-[16px]">
        {isLoading && transfers.length === 0 ? (
          <>
            <SkeletonBlock className="h-[64px]" />
            <SkeletonBlock className="h-[64px]" />
          </>
        ) : rows.length > 0 ? (
          rows.map((row) => (
            <div
              key={`${row.id}-${row.status}`}
              className={`flex min-h-[64px] items-center justify-between gap-[12px] rounded-[2px] border px-[13px] ${
                row.tone === 'healthy'
                  ? 'border-[#6cf8bb] bg-[rgba(108,248,187,0.12)]'
                  : 'border-[#e4e4e7] bg-white'
              }`}
            >
              <div className="flex min-w-0 items-center gap-[16px]">
                <div
                  className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[2px] ${
                    row.icon === 'approved'
                      ? 'bg-[rgba(108,248,187,0.22)] text-[#00714d]'
                      : 'bg-[#f1edec] text-[#47464a]'
                  }`}
                >
                  {row.icon === 'approved' ? (
                    <ShieldCheck className="h-[13px] w-[13px]" aria-hidden="true" />
                  ) : (
                    <Clock3 className="h-[13px] w-[13px]" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <span className="font-mono text-[13px] font-medium leading-[18px] text-[#1c1b1b]">
                      {row.id}
                    </span>
                    <span className="rounded-[2px] bg-[#e5e2e1] px-[6px] py-[2px] font-mono text-[11px] leading-[14px] text-[#47464a]">
                      {row.status}
                    </span>
                  </div>
                  <div className="font-mono text-[12px] leading-4 text-[#47464a]">
                    {row.subtitle}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right font-mono text-[12px] leading-4 text-[#1c1b1b]">
                <div>{row.amount}</div>
                <div className="text-[#47464a]">{row.meta}</div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            compact
            title="Queue is clear"
            body="No transfer requests are waiting for settlement."
          />
        )}
      </div>
      <div className="flex h-[35px] items-center justify-end border-t border-[#e4e4e7] bg-[#fafafa] px-[16px]">
        <Link
          href="/dashboard/transactions"
          className="text-[13px] font-medium leading-[18px] text-[#1c1b1b] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
        >
          View Full Queue +
        </Link>
      </div>
    </Panel>
  );
}

function RecentTransactionsPanel({
  transfers,
  query,
  onQueryChange,
  isLoading,
}: {
  transfers: TransferRequest[];
  query: string;
  onQueryChange: (value: string) => void;
  isLoading: boolean;
}) {
  const filteredTransfers = useMemo(
    () => transfers.filter((transfer) => transferMatchesQuery(transfer, query)).slice(0, 12),
    [query, transfers]
  );

  return (
    <Panel
      title="Recent Transactions"
      className="min-h-[378px] lg:col-span-2"
      action={
        <label className="relative block h-[32px] w-full max-w-[256px]">
          <span className="sr-only">Search transactions</span>
          <Search className="pointer-events-none absolute left-[12px] top-[10px] h-[12px] w-[12px] text-[#71717a]" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            type="search"
            autoComplete="off"
            spellCheck={false}
            className="h-[32px] w-full rounded-[2px] border border-[#e4e4e7] bg-white pl-[33px] pr-[12px] text-[12px] leading-4 text-[#1c1b1b] outline-none placeholder:text-[#71717a] focus:border-[#18181b] focus-visible:ring-2 focus-visible:ring-[#18181b]"
            placeholder="Search ID, wallet..."
          />
        </label>
      }
      bodyClassName="flex min-h-[329px] flex-col"
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-[12px]">
          <colgroup>
            <col className="w-[16%]" />
            <col className="w-[24%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col />
          </colgroup>
          <thead>
            <tr className="h-[40px] border-b border-[#e4e4e7] bg-white text-[11px] font-medium uppercase leading-4 tracking-[0.3px] text-[#47464a]">
              <th className="px-[16px] text-left">ID</th>
              <th className="px-[16px] text-left">Merchant / Sender</th>
              <th className="px-[16px] text-right">Amount</th>
              <th className="px-[16px] text-left">Compliance</th>
              <th className="px-[16px] text-left">Settlement</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && transfers.length === 0 ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={index} className="h-[55px] border-b border-[#e4e4e7]">
                  <td className="px-[16px]" colSpan={5}>
                    <SkeletonBlock className="h-[16px] w-full" />
                  </td>
                </tr>
              ))
            ) : filteredTransfers.length > 0 ? (
              filteredTransfers.map((transfer) => (
                <tr
                  key={transfer.id}
                  className={`h-[55px] border-b border-[#e4e4e7] ${
                    transfer.compliance_status === 'rejected' ? 'bg-[#fff8f8]' : 'bg-white'
                  }`}
                >
                  <td className="px-[16px] font-mono leading-4 text-[#1c1b1b]">
                    {transferShortId(transfer)}
                  </td>
                  <td className="px-[16px]">
                    <div className="font-mono text-[13px] font-medium leading-[18px] text-[#1c1b1b]">
                      {formatAddress(transfer.to_address, 4)}
                    </div>
                    <div className="font-mono text-[12px] leading-4 text-[#47464a]">
                      {formatAddress(transfer.from_address, 4)}
                    </div>
                  </td>
                  <td className="px-[16px] text-right font-mono leading-4 text-[#1c1b1b]">
                    {formatTransferAmount(transfer)}
                  </td>
                  <td className="px-[16px]">
                    <StatusChip
                      label={complianceLabel(transfer.compliance_status)}
                      tone={statusTone(transfer.compliance_status)}
                    />
                  </td>
                  <td className="px-[16px] font-mono">
                    <InlineStatus
                      label={settlementLabel(transfer)}
                      tone={settlementTone(transfer)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr className="h-[72px] border-b border-[#e4e4e7]">
                <td className="px-[16px] text-[13px] text-[#71717a]" colSpan={5}>
                  {transfers.length === 0
                    ? 'No transfer requests returned by the backend.'
                    : 'No transactions match this search.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex h-[44px] items-center justify-between border-t border-[#e4e4e7] bg-[#fafafa] px-[16px]">
        <div className="text-[12px] leading-[18px] text-[#47464a]">
          Showing {filteredTransfers.length} of {numberFormatter.format(transfers.length)} transactions
        </div>
        <Link
          href="/dashboard/transactions"
          className="text-[12px] font-medium text-[#1c1b1b] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
        >
          Open table
        </Link>
      </div>
    </Panel>
  );
}

function ActivityPanel({ events }: { events: TraceEvent[] }) {
  return (
    <Panel
      title="Live Webhooks"
      className="min-h-[403px]"
      action={
        <div className="flex items-center gap-[6px]">
          <span className="relative flex h-[8px] w-[8px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00714d] opacity-30" />
            <span className="relative inline-flex h-[8px] w-[8px] rounded-full bg-[#00714d]" />
          </span>
          <span className="text-[11px] font-semibold uppercase leading-4 tracking-[0.55px] text-[#00714d]">
            Polling
          </span>
        </div>
      }
      bodyClassName="relative min-h-[352px] bg-[#fdf8f8]"
    >
      <div className="absolute left-[24px] top-[16px] h-[calc(100%-32px)] w-px bg-[#c8c5ca]" />
      {events.length > 0 ? (
        <div className="relative flex h-full flex-col gap-[16px] overflow-hidden px-[16px] py-[16px]">
          {events.map((event) => {
            const dotBorder =
              event.tone === 'danger'
                ? 'border-[#ba1a1a]'
                : event.tone === 'healthy'
                  ? 'border-[#00714d]'
                  : event.tone === 'warning'
                    ? 'border-[#8a5300]'
                    : 'border-[#47464a]';
            return (
              <div key={event.id} className="flex gap-[12px]">
                <div className="flex h-[20px] w-[16px] shrink-0 pt-[4px]">
                  <span className={`h-[16px] w-[16px] rounded-full border-2 bg-white ${dotBorder}`} />
                </div>
                <div className="flex min-w-0 flex-col gap-[2px]">
                  <div className="font-mono text-[12px] leading-4 text-[#47464a]">
                    {event.time} - {event.source}
                  </div>
                  <div
                    className={`rounded-[2px] border bg-white p-[9px] font-mono text-[12px] leading-4 ${
                      event.tone === 'danger' ? 'border-[rgba(186,26,26,0.5)]' : 'border-[#c8c5ca]'
                    }`}
                  >
                    <div className={`font-medium ${event.tone === 'danger' ? 'text-[#ba1a1a]' : 'text-black'}`}>
                      {event.title}
                    </div>
                    <div className="truncate text-[#1c1b1b]">{event.detail}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="relative flex min-h-[352px] items-center">
          <EmptyState
            compact
            title="No relayer activity yet"
            body="Status updates will appear here once transfer requests change."
          />
        </div>
      )}
    </Panel>
  );
}

export function OverviewScreen() {
  const { health, transfers, isLoading, error, lastUpdated, refresh } = useOverviewData();
  const [query, setQuery] = useState('');

  const displayHealth = health ?? INITIAL_HEALTH;
  const traceEvents = useMemo(() => buildTraceEvents(transfers), [transfers]);

  return (
    <OperationsShell health={displayHealth}>
      <DataNotice
        isLoading={isLoading}
        error={error}
        lastUpdated={lastUpdated}
        onRefresh={() => refresh(true)}
      />
      <PageHeader transfers={transfers} health={displayHealth} />

      <div className="grid gap-[24px] lg:grid-cols-3">
        <NodeStatusPanel health={displayHealth} />
        <SettlementQueuePanel transfers={transfers} isLoading={isLoading} />
      </div>

      <div className="grid gap-[24px] lg:grid-cols-3">
        <RecentTransactionsPanel
          transfers={transfers}
          query={query}
          onQueryChange={setQuery}
          isLoading={isLoading}
        />
        <ActivityPanel events={traceEvents} />
      </div>

      {displayHealth.timestamp !== INITIAL_HEALTH.timestamp && (
        <div className="flex items-center gap-[8px] text-[12px] text-[#71717a]">
          <AlertCircle className="h-[13px] w-[13px]" aria-hidden="true" />
          <span>
            Health sampled {formatDateTime(displayHealth.timestamp)} · API status{' '}
            {titleCaseStatus(displayHealth.status)}
          </span>
        </div>
      )}
    </OperationsShell>
  );
}
