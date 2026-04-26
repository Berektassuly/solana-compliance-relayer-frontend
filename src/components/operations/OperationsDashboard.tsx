'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Database,
  Download,
  Gauge,
  HelpCircle,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SquareStack,
  TerminalSquare,
  Zap,
} from 'lucide-react';

import { fetchHealth, type HealthResponse, type HealthStatus } from '@/services/health';
import { fetchTransferRequests } from '@/services/transfer-requests';
import type {
  BlockchainStatus,
  ComplianceStatus,
  TransferRequest,
} from '@/types/transfer-request';
import { formatAddress } from '@/lib/utils';

type ChipTone = 'healthy' | 'neutral' | 'danger' | 'warning';

interface QueueMetric {
  label: string;
  value: string;
  tone?: ChipTone;
}

interface QueueRow {
  batch: string;
  status: string;
  subtitle: string;
  amount: string;
  fee: string;
  tone: ChipTone;
  icon: 'pending' | 'approved';
}

interface TransactionRow {
  id: string;
  merchant: string;
  sender: string;
  amount: string;
  complianceLabel: string;
  complianceTone: ChipTone;
  settlementLabel: string;
  settlementTone: ChipTone;
  muted?: boolean;
}

interface TraceEvent {
  time: string;
  provider: string;
  title: string;
  detail?: string;
  tone: ChipTone;
  muted?: boolean;
}

const FALLBACK_HEALTH: HealthResponse = {
  status: 'healthy',
  database: 'healthy',
  blockchain: 'degraded',
  timestamp: new Date().toISOString(),
  version: '0.3.0',
};

const DEMO_QUEUE_METRICS: QueueMetric[] = [
  { label: 'PENDING', value: '1,204' },
  { label: 'PROCESSING', value: '342', tone: 'healthy' },
  { label: 'FAILED (24H)', value: '12', tone: 'danger' },
  { label: 'BLOCKED', value: '5' },
];

const DEMO_QUEUE_ROWS: QueueRow[] = [
  {
    batch: 'Batch #893',
    status: 'pending_submission',
    subtitle: 'Est. ~45s',
    amount: '124.500 USDC',
    fee: 'Fee: 0.04 SOL',
    tone: 'neutral',
    icon: 'pending',
  },
  {
    batch: 'Batch #892',
    status: 'submitted',
    subtitle: 'Awaiting Quick Conf.',
    amount: '350.000 USDC',
    fee: 'Sig: 5Y78...2LJ',
    tone: 'healthy',
    icon: 'approved',
  },
];

const DEMO_TRANSACTIONS: TransactionRow[] = [
  {
    id: 'tx_8af92',
    merchant: 'Acme Corp',
    sender: '8xPj...3aKq',
    amount: '1,500.00 USDC',
    complianceLabel: 'Clear',
    complianceTone: 'healthy',
    settlementLabel: 'confirmed',
    settlementTone: 'healthy',
  },
  {
    id: 'tx_3d11c',
    merchant: 'Global Trade Inc',
    sender: '2dQk...9YWs',
    amount: '45,000.00 USDC',
    complianceLabel: 'Flagged',
    complianceTone: 'danger',
    settlementLabel: 'rejected_before_settlement',
    settlementTone: 'danger',
    muted: true,
  },
  {
    id: 'tx_74de1',
    merchant: 'Boutique SaaS',
    sender: '5jLp...1xZr',
    amount: '299.00 USDC',
    complianceLabel: 'Clear',
    complianceTone: 'healthy',
    settlementLabel: 'pending_submission',
    settlementTone: 'neutral',
  },
  {
    id: 'tx_a26b9',
    merchant: 'Neon Services',
    sender: '9nRt...4pMq',
    amount: '1,250.50 USDC',
    complianceLabel: 'Clear',
    complianceTone: 'healthy',
    settlementLabel: 'failed',
    settlementTone: 'danger',
  },
];

const DEMO_TRACE_EVENTS: TraceEvent[] = [
  {
    time: '14:02:45.102',
    provider: 'Helius',
    title: 'ACCOUNT_UPDATE',
    detail: 'Owner: Tokenkeg...',
    tone: 'healthy',
  },
  {
    time: '14:02:44.890',
    provider: 'QuickNode',
    title: 'SLOT_SUBSCRIBE',
    detail: 'Slot: 245,891,002',
    tone: 'neutral',
  },
  {
    time: '14:02:42.115',
    provider: 'Helius',
    title: 'TX_ERROR',
    detail: 'Err: Insufficient Funds',
    tone: 'danger',
  },
  {
    time: '14:02:40.001',
    provider: 'Internal',
    title: 'Heartbeat OK',
    tone: 'neutral',
    muted: true,
  },
];

const MERCHANT_NAMES = ['Acme Corp', 'Global Trade Inc', 'Boutique SaaS', 'Neon Services'];

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
};

function useOperationsData() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }

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
    const initialRefresh = window.setTimeout(() => {
      void refresh(false);
    }, 0);
    const interval = window.setInterval(() => refresh(false), 10_000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { health, transfers, isLoading, error, lastUpdated, refresh };
}

function statusTone(status: HealthStatus | BlockchainStatus | ComplianceStatus): ChipTone {
  if (status === 'healthy' || status === 'confirmed' || status === 'approved') return 'healthy';
  if (status === 'unhealthy' || status === 'failed' || status === 'expired' || status === 'rejected') {
    return 'danger';
  }
  if (status === 'processing' || status === 'submitted') return 'warning';
  return 'neutral';
}

function healthLabel(status: HealthStatus, healthyLabel = 'Online'): string {
  if (status === 'healthy') return healthyLabel;
  if (status === 'degraded') return 'Degraded';
  return 'Unhealthy';
}

function formatTransferAmount(transfer: TransferRequest): string {
  if (transfer.transfer_details.type === 'confidential') {
    return 'Confidential';
  }

  const token = getTokenSymbol(transfer.token_mint);
  const divisor = token === 'SOL' ? 1_000_000_000 : 1_000_000;
  const amount = transfer.transfer_details.amount / divisor;
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: token === 'SOL' ? 3 : 2,
    maximumFractionDigits: token === 'SOL' ? 6 : 2,
  })} ${token}`;
}

function getTokenSymbol(tokenMint: string | null): string {
  if (!tokenMint) return 'SOL';
  const knownMints: Record<string, string> = {
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
  };
  return knownMints[tokenMint] ?? 'TOKEN';
}

function isWithinLast24Hours(isoDate: string): boolean {
  return Date.now() - new Date(isoDate).getTime() <= 24 * 60 * 60 * 1000;
}

function buildQueueMetrics(transfers: TransferRequest[]): QueueMetric[] {
  if (transfers.length === 0) {
    return DEMO_QUEUE_METRICS;
  }

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
    { label: 'PENDING', value: pending.toLocaleString() },
    { label: 'PROCESSING', value: processing.toLocaleString(), tone: 'healthy' },
    { label: 'FAILED (24H)', value: failed24h.toLocaleString(), tone: 'danger' },
    { label: 'BLOCKED', value: blocked.toLocaleString() },
  ];
}

function buildQueueRows(transfers: TransferRequest[]): QueueRow[] {
  const liveRows = transfers
    .filter((transfer) =>
      ['received', 'pending', 'pending_submission', 'processing', 'submitted'].includes(
        transfer.blockchain_status
      )
    )
    .slice(0, 2)
    .map((transfer, index): QueueRow => ({
      batch: `Batch #${893 - index}`,
      status: transfer.blockchain_status,
      subtitle:
        transfer.blockchain_status === 'submitted'
          ? 'Awaiting confirmation'
          : transfer.compliance_status === 'approved'
            ? 'Approved for settlement'
            : 'Compliance review',
      amount: formatTransferAmount(transfer),
      fee: transfer.blockchain_signature
        ? `Sig: ${formatAddress(transfer.blockchain_signature, 4)}`
        : `Retry: ${transfer.blockchain_retry_count}/10`,
      tone: statusTone(transfer.blockchain_status),
      icon: transfer.blockchain_status === 'submitted' ? 'approved' : 'pending',
    }));

  return liveRows.length > 0 ? liveRows : DEMO_QUEUE_ROWS;
}

function complianceLabel(status: ComplianceStatus): string {
  if (status === 'approved') return 'Clear';
  if (status === 'rejected') return 'Flagged';
  return 'Pending';
}

function settlementLabel(transfer: TransferRequest): string {
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

function buildTransactionRows(transfers: TransferRequest[]): TransactionRow[] {
  if (transfers.length === 0) {
    return DEMO_TRANSACTIONS;
  }

  return transfers.slice(0, 12).map((transfer, index) => {
    const settlement = settlementLabel(transfer);
    return {
      id: `tx_${transfer.id.slice(0, 5)}`,
      merchant: MERCHANT_NAMES[index % MERCHANT_NAMES.length],
      sender: formatAddress(transfer.from_address, 4),
      amount: formatTransferAmount(transfer),
      complianceLabel: complianceLabel(transfer.compliance_status),
      complianceTone: statusTone(transfer.compliance_status),
      settlementLabel: settlement,
      settlementTone:
        settlement === 'rejected_before_settlement' || settlement === 'failed_or_expired'
          ? 'danger'
          : statusTone(transfer.blockchain_status),
      muted: transfer.compliance_status === 'rejected',
    };
  });
}

function buildTraceEvents(transfers: TransferRequest[]): TraceEvent[] {
  if (transfers.length === 0) {
    return DEMO_TRACE_EVENTS;
  }

  const events = transfers.slice(0, 4).map((transfer, index): TraceEvent => {
    const provider = index % 2 === 0 ? 'Helius' : 'QuickNode';
    const tone = transfer.blockchain_status === 'failed' ? 'danger' : statusTone(transfer.blockchain_status);
    const title =
      transfer.blockchain_status === 'failed'
        ? 'TX_ERROR'
        : transfer.blockchain_status === 'confirmed'
          ? 'TOKEN_TRANSFER'
          : transfer.blockchain_status === 'submitted'
            ? 'SLOT_SUBSCRIBE'
            : 'Heartbeat OK';

    return {
      time: formatTraceTime(transfer.updated_at),
      provider,
      title,
      detail:
        title === 'TX_ERROR'
          ? `Err: ${transfer.blockchain_last_error ?? 'Submission failed'}`
          : transfer.blockchain_signature
            ? `Sig: ${formatAddress(transfer.blockchain_signature, 5)}`
            : `Status: ${transfer.blockchain_status}`,
      tone,
      muted: index === 3,
    };
  });

  return events.length > 0 ? events : DEMO_TRACE_EVENTS;
}

function formatTraceTime(isoDate: string): string {
  const date = new Date(isoDate);
  const time = date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return `${time}.${date.getMilliseconds().toString().padStart(3, '0')}`;
}

function filterRows(rows: TransactionRow[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;

  return rows.filter((row) =>
    [row.id, row.merchant, row.sender, row.amount, row.complianceLabel, row.settlementLabel]
      .join(' ')
      .toLowerCase()
      .includes(needle)
  );
}

function StatusChip({
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

function SettlementStatus({ label, tone }: { label: string; tone: ChipTone }) {
  const dot = chipStyles[tone].dot;
  const text = tone === 'danger' ? 'text-[#ba1a1a]' : tone === 'healthy' ? 'text-[#00714d]' : 'text-[#47464a]';
  return (
    <span className={`inline-flex items-center gap-[6px] text-[12px] leading-[18px] ${text}`}>
      <span className={`h-[6px] w-[6px] rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function IconButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="flex h-[24px] w-[24px] items-center justify-center rounded-[2px] text-[#47464a] transition hover:bg-[#e5e2e1] hover:text-[#18181b]"
    >
      {children}
    </button>
  );
}

function TopAppBar() {
  const tabs = ['Overview', 'Investigations', 'Transactions', 'Relayer Nodes', 'Settings'];
  return (
    <header className="fixed left-0 top-0 z-50 flex h-[56px] w-full items-center justify-between border-b border-[#e4e4e7] bg-white/80 px-[24px] backdrop-blur-[6px]">
      <div className="flex min-w-0 items-center gap-[16px]">
        <div className="shrink-0 text-[14px] font-bold uppercase leading-5 tracking-[0.7px] text-[#18181b]">
          SOLANA COMPLIANCE RELAYER
        </div>
        <nav className="hidden items-center gap-[4px] xl:flex" aria-label="Primary navigation">
          {tabs.map((tab) => (
            <a
              key={tab}
              href="#"
              className={`flex h-[38px] items-center px-[12px] text-[14px] leading-5 tracking-[-0.35px] ${
                tab === 'Overview'
                  ? 'border-b-2 border-[#18181b] font-bold text-[#18181b]'
                  : 'text-[#71717a] hover:text-[#18181b]'
              }`}
            >
              {tab}
            </a>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-[16px]">
        <div className="hidden items-center gap-[8px] sm:flex">
          <IconButton label="Queue snapshot">
            <SquareStack className="h-[15px] w-[15px]" />
          </IconButton>
          <IconButton label="Network activity">
            <Activity className="h-[15px] w-[15px]" />
          </IconButton>
          <IconButton label="Automation">
            <Zap className="h-[15px] w-[15px]" />
          </IconButton>
          <IconButton label="Notifications">
            <Bell className="h-[15px] w-[15px]" />
          </IconButton>
        </div>
        <div className="hidden h-[16px] w-px bg-[#e4e4e7] sm:block" />
        <span className="rounded-[2px] bg-[#e5e2e1] px-[8px] py-[4px] text-[11px] font-semibold leading-4 tracking-[0.55px] text-[#47464a]">
          Devnet
        </span>
      </div>
    </header>
  );
}

function SideBar({ health }: { health: HealthResponse }) {
  const navItems = [
    { label: 'Overview', icon: Gauge, active: true },
    { label: 'Investigations', icon: ShieldAlert },
    { label: 'Transactions', icon: ClipboardList },
    { label: 'Relayer Nodes', icon: Server },
    { label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-[56px] z-40 hidden h-[calc(100vh-56px)] w-[256px] flex-col gap-[8px] overflow-hidden border-r border-[#e4e4e7] bg-[#fafafa] px-[16px] py-[24px] lg:flex">
      <div className="w-full pb-[24px]">
        <div className="flex w-full flex-col gap-[16px] px-[12px]">
          <div className="flex items-center gap-[12px]">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[2px] border border-[#c8c5ca] bg-[#e5e2e1] text-[11px] font-bold text-[#09090b]">
              CR
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold leading-5 text-[#09090b]">
                Compliance Relayer
              </div>
              <div className="text-[11px] uppercase leading-5 tracking-[0.55px] text-[#71717a]">
                OPERATIONAL
              </div>
            </div>
          </div>
          <StatusChip
            label={`System Status: ${healthLabel(health.status, 'Healthy')}`}
            tone={statusTone(health.status)}
            className="h-[30px] w-full justify-start"
          />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-[4px]" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href="#"
              className={`flex h-[36px] items-center gap-[12px] rounded-[6px] px-[12px] text-[13px] leading-5 ${
                item.active
                  ? 'bg-[rgba(228,228,231,0.5)] text-[#18181b]'
                  : 'text-[#71717a] hover:bg-[rgba(228,228,231,0.35)] hover:text-[#18181b]'
              }`}
            >
              <Icon className="h-[15px] w-[15px]" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="w-full border-t border-[#e4e4e7] pt-[17px]">
        <a
          href="#"
          className="flex h-[36px] items-center gap-[12px] rounded-[6px] px-[12px] text-[13px] leading-5 text-[#71717a] hover:bg-[rgba(228,228,231,0.35)]"
        >
          <BookOpen className="h-[15px] w-[15px]" />
          Docs
        </a>
        <a
          href="#"
          className="flex h-[36px] items-center gap-[12px] rounded-[6px] px-[12px] text-[13px] leading-5 text-[#71717a] hover:bg-[rgba(228,228,231,0.35)]"
        >
          <HelpCircle className="h-[15px] w-[15px]" />
          Support
        </a>
      </div>
    </aside>
  );
}

function Panel({
  title,
  action,
  children,
  className = '',
  bodyClassName = '',
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[2px] border border-[#c8c5ca] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] ${className}`}
    >
      <div className="flex h-[49px] items-center justify-between border-b border-[#c8c5ca] bg-[#fafafa] px-[16px]">
        <h2 className="text-[18px] font-semibold leading-6 tracking-[-0.18px] text-[#1c1b1b]">
          {title}
        </h2>
        {action}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
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
    link.download = `relayer-operations-${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [health, transfers]);

  return (
    <div className="flex items-center justify-between pb-[16px]">
      <div className="flex flex-col gap-[4px]">
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.48px] text-[#1c1b1b]">
          Overview
        </h1>
        <p className="text-[13px] leading-[18px] text-[#47464a]">
          Real-time settlement operations and compliance monitoring.
        </p>
      </div>
      <div className="flex items-center gap-[8px]">
        <button
          type="button"
          onClick={handleExport}
          className="flex h-[36px] items-center gap-[8px] rounded-[2px] border border-[#c8c5ca] bg-white px-[17px] text-[13px] font-medium leading-[18px] text-[#1c1b1b] shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition hover:bg-[#fafafa]"
        >
          <Download className="h-[12px] w-[12px]" />
          Export Logs
        </button>
        <Link
          href="/admin"
          className="flex h-[36px] items-center gap-[8px] rounded-[2px] bg-black px-[16px] text-[13px] font-medium leading-[18px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition hover:bg-[#2b2b2b]"
        >
          <Plus className="h-[11px] w-[11px]" />
          New Rule
        </Link>
      </div>
    </div>
  );
}

function NodeStatusPanel({ health }: { health: HealthResponse }) {
  const nodes = [
    {
      label: 'Backend API',
      meta: 'us-east-1a',
      icon: TerminalSquare,
      status: health.status,
      chipLabel: healthLabel(health.status),
    },
    {
      label: 'PostgreSQL DB',
      meta: 'primary-cluster',
      icon: Database,
      status: health.database,
      chipLabel: healthLabel(health.database, 'Syncing'),
    },
    {
      label: 'RPC Nodes (Helius)',
      meta: 'devnet-rpc-1',
      icon: Radio,
      status: health.blockchain,
      chipLabel: healthLabel(health.blockchain),
    },
    {
      label: 'Range API',
      meta: 'aml-screening-v2',
      icon: LockKeyhole,
      status: health.status === 'unhealthy' ? 'degraded' : 'healthy',
      chipLabel: health.status === 'unhealthy' ? 'Degraded' : 'Online',
    },
  ] satisfies Array<{
    label: string;
    meta: string;
    icon: typeof TerminalSquare;
    status: HealthStatus;
    chipLabel: string;
  }>;

  return (
    <Panel
      title="Node Status"
      className="h-[345px]"
      action={<Server className="h-[15px] w-[15px] text-[#47464a]" />}
      bodyClassName="px-[16px] pt-[16px]"
    >
      <div className="flex flex-col gap-[16px]">
        {nodes.map((node) => {
          const Icon = node.icon;
          return (
            <div key={node.label} className="flex h-[34px] items-center justify-between">
              <div className="flex items-center gap-[12px]">
                <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[2px] bg-[#f1edec] text-[#47464a]">
                  <Icon className="h-[15px] w-[15px]" />
                </div>
                <div>
                  <div className="text-[13px] font-medium leading-[18px] text-[#1c1b1b]">
                    {node.label}
                  </div>
                  <div className="font-mono text-[12px] leading-4 text-[#47464a]">
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

function SettlementQueuePanel({ transfers }: { transfers: TransferRequest[] }) {
  const metrics = useMemo(() => buildQueueMetrics(transfers), [transfers]);
  const rows = useMemo(() => buildQueueRows(transfers), [transfers]);

  return (
    <Panel
      title="Settlement Queue"
      className="h-[345px] lg:col-span-2"
      action={
        <div className="flex items-center gap-[8px] text-[13px] leading-[18px] text-[#47464a]">
          <span>Active Batch: #892</span>
          <button
            type="button"
            aria-label="Queue options"
            title="Queue options"
            className="flex h-[19px] w-[19px] items-center justify-center rounded-[2px] hover:bg-[#e5e2e1]"
          >
            <MoreHorizontal className="h-[11px] w-[11px]" />
          </button>
        </div>
      }
      bodyClassName="flex h-[296px] flex-col"
    >
      <div className="grid h-[85px] grid-cols-2 gap-x-[16px] border-b border-[rgba(200,197,202,0.5)] px-[16px] py-[16px] sm:grid-cols-4">
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
      <div className="flex h-[174px] flex-col gap-[12px] px-[16px] py-[16px]">
        {rows.map((row, index) => (
          <div
            key={`${row.batch}-${row.status}`}
            className={`flex h-[64px] items-center justify-between rounded-[2px] border px-[13px] ${
              index === 1
                ? 'border-[#6cf8bb] bg-[rgba(108,248,187,0.12)]'
                : 'border-[#e4e4e7] bg-white'
            }`}
          >
            <div className="flex items-center gap-[16px]">
              <div
                className={`flex h-[32px] w-[32px] items-center justify-center rounded-[2px] ${
                  row.icon === 'approved' ? 'bg-[rgba(108,248,187,0.22)] text-[#00714d]' : 'bg-[#f1edec] text-[#47464a]'
                }`}
              >
                {row.icon === 'approved' ? (
                  <ShieldCheck className="h-[13px] w-[13px]" />
                ) : (
                  <Clock3 className="h-[13px] w-[13px]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-[8px]">
                  <span className="text-[13px] font-medium leading-[18px] text-[#1c1b1b]">
                    {row.batch}
                  </span>
                  <span
                    className={`rounded-[2px] px-[6px] py-[2px] font-mono text-[11px] leading-[14px] ${
                      row.tone === 'healthy'
                        ? 'bg-[rgba(108,248,187,0.3)] text-[#00714d]'
                        : 'bg-[#e5e2e1] text-[#47464a]'
                    }`}
                  >
                    {row.status}
                  </span>
                </div>
                <div className="font-mono text-[12px] leading-4 text-[#47464a]">
                  {row.subtitle}
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-[12px] leading-4 text-[#1c1b1b]">
              <div>{row.amount}</div>
              <div className="text-[#47464a]">{row.fee}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex h-[35px] items-center justify-end border-t border-[#e4e4e7] bg-[#fafafa] px-[16px]">
        <button
          type="button"
          className="text-[13px] font-medium leading-[18px] text-[#1c1b1b] hover:underline"
        >
          View Full Queue +
        </button>
      </div>
    </Panel>
  );
}

function TransactionHistoryPanel({
  rows,
  total,
  query,
  onQueryChange,
}: {
  rows: TransactionRow[];
  total: number;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <Panel
      title="Recent Transactions"
      className="h-[378px] lg:col-span-2"
      action={
        <label className="relative block h-[32px] w-[256px]">
          <Search className="pointer-events-none absolute left-[12px] top-[10px] h-[12px] w-[12px] text-[#71717a]" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-[32px] w-full rounded-[2px] border border-[#e4e4e7] bg-white pl-[33px] pr-[12px] text-[12px] leading-4 text-[#1c1b1b] outline-none placeholder:text-[#71717a] focus:border-[#c8c5ca]"
            placeholder="Search ID, Wallet..."
          />
        </label>
      }
      bodyClassName="flex h-[329px] flex-col"
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <table className="w-full table-fixed border-collapse text-[12px]">
          <colgroup>
            <col className="w-[14%]" />
            <col className="w-[22%]" />
            <col className="w-[21%]" />
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
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={`h-[55px] border-b border-[#e4e4e7] ${
                    row.muted ? 'bg-[#fff8f8]' : 'bg-white'
                  }`}
                >
                  <td className="px-[16px] font-mono leading-4 text-[#1c1b1b]">{row.id}</td>
                  <td className="px-[16px]">
                    <div className="text-[13px] font-medium leading-[18px] text-[#1c1b1b]">
                      {row.merchant}
                    </div>
                    <div className="font-mono text-[12px] leading-4 text-[#47464a]">{row.sender}</div>
                  </td>
                  <td className="px-[16px] text-right font-mono leading-4 text-[#1c1b1b]">
                    {row.amount}
                  </td>
                  <td className="px-[16px]">
                    <StatusChip label={row.complianceLabel} tone={row.complianceTone} />
                  </td>
                  <td className="px-[16px] font-mono">
                    <SettlementStatus label={row.settlementLabel} tone={row.settlementTone} />
                  </td>
                </tr>
              ))
            ) : (
              <tr className="h-[55px] border-b border-[#e4e4e7]">
                <td className="px-[16px] text-[13px] text-[#71717a]" colSpan={5}>
                  No transactions match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex h-[44px] items-center justify-between border-t border-[#e4e4e7] bg-[#fafafa] px-[16px]">
        <div className="text-[12px] leading-[18px] text-[#47464a]">
          Showing {rows.length} of {total.toLocaleString()} transactions
        </div>
        <div className="flex items-center gap-[4px]">
          <button
            type="button"
            aria-label="Previous page"
            title="Previous page"
            className="flex h-[19px] w-[16px] items-center justify-center rounded-[2px] border border-[#e4e4e7] bg-white text-[#71717a]"
          >
            <ChevronLeft className="h-[10px] w-[10px]" />
          </button>
          <button
            type="button"
            aria-label="Next page"
            title="Next page"
            className="flex h-[19px] w-[16px] items-center justify-center rounded-[2px] border border-[#e4e4e7] bg-white text-[#71717a]"
          >
            <ChevronRight className="h-[10px] w-[10px]" />
          </button>
        </div>
      </div>
    </Panel>
  );
}

function WebhooksPanel({ events }: { events: TraceEvent[] }) {
  return (
    <Panel
      title="Live Webhooks"
      className="h-[403px]"
      action={
        <div className="flex items-center gap-[6px]">
          <span className="relative flex h-[8px] w-[8px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00714d] opacity-30" />
            <span className="relative inline-flex h-[8px] w-[8px] rounded-full bg-[#00714d]" />
          </span>
          <span className="text-[11px] font-semibold uppercase leading-4 tracking-[0.55px] text-[#00714d]">
            Listening
          </span>
        </div>
      }
      bodyClassName="relative h-[352px] bg-[#fdf8f8]"
    >
      <div className="absolute left-[24px] top-[16px] h-[320px] w-px bg-[#c8c5ca]" />
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
            <div
              key={`${event.time}-${event.title}`}
              className={`flex gap-[12px] ${event.muted ? 'opacity-60' : ''}`}
            >
              <div className="flex h-[20px] w-[16px] shrink-0 pt-[4px]">
                <span className={`h-[16px] w-[16px] rounded-full border-2 bg-white ${dotBorder}`} />
              </div>
              <div className="flex flex-col gap-[2px]">
                <div className="font-mono text-[12px] leading-4 text-[#47464a]">
                  {event.time} - {event.provider}
                </div>
                <div
                  className={`rounded-[2px] border bg-white p-[9px] font-mono text-[12px] leading-4 ${
                    event.tone === 'danger' ? 'border-[rgba(186,26,26,0.5)]' : 'border-[#c8c5ca]'
                  }`}
                >
                  <div
                    className={`font-medium ${event.tone === 'danger' ? 'text-[#ba1a1a]' : 'text-black'}`}
                  >
                    {event.title}
                  </div>
                  {event.detail && <div className="text-[#1c1b1b]">{event.detail}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
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
  return (
    <div className="flex items-center justify-between border border-[#e4e4e7] bg-white px-[12px] py-[8px] text-[12px] leading-4 text-[#47464a] lg:hidden">
      <div className="flex items-center gap-[8px]">
        {error ? <AlertCircle className="h-[14px] w-[14px] text-[#ba1a1a]" /> : <Activity className="h-[14px] w-[14px]" />}
        <span>
          {error ? 'API data unavailable; showing operator console structure.' : 'Live backend data active.'}
        </span>
        {lastUpdated && <span className="hidden sm:inline">Updated {lastUpdated.toLocaleTimeString()}</span>}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="flex h-[24px] w-[24px] items-center justify-center rounded-[2px] hover:bg-[#f1edec]"
        aria-label="Refresh operations data"
        title="Refresh operations data"
      >
        <RefreshCw className={`h-[13px] w-[13px] ${isLoading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}

export function OperationsDashboard() {
  const { health, transfers, isLoading, error, lastUpdated, refresh } = useOperationsData();
  const [query, setQuery] = useState('');

  const displayHealth = health ?? FALLBACK_HEALTH;
  const transactionRows = useMemo(() => buildTransactionRows(transfers), [transfers]);
  const filteredRows = useMemo(() => filterRows(transactionRows, query), [transactionRows, query]);
  const traceEvents = useMemo(() => buildTraceEvents(transfers), [transfers]);
  const totalTransactions = transfers.length > 0 ? transfers.length : 1_204;

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-[#1c1b1b]">
      <TopAppBar />
      <SideBar health={displayHealth} />
      <main className="min-h-screen pt-[56px] lg:pl-[256px]">
        <div className="flex min-h-[calc(100vh-56px)] flex-col gap-[24px] p-[24px]">
          <DataNotice
            isLoading={isLoading}
            error={error}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh(true)}
          />
          <PageHeader transfers={transfers} health={displayHealth} />

          <div className="grid gap-[24px] lg:grid-cols-3">
            <NodeStatusPanel health={displayHealth} />
            <SettlementQueuePanel transfers={transfers} />
          </div>

          <div className="grid gap-[24px] lg:grid-cols-3">
            <TransactionHistoryPanel
              rows={filteredRows}
              total={totalTransactions}
              query={query}
              onQueryChange={setQuery}
            />
            <WebhooksPanel events={traceEvents} />
          </div>
        </div>
      </main>
    </div>
  );
}
