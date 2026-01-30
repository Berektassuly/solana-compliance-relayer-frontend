'use client';

import { useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { TransactionTable } from './TransactionTable';
import { fetchTransferRequests, fetchTransferRequest } from '@/services/transfer-requests';
import { isTerminalStatus } from '@/types/transfer-request';
import type { TransferRequest } from '@/types/transfer-request';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const emptySubscribe = () => () => {};

/** Polling interval for GET /transfer-requests/{id} (per non-terminal transfer) */
const POLL_INTERVAL_MS = 5000;

export function Monitor() {
  const [transactions, setTransactions] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const transactionsRef = useRef<TransferRequest[]>([]);
  transactionsRef.current = transactions;

  // Use useSyncExternalStore for hydration detection (React 18+ pattern)
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Initial load: fetch list once
  const loadTransactions = useCallback(async (showLoadingState = false) => {
    if (showLoadingState) setIsLoading(true);
    setError(null);

    try {
      const response = await fetchTransferRequests(50);
      setTransactions(response.items);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    loadTransactions(true);
  }, [isMounted, loadTransactions]);

  // Poll GET /transfer-requests/{id} for each non-terminal transfer only.
  // Do NOT call POST /retry automatically — retry is only on manual "Retry" click.
  // Stop polling when status is confirmed, failed, or expired.
  useEffect(() => {
    if (!isMounted || transactions.length === 0) return;

    const nonTerminalIds = transactions
      .filter((tx) => !isTerminalStatus(tx.blockchain_status))
      .map((tx) => tx.id);

    if (nonTerminalIds.length === 0) return;

    const intervalId = setInterval(async () => {
      const current = transactionsRef.current;
      const idsToPoll = nonTerminalIds.filter((id) => {
        const tx = current.find((t) => t.id === id);
        return tx && !isTerminalStatus(tx.blockchain_status);
      });
      if (idsToPoll.length === 0) return;

      const results = await Promise.allSettled(
        idsToPoll.map((id) => fetchTransferRequest(id))
      );
      const updates = results
        .filter((r): r is PromiseFulfilledResult<TransferRequest> => r.status === 'fulfilled')
        .map((r) => r.value);
      if (updates.length === 0) return;

      setTransactions((prev) =>
        prev.map((t) => {
          const updated = updates.find((u) => u.id === t.id);
          return updated ?? t;
        })
      );
      setLastUpdated(new Date());
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isMounted, transactions, loadTransactions]);

  // Handle retry success (user clicked "Retry") — update local state
  const handleRetrySuccess = useCallback((updated: TransferRequest) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === updated.id ? updated : tx))
    );
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    loadTransactions(true);
  };

  return (
    <div className="rounded-xl border border-border bg-panel p-6 space-y-4 min-h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          MONITOR
        </h2>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 text-muted hover:text-foreground transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {!isMounted || (isLoading && transactions.length === 0) ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : (
        <TransactionTable
          transactions={transactions}
          onRetrySuccess={handleRetrySuccess}
        />
      )}

      {/* Polling indicator: GET /transfer-requests/{id} for non-terminal only; no auto-retry */}
      {transactions.some((tx) => !isTerminalStatus(tx.blockchain_status)) && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Polling status every 5s
        </div>
      )}
    </div>
  );
}
