'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  Clock3,
  Database,
  HardDrive,
  LockKeyhole,
  Radio,
  RefreshCw,
  Server,
  TerminalSquare,
  Workflow,
} from 'lucide-react';

import { fetchHealth, type HealthResponse, type HealthStatus } from '@/services/health';
import { fetchTransferRequests } from '@/services/transfer-requests';
import type { BlockchainStatus, TransferRequest } from '@/types/transfer-request';
import { OperationsShell } from './OperationsShell';
import {
  EmptyState,
  ErrorBanner,
  InlineStatus,
  KeyValue,
  Panel,
  SecondaryButton,
  SkeletonBlock,
  StatusChip,
} from './OperationsPrimitives';
import {
  activeTransferCount,
  formatDateTime,
  formatTraceTime,
  healthLabel,
  INITIAL_HEALTH,
  isWithinLast24Hours,
  numberFormatter,
  statusTone,
  titleCaseStatus,
  transferShortId,
} from './operations-utils';

interface NodeRecord {
  label: string;
  description: string;
  status: HealthStatus | null;
  statusLabel: string;
  icon: typeof Server;
  meta: string;
}

const laneOrder: BlockchainStatus[] = [
  'received',
  'pending',
  'pending_submission',
  'processing',
  'submitted',
  'confirmed',
  'failed',
  'expired',
];

function useNodeData() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);

    const [healthResult, transferResult] = await Promise.allSettled([
      fetchHealth(),
      fetchTransferRequests(100),
    ]);
    const errors: string[] = [];

    if (healthResult.status === 'fulfilled') {
      setHealth(healthResult.value);
    } else {
      errors.push(healthResult.reason instanceof Error ? healthResult.reason.message : 'Health unavailable');
    }

    if (transferResult.status === 'fulfilled') {
      setTransfers(transferResult.value.items);
    } else {
      errors.push(transferResult.reason instanceof Error ? transferResult.reason.message : 'Transfer queue unavailable');
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

  return { health: health ?? INITIAL_HEALTH, transfers, isLoading, error, lastUpdated, refresh };
}

function buildNodes(health: HealthResponse, activeCount: number): NodeRecord[] {
  return [
    {
      label: 'Backend API',
      description: 'Axum request router and rate-limited HTTP surface',
      status: health.status,
      statusLabel: healthLabel(health.status),
      icon: TerminalSquare,
      meta: `version ${health.version}`,
    },
    {
      label: 'PostgreSQL DB',
      description: 'Transfer request, checkout, blocklist, and risk profile persistence',
      status: health.database,
      statusLabel: healthLabel(health.database, 'Healthy'),
      icon: Database,
      meta: 'reported by /health',
    },
    {
      label: 'Blockchain RPC',
      description: 'Solana submission and signature status provider',
      status: health.blockchain,
      statusLabel: healthLabel(health.blockchain),
      icon: Radio,
      meta: 'reported by /health',
    },
    {
      label: 'Submission Worker',
      description: 'Derived from queued, processing, and submitted transfers',
      status: activeCount > 0 ? 'healthy' : null,
      statusLabel: activeCount > 0 ? `${activeCount} active` : 'Idle',
      icon: Workflow,
      meta: 'derived from /transfer-requests',
    },
    {
      label: 'Range / Compliance',
      description: 'Risk provider status is not exposed by a health endpoint',
      status: null,
      statusLabel: 'Unavailable',
      icon: LockKeyhole,
      meta: 'checked only during /risk-check',
    },
  ];
}

function RelayerHeader({
  health,
  lastUpdated,
  isLoading,
  onRefresh,
}: {
  health: HealthResponse;
  lastUpdated: Date | null;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-[16px] md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-[4px]">
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.48px] text-[#1c1b1b]">
          Relayer Nodes
        </h1>
        <p className="text-[13px] leading-[18px] text-[#47464a]">
          Infrastructure health, queue pressure, and provider visibility from live API data.
        </p>
      </div>
      <div className="flex items-center gap-[8px]">
        <StatusChip label={`System: ${healthLabel(health.status, 'Healthy')}`} tone={statusTone(health.status)} />
        <SecondaryButton onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={`h-[13px] w-[13px] ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Refresh'}
        </SecondaryButton>
      </div>
    </div>
  );
}

function NodeRegistryPanel({ nodes, isLoading }: { nodes: NodeRecord[]; isLoading: boolean }) {
  return (
    <Panel title="Node Registry" action={<Server className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />} bodyClassName="p-[16px]">
      <div className="space-y-[12px]">
        {isLoading ? (
          <>
            <SkeletonBlock className="h-[72px]" />
            <SkeletonBlock className="h-[72px]" />
            <SkeletonBlock className="h-[72px]" />
          </>
        ) : (
          nodes.map((node) => {
            const Icon = node.icon;
            return (
              <div key={node.label} className="rounded-[2px] border border-[#e4e4e7] bg-white p-[12px]">
                <div className="flex items-start justify-between gap-[12px]">
                  <div className="flex min-w-0 gap-[10px]">
                    <div className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-[2px] bg-[#f1edec] text-[#47464a]">
                      <Icon className="h-[15px] w-[15px]" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold leading-[18px] text-[#1c1b1b]">
                        {node.label}
                      </div>
                      <p className="mt-[2px] text-[12px] leading-4 text-[#71717a]">{node.description}</p>
                      <p className="mt-[6px] font-mono text-[11px] leading-4 text-[#47464a]">{node.meta}</p>
                    </div>
                  </div>
                  <StatusChip label={node.statusLabel} tone={statusTone(node.status)} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Panel>
  );
}

function MetricsPanel({ transfers }: { transfers: TransferRequest[] }) {
  const pending = activeTransferCount(transfers);
  const failed24h = transfers.filter(
    (transfer) =>
      ['failed', 'expired'].includes(transfer.blockchain_status) &&
      isWithinLast24Hours(transfer.updated_at)
  ).length;
  const confirmed24h = transfers.filter(
    (transfer) =>
      transfer.blockchain_status === 'confirmed' && isWithinLast24Hours(transfer.updated_at)
  ).length;
  const retryScheduled = transfers.filter((transfer) => transfer.blockchain_next_retry_at).length;

  const metrics = [
    { label: 'Active Queue', value: pending, tone: pending > 0 ? 'warning' : 'neutral' },
    { label: 'Confirmed 24H', value: confirmed24h, tone: 'healthy' },
    { label: 'Failed 24H', value: failed24h, tone: failed24h > 0 ? 'danger' : 'neutral' },
    { label: 'Retry Scheduled', value: retryScheduled, tone: retryScheduled > 0 ? 'warning' : 'neutral' },
  ] as const;

  return (
    <div className="grid gap-[16px] sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-[2px] border border-[#c8c5ca] bg-white p-[16px]">
          <div className="text-[11px] font-semibold uppercase leading-4 tracking-[0.55px] text-[#47464a]">
            {metric.label}
          </div>
          <div
            className={`mt-[6px] font-mono text-[28px] font-semibold leading-8 ${
              metric.tone === 'healthy'
                ? 'text-[#00714d]'
                : metric.tone === 'danger'
                  ? 'text-[#ba1a1a]'
                  : metric.tone === 'warning'
                    ? 'text-[#8a5300]'
                    : 'text-[#09090b]'
            }`}
          >
            {numberFormatter.format(metric.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkerLanesPanel({ transfers }: { transfers: TransferRequest[] }) {
  const laneCounts = laneOrder.map((status) => ({
    status,
    count: transfers.filter((transfer) => transfer.blockchain_status === status).length,
  }));

  return (
    <Panel title="Worker Lanes" action={<Boxes className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />} bodyClassName="p-[16px]">
      <div className="space-y-[10px]">
        {laneCounts.map((lane) => {
          const max = Math.max(1, transfers.length);
          const pct = Math.round((lane.count / max) * 100);
          return (
            <div key={lane.status}>
              <div className="mb-[6px] flex items-center justify-between gap-[12px]">
                <InlineStatus label={titleCaseStatus(lane.status)} tone={statusTone(lane.status)} />
                <span className="font-mono text-[12px] text-[#47464a]">{lane.count}</span>
              </div>
              <div className="h-[8px] overflow-hidden rounded-[2px] bg-[#efebea]">
                <div
                  className={`h-full rounded-[2px] ${
                    statusTone(lane.status) === 'danger'
                      ? 'bg-[#ba1a1a]'
                      : statusTone(lane.status) === 'healthy'
                        ? 'bg-[#00714d]'
                        : statusTone(lane.status) === 'warning'
                          ? 'bg-[#8a5300]'
                          : 'bg-[#78767b]'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ProviderVisibilityPanel({ health }: { health: HealthResponse }) {
  return (
    <Panel title="Provider Visibility" action={<HardDrive className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />} bodyClassName="p-[16px]">
      <KeyValue label="Health timestamp" value={formatDateTime(health.timestamp)} />
      <KeyValue label="API version" value={health.version} mono />
      <KeyValue label="Database probe" value={titleCaseStatus(health.database)} />
      <KeyValue label="Blockchain probe" value={titleCaseStatus(health.blockchain)} />
      <KeyValue label="Range probe" value="Unavailable" />
      <KeyValue label="Webhook event stream" value="Unavailable" />
    </Panel>
  );
}

function TelemetryConsole({ transfers }: { transfers: TransferRequest[] }) {
  const lines = transfers.slice(0, 12).map((transfer) => {
    const status = `${transfer.compliance_status}/${transfer.blockchain_status}`;
    return `${formatTraceTime(transfer.updated_at)} ${transferShortId(transfer)} ${status}`;
  });

  return (
    <Panel title="Telemetry Console" bodyClassName="bg-[#171313] p-[16px]">
      {lines.length > 0 ? (
        <pre className="min-h-[260px] overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-5 text-[#d5d0cf]">
          {lines.map((line) => `> ${line}`).join('\n')}
        </pre>
      ) : (
        <div className="min-h-[260px]">
          <EmptyState
            compact
            title="No transfer telemetry"
            body="The backend returned no transfer status records."
          />
        </div>
      )}
    </Panel>
  );
}

export function RelayerNodesScreen() {
  const { health, transfers, isLoading, error, lastUpdated, refresh } = useNodeData();
  const activeCount = activeTransferCount(transfers);
  const nodes = useMemo(() => buildNodes(health, activeCount), [activeCount, health]);

  return (
    <OperationsShell health={health}>
      <RelayerHeader
        health={health}
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        onRefresh={() => refresh(true)}
      />
      {error && <ErrorBanner message={error} onRetry={() => refresh(true)} />}
      <MetricsPanel transfers={transfers} />

      <div className="grid gap-[24px] xl:grid-cols-[420px_1fr]">
        <div className="space-y-[24px]">
          <NodeRegistryPanel nodes={nodes} isLoading={isLoading} />
          <ProviderVisibilityPanel health={health} />
        </div>
        <div className="space-y-[24px]">
          <WorkerLanesPanel transfers={transfers} />
          <TelemetryConsole transfers={transfers} />
          <Panel title="Health Contract" action={<Clock3 className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />} bodyClassName="p-[16px]">
            <KeyValue label="Status source" value="GET /health" mono />
            <KeyValue label="Queue source" value="GET /transfer-requests" mono />
            <KeyValue label="Node metrics endpoint" value="Unavailable" />
            <KeyValue label="Last sample" value={lastUpdated ? lastUpdated.toLocaleTimeString() : 'Not sampled'} />
          </Panel>
        </div>
      </div>
    </OperationsShell>
  );
}
