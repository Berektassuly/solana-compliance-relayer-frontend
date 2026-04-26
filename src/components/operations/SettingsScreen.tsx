'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';

import { API_BASE_URL } from '@/lib/constants';
import { fetchHealth, type HealthResponse } from '@/services/health';
import {
  addToBlocklist,
  fetchBlocklist,
  removeFromBlocklist,
  type BlocklistEntry,
} from '@/services/blocklist';
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
  TextArea,
  TextInput,
} from './OperationsPrimitives';
import {
  formatDateTime,
  healthLabel,
  INITIAL_HEALTH,
  statusTone,
  titleCaseStatus,
} from './operations-utils';

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

function SettingsHeader({ health }: { health: HealthResponse }) {
  return (
    <div className="flex flex-col gap-[16px] md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-[4px]">
        <h1 className="text-[24px] font-semibold leading-8 tracking-[-0.48px] text-[#1c1b1b]">
          Settings
        </h1>
        <p className="text-[13px] leading-[18px] text-[#47464a]">
          Manage compliance rules, blocklist entries, and runtime visibility.
        </p>
      </div>
      <StatusChip label={`Admin API: ${healthLabel(health.status, 'Healthy')}`} tone={statusTone(health.status)} />
    </div>
  );
}

function BlocklistForm({
  onCreated,
}: {
  onCreated: (message: string) => void;
}) {
  const [address, setAddress] = useState('');
  const [reason, setReason] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const trimmedAddress = address.trim();
    const trimmedReason = reason.trim();
    const nextAddressError =
      trimmedAddress.length < 32 ? 'Enter a full Solana wallet address.' : null;
    const nextReasonError = trimmedReason.length < 3 ? 'Add a reason for the audit trail.' : null;
    setAddressError(nextAddressError);
    setReasonError(nextReasonError);
    return !nextAddressError && !nextReasonError;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await addToBlocklist(address.trim(), reason.trim());
      onCreated(response.message);
      setAddress('');
      setReason('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add address');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Panel title="Add Blocklist Rule" action={<Plus className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />} bodyClassName="p-[16px]">
      <form className="space-y-[16px]" onSubmit={handleSubmit}>
        {submitError && <ErrorBanner message={submitError} />}
        <div>
          <FieldLabel htmlFor="blocklist-address">Wallet Address</FieldLabel>
          <TextInput
            id="blocklist-address"
            value={address}
            onChange={(event) => {
              setAddress(event.target.value);
              setAddressError(null);
            }}
            placeholder="Base58 wallet address"
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            aria-invalid={addressError ? 'true' : undefined}
            aria-describedby={addressError ? 'blocklist-address-error' : undefined}
          />
          {addressError && (
            <p id="blocklist-address-error" className="mt-[6px] text-[12px] leading-4 text-[#ba1a1a]">
              {addressError}
            </p>
          )}
        </div>
        <div>
          <FieldLabel htmlFor="blocklist-reason">Reason</FieldLabel>
          <TextArea
            id="blocklist-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError(null);
            }}
            placeholder="Compliance reason"
            aria-invalid={reasonError ? 'true' : undefined}
            aria-describedby={reasonError ? 'blocklist-reason-error' : undefined}
          />
          {reasonError && (
            <p id="blocklist-reason-error" className="mt-[6px] text-[12px] leading-4 text-[#ba1a1a]">
              {reasonError}
            </p>
          )}
        </div>
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-[13px] w-[13px] animate-spin" aria-hidden="true" />
          ) : (
            <ShieldAlert className="h-[13px] w-[13px]" aria-hidden="true" />
          )}
          Add Rule
        </PrimaryButton>
      </form>
    </Panel>
  );
}

function BlocklistTable({
  entries,
  isLoading,
  error,
  deletingAddress,
  pendingRemove,
  onRefresh,
  onRequestRemove,
  onCancelRemove,
  onConfirmRemove,
}: {
  entries: BlocklistEntry[];
  isLoading: boolean;
  error: string | null;
  deletingAddress: string | null;
  pendingRemove: string | null;
  onRefresh: () => void;
  onRequestRemove: (address: string) => void;
  onCancelRemove: () => void;
  onConfirmRemove: (address: string) => void;
}) {
  return (
    <Panel
      title="Current Blocklist"
      action={
        <SecondaryButton onClick={onRefresh} disabled={isLoading} className="h-[30px] px-[10px]">
          <RefreshCw className={`h-[12px] w-[12px] ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </SecondaryButton>
      }
      bodyClassName="min-h-[420px]"
    >
      {error ? (
        <div className="p-[16px]">
          <ErrorBanner message={error} onRetry={onRefresh} />
        </div>
      ) : isLoading && entries.length === 0 ? (
        <div className="space-y-[10px] p-[16px]">
          <SkeletonBlock className="h-[42px]" />
          <SkeletonBlock className="h-[42px]" />
          <SkeletonBlock className="h-[42px]" />
        </div>
      ) : entries.length > 0 ? (
        <div className="overflow-auto">
          <table className="w-full min-w-[720px] border-collapse text-[12px]">
            <thead>
              <tr className="h-[40px] border-b border-[#e4e4e7] bg-white text-[11px] font-medium uppercase leading-4 tracking-[0.3px] text-[#47464a]">
                <th className="px-[16px] text-left">Address</th>
                <th className="px-[16px] text-left">Reason</th>
                <th className="px-[16px] text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const confirming = pendingRemove === entry.address;
                const deleting = deletingAddress === entry.address;
                return (
                  <tr key={entry.address} className="border-b border-[#e4e4e7] bg-white align-top">
                    <td className="px-[16px] py-[13px] font-mono text-[12px] text-[#1c1b1b]">
                      {formatAddress(entry.address, 8)}
                    </td>
                    <td className="px-[16px] py-[13px] text-[12px] leading-4 text-[#47464a]">
                      {entry.reason}
                      {confirming && (
                        <div className="mt-[10px] flex items-start gap-[8px] rounded-[2px] border border-[rgba(186,26,26,0.35)] bg-[#fff8f8] p-[8px] text-[#ba1a1a]">
                          <AlertTriangle className="mt-[1px] h-[13px] w-[13px] shrink-0" aria-hidden="true" />
                          <span>Removing this entry allows future transfers to pass internal blocklist checks.</span>
                        </div>
                      )}
                    </td>
                    <td className="px-[16px] py-[10px] text-right">
                      {confirming ? (
                        <div className="flex justify-end gap-[6px]">
                          <SecondaryButton onClick={onCancelRemove} disabled={deleting} className="h-[30px] px-[10px]">
                            <X className="h-[12px] w-[12px]" aria-hidden="true" />
                            Cancel
                          </SecondaryButton>
                          <button
                            type="button"
                            onClick={() => onConfirmRemove(entry.address)}
                            disabled={deleting}
                            className="inline-flex h-[30px] items-center justify-center gap-[6px] rounded-[2px] border border-[rgba(186,26,26,0.45)] bg-[#fff4f4] px-[10px] text-[12px] font-medium text-[#ba1a1a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ba1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deleting ? (
                              <Loader2 className="h-[12px] w-[12px] animate-spin" aria-hidden="true" />
                            ) : (
                              <Trash2 className="h-[12px] w-[12px]" aria-hidden="true" />
                            )}
                            Remove
                          </button>
                        </div>
                      ) : (
                        <SecondaryButton onClick={() => onRequestRemove(entry.address)} className="h-[30px] px-[10px]">
                          <Trash2 className="h-[12px] w-[12px]" aria-hidden="true" />
                          Remove
                        </SecondaryButton>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No blocked addresses" body="The backend blocklist is currently empty." />
      )}
    </Panel>
  );
}

function RuntimePanel({ health }: { health: HealthResponse }) {
  const backendLabel = API_BASE_URL || 'Same-origin';
  return (
    <Panel title="Runtime" action={<Database className="h-[15px] w-[15px] text-[#47464a]" aria-hidden="true" />} bodyClassName="p-[16px]">
      <KeyValue label="Backend URL" value={backendLabel} mono />
      <KeyValue label="API version" value={health.version} mono />
      <KeyValue label="System" value={titleCaseStatus(health.status)} />
      <KeyValue label="Database" value={titleCaseStatus(health.database)} />
      <KeyValue label="Blockchain" value={titleCaseStatus(health.blockchain)} />
      <KeyValue label="Health timestamp" value={formatDateTime(health.timestamp)} />
      <KeyValue label="Admin auth" value="Server-side proxy" />
    </Panel>
  );
}

function DocsPanel() {
  return (
    <Panel title="Docs" bodyClassName="p-[16px]" className="scroll-mt-[80px]" >
      <div id="docs" className="space-y-[10px] text-[12px] leading-4 text-[#47464a]">
        <KeyValue label="OpenAPI" value="/swagger-ui" mono />
        <KeyValue label="Health" value="GET /health" mono />
        <KeyValue label="Transfers" value="GET /transfer-requests" mono />
        <KeyValue label="Risk checks" value="POST /risk-check" mono />
      </div>
    </Panel>
  );
}

function SupportPanel() {
  return (
    <Panel title="Support" bodyClassName="p-[16px]" className="scroll-mt-[80px]">
      <div id="support" className="space-y-[10px]">
        <div className="flex items-start gap-[8px] rounded-[2px] border border-[#e4e4e7] bg-[#fafafa] p-[10px] text-[12px] leading-4 text-[#47464a]">
          <Settings className="mt-[1px] h-[14px] w-[14px] shrink-0" aria-hidden="true" />
          <span>
            Keep admin credentials in the Next.js server environment. Client requests use the
            local proxy route and never receive the key.
          </span>
        </div>
      </div>
    </Panel>
  );
}

export function SettingsScreen() {
  const health = useHealthSnapshot();
  const [entries, setEntries] = useState<BlocklistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<string | null>(null);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.address.localeCompare(b.address)),
    [entries]
  );

  const loadBlocklist = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const response = await fetchBlocklist();
      setEntries(response.entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blocklist');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadBlocklist(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadBlocklist]);

  const handleCreated = async (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
    await loadBlocklist(false);
  };

  const handleRemove = async (address: string) => {
    setDeletingAddress(address);
    setError(null);
    try {
      const response = await removeFromBlocklist(address);
      setSuccess(response.message);
      setPendingRemove(null);
      await loadBlocklist(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove address');
    } finally {
      setDeletingAddress(null);
    }
  };

  return (
    <OperationsShell health={health}>
      <SettingsHeader health={health} />
      {success && (
        <div className="flex items-center gap-[8px] border border-[rgba(0,113,77,0.25)] bg-[rgba(108,248,187,0.12)] px-[12px] py-[10px] text-[12px] leading-4 text-[#00714d]">
          <CheckCircle2 className="h-[14px] w-[14px]" aria-hidden="true" />
          {success}
        </div>
      )}

      <div className="grid gap-[24px] xl:grid-cols-[380px_1fr]">
        <div className="space-y-[24px]">
          <BlocklistForm onCreated={handleCreated} />
          <RuntimePanel health={health} />
          <DocsPanel />
          <SupportPanel />
        </div>
        <BlocklistTable
          entries={sortedEntries}
          isLoading={isLoading}
          error={error}
          deletingAddress={deletingAddress}
          pendingRemove={pendingRemove}
          onRefresh={() => loadBlocklist(true)}
          onRequestRemove={setPendingRemove}
          onCancelRemove={() => setPendingRemove(null)}
          onConfirmRemove={handleRemove}
        />
      </div>
    </OperationsShell>
  );
}
