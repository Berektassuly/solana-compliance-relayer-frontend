'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';

import { fetchHealth, type HealthResponse } from '@/services/health';
import {
  fetchTransferRequests,
  retryTransferRequest,
} from '@/services/transfer-requests';
import { fetchTransferAuditReport } from '@/services/audit-report';
import type { TransferAuditReport } from '@/types/audit-report';
import type { TransferRequest } from '@/types/transfer-request';
import { canRetryTransfer } from '@/types/transfer-request';
import { formatAddress } from '@/lib/utils';
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
  complianceLabel,
  formatAuditAmount,
  formatDateTime,
  formatTransferAmount,
  healthLabel,
  INITIAL_HEALTH,
  numberFormatter,
  settlementLabel,
  settlementTone,
  statusTone,
  titleCaseStatus,
  transferAmountNumber,
  transferMatchesQuery,
  transferShortId,
} from './operations-utils';

type SortKey = 'updated_desc' | 'updated_asc' | 'amount_desc' | 'amount_asc' | 'status';
type ComplianceFilter = 'all' | 'pending' | 'approved' | 'rejected';
type SettlementFilter =
  | 'all'
  | 'received'
  | 'pending'
  | 'pending_submission'
  | 'processing'
  | 'submitted'
  | 'confirmed'
  | 'failed'
  | 'expired';

function useHealthSnapshot() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetchHealth();
        if (!cancelled) setHealth(response);
      } catch {
        if (!cancelled) setHealth(INITIAL_HEALTH);
      }
    };
    void load();
    const interval = window.setInterval(load, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return health ?? INITIAL_HEALTH;
}

function sortTransfers(transfers: TransferRequest[], sortKey: SortKey) {
  const sorted = [...transfers];
  sorted.sort((a, b) => {
    if (sortKey === 'updated_asc') {
      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    }
    if (sortKey === 'amount_desc') {
      return transferAmountNumber(b) - transferAmountNumber(a);
    }
    if (sortKey === 'amount_asc') {
      return transferAmountNumber(a) - transferAmountNumber(b);
    }
    if (sortKey === 'status') {
      return `${a.compliance_status}:${a.blockchain_status}`.localeCompare(
        `${b.compliance_status}:${b.blockchain_status}`
      );
    }
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });
  return sorted;
}

function TransactionsHeader({
  count,
  health,
}: {
  count: number;
  health: HealthResponse;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-[16px] md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 flex flex-col gap-[4px]">
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.48px] text-[#1c1b1b]">
          Transactions
        </h1>
        <p className="max-w-[330px] text-[13px] leading-[18px] text-[#47464a] sm:max-w-none">
          Review transfer requests, audit evidence, and retry eligible failed settlements.
        </p>
      </div>
      <div className="flex items-center gap-[8px]">
        <StatusChip
          label={`API: ${healthLabel(health.status, 'Healthy')}`}
          tone={statusTone(health.status)}
        />
        <StatusChip label={`${numberFormatter.format(count)} loaded`} tone="neutral" />
      </div>
    </div>
  );
}

function FilterBar({
  query,
  sortKey,
  compliance,
  settlement,
  isLoading,
  onQueryChange,
  onSortChange,
  onComplianceChange,
  onSettlementChange,
  onRefresh,
}: {
  query: string;
  sortKey: SortKey;
  compliance: ComplianceFilter;
  settlement: SettlementFilter;
  isLoading: boolean;
  onQueryChange: (value: string) => void;
  onSortChange: (value: SortKey) => void;
  onComplianceChange: (value: ComplianceFilter) => void;
  onSettlementChange: (value: SettlementFilter) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-[12px] border border-[#c8c5ca] bg-white p-[12px] lg:flex-row lg:items-center">
      <label className="relative block h-[36px] min-w-0 flex-1">
        <span className="sr-only">Search transactions</span>
        <Search className="pointer-events-none absolute left-[12px] top-[11px] h-[13px] w-[13px] text-[#71717a]" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          type="search"
          autoComplete="off"
          spellCheck={false}
          className="h-[36px] w-full rounded-[2px] border border-[#e4e4e7] bg-white pl-[34px] pr-[12px] font-mono text-[12px] leading-4 text-[#1c1b1b] outline-none placeholder:text-[#71717a] focus:border-[#18181b] focus-visible:ring-2 focus-visible:ring-[#18181b]"
          placeholder="Search ID, wallet, signature, nonce..."
        />
      </label>

      <div className="grid grid-cols-2 gap-[8px] sm:grid-cols-4 lg:flex lg:items-center">
        <label className="sr-only" htmlFor="tx-sort">
          Sort transactions
        </label>
        <select
          id="tx-sort"
          value={sortKey}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
          className="h-[36px] rounded-[2px] border border-[#c8c5ca] bg-white px-[10px] text-[12px] text-[#1c1b1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
        >
          <option value="updated_desc">Newest update</option>
          <option value="updated_asc">Oldest update</option>
          <option value="amount_desc">Amount high</option>
          <option value="amount_asc">Amount low</option>
          <option value="status">Status</option>
        </select>

        <label className="sr-only" htmlFor="tx-compliance">
          Compliance filter
        </label>
        <select
          id="tx-compliance"
          value={compliance}
          onChange={(event) => onComplianceChange(event.target.value as ComplianceFilter)}
          className="h-[36px] rounded-[2px] border border-[#c8c5ca] bg-white px-[10px] text-[12px] text-[#1c1b1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
        >
          <option value="all">All compliance</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <label className="sr-only" htmlFor="tx-settlement">
          Settlement filter
        </label>
        <select
          id="tx-settlement"
          value={settlement}
          onChange={(event) => onSettlementChange(event.target.value as SettlementFilter)}
          className="h-[36px] rounded-[2px] border border-[#c8c5ca] bg-white px-[10px] text-[12px] text-[#1c1b1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
        >
          <option value="all">All settlement</option>
          <option value="received">Received</option>
          <option value="pending">Pending</option>
          <option value="pending_submission">Queued</option>
          <option value="processing">Processing</option>
          <option value="submitted">Submitted</option>
          <option value="confirmed">Confirmed</option>
          <option value="failed">Failed</option>
          <option value="expired">Expired</option>
        </select>

        <SecondaryButton onClick={onRefresh} disabled={isLoading} className="h-[36px] px-[10px]">
          <RefreshCw className={`h-[13px] w-[13px] ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </SecondaryButton>
      </div>
    </div>
  );
}

function TransactionsTable({
  transfers,
  selectedId,
  isLoading,
  onSelect,
}: {
  transfers: TransferRequest[];
  selectedId: string | null;
  isLoading: boolean;
  onSelect: (transfer: TransferRequest) => void;
}) {
  if (isLoading && transfers.length === 0) {
    return (
      <Panel
        title="Transfer Requests"
        action={<ClipboardList className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />}
        bodyClassName="min-h-[420px] p-[16px]"
        className="min-w-0"
      >
        <div className="space-y-[12px]">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-[36px] w-full" />
          ))}
        </div>
      </Panel>
    );
  }

  if (transfers.length === 0) {
    return (
      <Panel
        title="Transfer Requests"
        action={<ClipboardList className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />}
        bodyClassName="min-h-[420px]"
        className="min-w-0"
      >
        <EmptyState
          title="No transfer requests"
          body="The backend returned an empty page for the current filters."
        />
      </Panel>
    );
  }

  return (
    <Panel
      title="Transfer Requests"
      action={<ClipboardList className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />}
      bodyClassName="flex min-h-[520px] flex-col"
      className="min-w-0"
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[980px] border-collapse text-[12px]">
          <thead>
            <tr className="h-[40px] border-b border-[#e4e4e7] bg-white text-[11px] font-medium uppercase leading-4 tracking-[0.3px] text-[#47464a]">
              <th className="px-[16px] text-left">Request</th>
              <th className="px-[16px] text-left">Counterparties</th>
              <th className="px-[16px] text-right">Amount</th>
              <th className="px-[16px] text-left">Compliance</th>
              <th className="px-[16px] text-left">Settlement</th>
              <th className="px-[16px] text-left">Updated</th>
              <th className="px-[16px] text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((transfer) => {
                const selected = selectedId === transfer.id;
                return (
                  <tr
                    key={transfer.id}
                    className={`h-[58px] border-b border-[#e4e4e7] ${
                      selected ? 'bg-[rgba(108,248,187,0.10)]' : 'bg-white'
                    } ${transfer.compliance_status === 'rejected' ? 'text-[#5a1d1d]' : ''}`}
                  >
                    <td className="px-[16px]">
                      <button
                        type="button"
                        onClick={() => onSelect(transfer)}
                        className="font-mono text-[12px] font-medium text-[#1c1b1b] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
                      >
                        {transferShortId(transfer)}
                      </button>
                      <div className="mt-[2px] font-mono text-[11px] text-[#71717a]">
                        {transfer.nonce ? formatAddress(transfer.nonce, 6) : 'nonce unavailable'}
                      </div>
                    </td>
                    <td className="px-[16px]">
                      <div className="font-mono text-[12px] text-[#1c1b1b]">
                        to {formatAddress(transfer.to_address, 5)}
                      </div>
                      <div className="font-mono text-[11px] text-[#71717a]">
                        from {formatAddress(transfer.from_address, 5)}
                      </div>
                    </td>
                    <td className="px-[16px] text-right font-mono text-[#1c1b1b]">
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
                    <td className="px-[16px] text-[12px] text-[#47464a]">
                      {formatDateTime(transfer.updated_at)}
                    </td>
                    <td className="px-[16px] text-right">
                      <SecondaryButton onClick={() => onSelect(transfer)} className="h-[30px] px-[10px]">
                        Inspect
                      </SecondaryButton>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PaginationBar({
  pageIndex,
  hasMore,
  canGoBack,
  isLoading,
  onPrevious,
  onNext,
}: {
  pageIndex: number;
  hasMore: boolean;
  canGoBack: boolean;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between border border-t-0 border-[#c8c5ca] bg-[#fafafa] px-[16px] py-[10px]">
      <span className="text-[12px] text-[#47464a]">Page {pageIndex + 1}</span>
      <div className="flex items-center gap-[6px]">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoBack || isLoading}
          aria-label="Previous page"
          className="flex h-[32px] w-[32px] items-center justify-center rounded-[2px] border border-[#c8c5ca] bg-white text-[#47464a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-[14px] w-[14px]" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasMore || isLoading}
          aria-label="Next page"
          className="flex h-[32px] w-[32px] items-center justify-center rounded-[2px] border border-[#c8c5ca] bg-white text-[#47464a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-[14px] w-[14px]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function DetailPanel({
  transfer,
  audit,
  auditLoading,
  auditError,
  retrying,
  retryError,
  onRetry,
}: {
  transfer: TransferRequest | null;
  audit: TransferAuditReport | null;
  auditLoading: boolean;
  auditError: string | null;
  retrying: boolean;
  retryError: string | null;
  onRetry: () => void;
}) {
  return (
    <Panel
      title="Request Detail"
      action={
        transfer ? (
          <StatusChip
            label={titleCaseStatus(transfer.blockchain_status)}
            tone={statusTone(transfer.blockchain_status)}
          />
        ) : undefined
      }
      bodyClassName="p-[16px]"
    >
      {!transfer ? (
        <EmptyState
          compact
          title="No request selected"
          body="Choose a transfer request to inspect audit and settlement evidence."
        />
      ) : (
        <div className="space-y-[14px]">
          {retryError && <ErrorBanner message={retryError} />}
          <div>
            <KeyValue label="Request ID" value={transfer.id} mono />
            <KeyValue label="Sender" value={formatAddress(transfer.from_address, 8)} mono />
            <KeyValue label="Recipient" value={formatAddress(transfer.to_address, 8)} mono />
            <KeyValue label="Amount" value={formatTransferAmount(transfer)} mono />
            <KeyValue label="Compliance" value={complianceLabel(transfer.compliance_status)} />
            <KeyValue label="Settlement" value={settlementLabel(transfer)} mono />
            <KeyValue label="Retry count" value={`${transfer.blockchain_retry_count}/10`} mono />
            <KeyValue label="Updated" value={formatDateTime(transfer.updated_at)} />
          </div>

          {transfer.blockchain_signature && (
            <a
              href={`https://explorer.solana.com/tx/${transfer.blockchain_signature}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-[34px] items-center gap-[8px] rounded-[2px] border border-[#c8c5ca] bg-white px-[10px] font-mono text-[12px] text-[#1c1b1b] hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b]"
            >
              {formatAddress(transfer.blockchain_signature, 6)}
              <ExternalLink className="h-[12px] w-[12px]" aria-hidden="true" />
            </a>
          )}

          {transfer.blockchain_last_error && (
            <div className="rounded-[2px] border border-[rgba(186,26,26,0.35)] bg-[#fff8f8] p-[10px] text-[12px] leading-4 text-[#ba1a1a]">
              <div className="mb-[4px] flex items-center gap-[6px] font-semibold">
                <AlertCircle className="h-[13px] w-[13px]" aria-hidden="true" />
                Last error
              </div>
              {transfer.blockchain_last_error}
            </div>
          )}

          {canRetryTransfer(transfer.blockchain_status) && (
            <SecondaryButton onClick={onRetry} disabled={retrying} className="w-full">
              {retrying ? (
                <Loader2 className="h-[13px] w-[13px] animate-spin" aria-hidden="true" />
              ) : (
                <RotateCcw className="h-[13px] w-[13px]" aria-hidden="true" />
              )}
              Retry Failed Transfer
            </SecondaryButton>
          )}

          <div className="h-px bg-[#e4e4e7]" />

          <div>
            <div className="mb-[8px] text-[12px] font-semibold uppercase leading-4 tracking-[0.55px] text-[#47464a]">
              Audit Report
            </div>
            {auditLoading ? (
              <div className="space-y-[8px]">
                <SkeletonBlock className="h-[28px]" />
                <SkeletonBlock className="h-[28px]" />
                <SkeletonBlock className="h-[28px]" />
              </div>
            ) : auditError ? (
              <ErrorBanner message={auditError} />
            ) : audit ? (
              <div>
                <KeyValue label="Decision" value={titleCaseStatus(audit.final_decision)} />
                <KeyValue label="Audit amount" value={formatAuditAmount(audit.amount, audit.token_mint)} mono />
                <KeyValue label="Risk summary" value={audit.risk_decision_summary} />
                <KeyValue
                  label="Blocklist hits"
                  value={audit.internal_blocklist_hits.length.toString()}
                  mono
                />
                <KeyValue
                  label="Range risk"
                  value={audit.range_risk_score == null ? 'Unavailable' : `${audit.range_risk_score}/10`}
                  mono
                />
                <KeyValue label="Helius assets" value={audit.helius_asset_screening_status ?? 'Unavailable'} />
                <KeyValue
                  label="Private retry"
                  value={
                    audit.private_submission_metadata
                      ? titleCaseStatus(audit.private_submission_metadata.last_error_type)
                      : 'Unavailable'
                  }
                />
              </div>
            ) : (
              <EmptyState compact title="No audit loaded" body="Audit details load after selection." />
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

export function TransactionsScreen() {
  const health = useHealthSnapshot();
  const [items, setItems] = useState<TransferRequest[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updated_desc');
  const [compliance, setCompliance] = useState<ComplianceFilter>('all');
  const [settlement, setSettlement] = useState<SettlementFilter>('all');
  const [selected, setSelected] = useState<TransferRequest | null>(null);
  const [audit, setAudit] = useState<TransferAuditReport | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const cursor = cursorStack[pageIndex];

  const loadPage = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const response = await fetchTransferRequests(20, cursor);
      setItems(response.items);
      setNextCursor(response.next_cursor);
      setHasMore(response.has_more);
      setSelected((current) => {
        if (current && response.items.some((item) => item.id === current.id)) {
          return response.items.find((item) => item.id === current.id) ?? current;
        }
        return response.items[0] ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transfer requests');
    } finally {
      setIsLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPage(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadPage]);

  useEffect(() => {
    const interval = window.setInterval(() => loadPage(false), 10_000);
    return () => window.clearInterval(interval);
  }, [loadPage]);

  useEffect(() => {
    if (!selected) {
      setAudit(null);
      setAuditError(null);
      return;
    }

    let cancelled = false;
    setAuditLoading(true);
    setAuditError(null);
    void fetchTransferAuditReport(selected.id)
      .then((report) => {
        if (!cancelled) setAudit(report);
      })
      .catch((err) => {
        if (!cancelled) setAuditError(err instanceof Error ? err.message : 'Audit report unavailable');
      })
      .finally(() => {
        if (!cancelled) setAuditLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  const filteredItems = useMemo(() => {
    const filtered = items.filter((transfer) => {
      if (!transferMatchesQuery(transfer, query)) return false;
      if (compliance !== 'all' && transfer.compliance_status !== compliance) return false;
      if (settlement !== 'all' && transfer.blockchain_status !== settlement) return false;
      return true;
    });
    return sortTransfers(filtered, sortKey);
  }, [compliance, items, query, settlement, sortKey]);

  const handleNext = () => {
    if (!nextCursor) return;
    setCursorStack((prev) => {
      const next = prev.slice(0, pageIndex + 1);
      next.push(nextCursor);
      return next;
    });
    setPageIndex((index) => index + 1);
  };

  const handlePrevious = () => {
    setPageIndex((index) => Math.max(0, index - 1));
  };

  const handleRetry = async () => {
    if (!selected || !canRetryTransfer(selected.blockchain_status)) return;
    setRetrying(true);
    setRetryError(null);
    try {
      const updated = await retryTransferRequest(selected.id);
      setSelected(updated);
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <OperationsShell health={health}>
      <TransactionsHeader count={items.length} health={health} />
      {error && <ErrorBanner message={error} onRetry={() => loadPage(true)} />}
      <FilterBar
        query={query}
        sortKey={sortKey}
        compliance={compliance}
        settlement={settlement}
        isLoading={isLoading}
        onQueryChange={setQuery}
        onSortChange={setSortKey}
        onComplianceChange={setCompliance}
        onSettlementChange={setSettlement}
        onRefresh={() => loadPage(true)}
      />

      <div className="grid min-w-0 gap-[24px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <TransactionsTable
            transfers={filteredItems}
            selectedId={selected?.id ?? null}
            isLoading={isLoading}
            onSelect={(transfer) => {
              setSelected(transfer);
              setRetryError(null);
            }}
          />
          <PaginationBar
            pageIndex={pageIndex}
            hasMore={hasMore}
            canGoBack={pageIndex > 0}
            isLoading={isLoading}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        </div>
        <DetailPanel
          transfer={selected}
          audit={audit}
          auditLoading={auditLoading}
          auditError={auditError}
          retrying={retrying}
          retryError={retryError}
          onRetry={handleRetry}
        />
      </div>
    </OperationsShell>
  );
}
