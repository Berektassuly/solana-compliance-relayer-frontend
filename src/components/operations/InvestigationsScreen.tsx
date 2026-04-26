'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

import { fetchHealth, type HealthResponse } from '@/services/health';
import { fetchBlocklist, type BlocklistEntry } from '@/services/blocklist';
import { checkWalletRisk } from '@/services/risk-check';
import { fetchTransferRequest } from '@/services/transfer-requests';
import { fetchTransferAuditReport } from '@/services/audit-report';
import type { RiskCheckResponse } from '@/types/risk-check';
import { isBlockedResponse } from '@/types/risk-check';
import type { TransferAuditReport } from '@/types/audit-report';
import type { TransferRequest } from '@/types/transfer-request';
import { formatAddress } from '@/lib/utils';
import { OperationsShell } from './OperationsShell';
import {
  EmptyState,
  ErrorBanner,
  FieldLabel,
  KeyValue,
  Panel,
  PrimaryButton,
  SecondaryButton,
  SkeletonBlock,
  StatusChip,
  TextInput,
} from './OperationsPrimitives';
import {
  complianceLabel,
  formatAuditAmount,
  formatDateTime,
  formatTransferAmount,
  healthLabel,
  INITIAL_HEALTH,
  settlementLabel,
  statusTone,
  titleCaseStatus,
  transferShortId,
} from './operations-utils';

type InvestigationMode = 'wallet' | 'transfer';

interface InvestigationResult {
  mode: InvestigationMode;
  query: string;
  risk?: RiskCheckResponse;
  transfer?: TransferRequest;
  audit?: TransferAuditReport;
}

function looksLikeTransferId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

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

function InvestigationHeader() {
  return (
    <div className="flex flex-col gap-[4px]">
      <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.48px] text-[#1c1b1b]">
        Investigations
      </h1>
      <p className="text-[13px] leading-[18px] text-[#47464a]">
        Check wallets, transfer evidence, and blocklist decisions against live backend records.
      </p>
    </div>
  );
}

function InvestigationForm({
  mode,
  query,
  isLoading,
  error,
  onModeChange,
  onQueryChange,
  onSubmit,
}: {
  mode: InvestigationMode;
  query: string;
  isLoading: boolean;
  error: string | null;
  onModeChange: (mode: InvestigationMode) => void;
  onQueryChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Panel
      title="Investigation Console"
      action={<FileSearch className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />}
      bodyClassName="p-[16px]"
    >
      <form className="flex flex-col gap-[16px]" onSubmit={onSubmit}>
        <fieldset className="space-y-[8px]">
          <legend className="text-[12px] font-semibold uppercase leading-4 tracking-[0.55px] text-[#47464a]">
            Lookup Type
          </legend>
          <div className="grid grid-cols-2 rounded-[2px] border border-[#c8c5ca] bg-[#fafafa] p-[2px]">
            {(['wallet', 'transfer'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onModeChange(item)}
                className={`h-[32px] rounded-[2px] text-[12px] font-medium capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] ${
                  mode === item ? 'bg-white text-[#18181b] shadow-sm' : 'text-[#71717a]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <FieldLabel htmlFor="investigation-query">
            {mode === 'wallet' ? 'Wallet Address' : 'Transfer Request ID'}
          </FieldLabel>
          <div className="relative">
            <Search className="pointer-events-none absolute left-[10px] top-[10px] h-[14px] w-[14px] text-[#71717a]" />
            <TextInput
              id="investigation-query"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={
                mode === 'wallet'
                  ? 'Base58 wallet address'
                  : '550e8400-e29b-41d4-a716-446655440000'
              }
              autoComplete="off"
              spellCheck={false}
              className="pl-[32px] font-mono"
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={error ? 'investigation-error' : undefined}
            />
          </div>
          {error && (
            <p id="investigation-error" className="mt-[6px] text-[12px] leading-4 text-[#ba1a1a]">
              {error}
            </p>
          )}
        </div>

        <PrimaryButton type="submit" disabled={isLoading || query.trim().length === 0}>
          {isLoading ? (
            <Loader2 className="h-[13px] w-[13px] animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-[13px] w-[13px]" aria-hidden="true" />
          )}
          Run Check
        </PrimaryButton>
      </form>
    </Panel>
  );
}

function RiskOutcomePanel({
  result,
  isLoading,
}: {
  result: InvestigationResult | null;
  isLoading: boolean;
}) {
  const risk = result?.risk;
  return (
    <Panel
      title="Risk Outcome"
      action={
        risk ? (
          <StatusChip
            label={isBlockedResponse(risk) ? 'Blocked' : titleCaseStatus(risk.risk_level)}
            tone={isBlockedResponse(risk) ? 'danger' : risk.risk_score >= 7 ? 'danger' : risk.risk_score >= 4 ? 'warning' : 'healthy'}
          />
        ) : undefined
      }
      bodyClassName="p-[16px]"
    >
      {isLoading ? (
        <div className="space-y-[12px]">
          <SkeletonBlock className="h-[72px]" />
          <SkeletonBlock className="h-[72px]" />
        </div>
      ) : risk ? (
        <div className="space-y-[10px]">
          <div
            className={`rounded-[2px] border p-[12px] ${
              isBlockedResponse(risk)
                ? 'border-[rgba(186,26,26,0.35)] bg-[#fff8f8]'
                : 'border-[rgba(0,113,77,0.25)] bg-[rgba(108,248,187,0.10)]'
            }`}
          >
            <div className="flex items-center gap-[8px]">
              {isBlockedResponse(risk) ? (
                <ShieldAlert className="h-[16px] w-[16px] text-[#ba1a1a]" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-[16px] w-[16px] text-[#00714d]" aria-hidden="true" />
              )}
              <span className="text-[13px] font-semibold text-[#1c1b1b]">
                {isBlockedResponse(risk) ? 'Internal blocklist hit' : 'Wallet analyzed'}
              </span>
            </div>
            <p className="mt-[8px] font-mono text-[12px] leading-4 text-[#47464a]">
              {formatAddress(risk.address, 6)}
            </p>
          </div>

          {isBlockedResponse(risk) ? (
            <KeyValue label="Blocklist reason" value={risk.reason} />
          ) : (
            <>
              <KeyValue label="Range risk score" value={`${risk.risk_score}/10`} mono />
              <KeyValue label="Range risk level" value={risk.risk_level} />
              <KeyValue
                label="Helius assets"
                value={risk.helius_assets_checked ? (risk.has_sanctioned_assets ? 'Sanctioned assets detected' : 'Clear') : 'Not checked'}
              />
              <KeyValue label="Cache" value={risk.from_cache ? 'Cached response' : 'Fresh check'} />
              <KeyValue label="Checked" value={formatDateTime(risk.checked_at)} />
              <div className="rounded-[2px] border border-[#e4e4e7] bg-[#fafafa] p-[10px] text-[12px] leading-4 text-[#47464a]">
                {risk.reasoning || 'No provider reasoning returned.'}
              </div>
            </>
          )}
        </div>
      ) : (
        <EmptyState
          compact
          title="No wallet check yet"
          body="Run a wallet lookup to see Range, Helius, and internal blocklist evidence."
        />
      )}
    </Panel>
  );
}

function TransferEvidencePanel({
  result,
  isLoading,
}: {
  result: InvestigationResult | null;
  isLoading: boolean;
}) {
  const transfer = result?.transfer;
  const audit = result?.audit;

  return (
    <Panel
      title="Transfer Evidence"
      action={
        audit ? (
          <StatusChip label={titleCaseStatus(audit.final_decision)} tone={statusTone(audit.blockchain_status)} />
        ) : undefined
      }
      bodyClassName="p-[16px]"
    >
      {isLoading ? (
        <div className="space-y-[10px]">
          <SkeletonBlock className="h-[34px]" />
          <SkeletonBlock className="h-[34px]" />
          <SkeletonBlock className="h-[34px]" />
        </div>
      ) : transfer ? (
        <div>
          <KeyValue label="Transfer" value={transferShortId(transfer)} mono />
          <KeyValue label="Sender" value={formatAddress(transfer.from_address, 6)} mono />
          <KeyValue label="Recipient" value={formatAddress(transfer.to_address, 6)} mono />
          <KeyValue label="Amount" value={formatTransferAmount(transfer)} mono />
          <KeyValue label="Compliance" value={complianceLabel(transfer.compliance_status)} />
          <KeyValue label="Settlement" value={settlementLabel(transfer)} mono />
          <KeyValue label="Updated" value={formatDateTime(transfer.updated_at)} />
          {audit && (
            <>
              <div className="my-[12px] h-px bg-[#e4e4e7]" />
              <KeyValue label="Audit amount" value={formatAuditAmount(audit.amount, audit.token_mint)} mono />
              <KeyValue label="Risk summary" value={audit.risk_decision_summary} />
              <KeyValue
                label="Blocklist hits"
                value={audit.internal_blocklist_hits.length.toString()}
                mono
              />
              <KeyValue
                label="Range score"
                value={audit.range_risk_score == null ? 'Unavailable' : `${audit.range_risk_score}/10`}
                mono
              />
              <KeyValue label="Helius screening" value={audit.helius_asset_screening_status ?? 'Unavailable'} />
            </>
          )}
        </div>
      ) : (
        <EmptyState
          compact
          title="No transfer selected"
          body="Search by transfer ID to inspect compliance and settlement evidence."
        />
      )}
    </Panel>
  );
}

function BlocklistContextPanel({
  entries,
  error,
  isLoading,
  onRefresh,
}: {
  entries: BlocklistEntry[];
  error: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  return (
    <Panel
      title="Blocklist Context"
      action={
        <SecondaryButton onClick={onRefresh} disabled={isLoading} className="h-[30px] px-[10px]">
          <RefreshCw className={`h-[12px] w-[12px] ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </SecondaryButton>
      }
      bodyClassName="p-[16px]"
    >
      {error ? (
        <ErrorBanner message={error} onRetry={onRefresh} />
      ) : isLoading && entries.length === 0 ? (
        <div className="space-y-[8px]">
          <SkeletonBlock className="h-[32px]" />
          <SkeletonBlock className="h-[32px]" />
          <SkeletonBlock className="h-[32px]" />
        </div>
      ) : entries.length > 0 ? (
        <div className="space-y-[8px]">
          {entries.slice(0, 6).map((entry) => (
            <div
              key={entry.address}
              className="rounded-[2px] border border-[#e4e4e7] bg-[#fafafa] p-[10px]"
            >
              <div className="font-mono text-[12px] leading-4 text-[#1c1b1b]">
                {formatAddress(entry.address, 6)}
              </div>
              <div className="mt-[4px] text-[12px] leading-4 text-[#71717a]">{entry.reason}</div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState compact title="No blocked addresses" body="The backend blocklist is empty." />
      )}
    </Panel>
  );
}

function EvidenceConsole({ result }: { result: InvestigationResult | null }) {
  const lines = useMemo(() => {
    if (!result) {
      return ['awaiting operator query'];
    }
    const output: string[] = [`mode=${result.mode}`, `query=${result.query}`];
    if (result.risk) {
      output.push(`risk.status=${result.risk.status}`);
      if (isBlockedResponse(result.risk)) {
        output.push(`blocklist.reason=${result.risk.reason}`);
      } else {
        output.push(`range.score=${result.risk.risk_score}`);
        output.push(`helius.checked=${result.risk.helius_assets_checked}`);
        output.push(`cache=${result.risk.from_cache}`);
      }
    }
    if (result.transfer) {
      output.push(`transfer.id=${result.transfer.id}`);
      output.push(`compliance=${result.transfer.compliance_status}`);
      output.push(`settlement=${result.transfer.blockchain_status}`);
    }
    if (result.audit) {
      output.push(`audit.final_decision=${result.audit.final_decision}`);
      output.push(`audit.blocklist_hits=${result.audit.internal_blocklist_hits.length}`);
    }
    return output;
  }, [result]);

  return (
    <Panel title="Evidence Trace" bodyClassName="bg-[#171313] p-[16px]">
      <pre className="min-h-[180px] overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-5 text-[#d5d0cf]">
        {lines.map((line) => `> ${line}`).join('\n')}
      </pre>
    </Panel>
  );
}

export function InvestigationsScreen() {
  const health = useHealthSnapshot();
  const [mode, setMode] = useState<InvestigationMode>('wallet');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocklist, setBlocklist] = useState<BlocklistEntry[]>([]);
  const [blocklistLoading, setBlocklistLoading] = useState(true);
  const [blocklistError, setBlocklistError] = useState<string | null>(null);

  const loadBlocklist = useCallback(async () => {
    setBlocklistLoading(true);
    setBlocklistError(null);
    try {
      const response = await fetchBlocklist();
      setBlocklist(response.entries);
    } catch (err) {
      setBlocklistError(err instanceof Error ? err.message : 'Blocklist unavailable');
    } finally {
      setBlocklistLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadBlocklist();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadBlocklist]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'wallet') {
        const risk = await checkWalletRisk(trimmed);
        setResult({ mode, query: trimmed, risk });
      } else {
        if (!looksLikeTransferId(trimmed)) {
          throw new Error('Enter a transfer request UUID.');
        }
        const transfer = await fetchTransferRequest(trimmed);
        const audit = await fetchTransferAuditReport(trimmed);
        setResult({ mode, query: trimmed, transfer, audit });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Investigation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const headerStatus = health.status === 'healthy' ? 'Healthy' : healthLabel(health.status, 'Healthy');

  return (
    <OperationsShell health={health}>
      <div className="flex flex-col gap-[16px] md:flex-row md:items-end md:justify-between">
        <InvestigationHeader />
        <StatusChip label={`Risk services: ${headerStatus}`} tone={statusTone(health.status)} />
      </div>

      <div className="grid gap-[24px] xl:grid-cols-[360px_1fr_360px]">
        <div className="space-y-[24px]">
          <InvestigationForm
            mode={mode}
            query={query}
            isLoading={isLoading}
            error={error}
            onModeChange={setMode}
            onQueryChange={(value) => {
              setQuery(value);
              if (looksLikeTransferId(value.trim())) setMode('transfer');
            }}
            onSubmit={handleSubmit}
          />
          <BlocklistContextPanel
            entries={blocklist}
            error={blocklistError}
            isLoading={blocklistLoading}
            onRefresh={loadBlocklist}
          />
        </div>

        <div className="space-y-[24px]">
          {error && <ErrorBanner message={error} />}
          <RiskOutcomePanel result={result} isLoading={isLoading && mode === 'wallet'} />
          <TransferEvidencePanel result={result} isLoading={isLoading && mode === 'transfer'} />
        </div>

        <div className="space-y-[24px]">
          <Panel title="Provider Checks" bodyClassName="p-[16px]">
            <KeyValue label="Backend API" value={titleCaseStatus(health.status)} />
            <KeyValue label="Database" value={titleCaseStatus(health.database)} />
            <KeyValue label="RPC / Helius" value={titleCaseStatus(health.blockchain)} />
            <KeyValue label="Risk endpoint" value="/risk-check" mono />
          </Panel>
          <EvidenceConsole result={result} />
          <Panel title="Operator Notes" bodyClassName="p-[16px]">
            <div className="flex items-start gap-[8px] rounded-[2px] border border-[#e4e4e7] bg-[#fafafa] p-[10px] text-[12px] leading-4 text-[#47464a]">
              <AlertTriangle className="mt-[1px] h-[14px] w-[14px] shrink-0 text-[#8a5300]" aria-hidden="true" />
              <span>
                Provider outcomes only appear after the backend returns them. Missing Range or
                Helius fields are shown as unavailable, not inferred.
              </span>
            </div>
          </Panel>
        </div>
      </div>
    </OperationsShell>
  );
}
