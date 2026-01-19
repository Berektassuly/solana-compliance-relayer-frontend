'use client';

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { TransactionTable } from './TransactionTable';
import { fetchTransferRequests } from '@/services/transfer-requests';
import { isTerminalStatus } from '@/types/transfer-request';
import type { TransferRequest } from '@/types/transfer-request';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

const emptySubscribe = () => () => {};

/** Polling interval in milliseconds */
const POLL_INTERVAL_MS = 5000;

export function Monitor() {
  const [transactions, setTransactions] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Use useSyncExternalStore for hydration detection (React 18+ pattern)
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Fetch transactions from API
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

  // Initial load
  useEffect(() => {
    if (!isMounted) return;
    loadTransactions(true);
  }, [isMounted, loadTransactions]);

  // Polling effect - polls every 5s if there are non-terminal transactions
  useEffect(() => {
    if (!isMounted) return;

    // Check if there are any non-terminal transactions
    const hasNonTerminal = transactions.some(
      (tx) => !isTerminalStatus(tx.blockchain_status)
    );

    // If all transactions are terminal, don't poll
    if (!hasNonTerminal && transactions.length > 0) {
      return;
    }

    const intervalId = setInterval(() => {
      loadTransactions(false);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isMounted, transactions, loadTransactions]);

  // Handle retry success - update local state
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

      {/* Polling indicator */}
      {transactions.some((tx) => !isTerminalStatus(tx.blockchain_status)) && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          Auto-refreshing every 5s
        </div>
      )}
    </div>
  );
}
