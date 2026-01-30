'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle, RotateCw, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatAddress, lamportsToSol } from '@/lib/utils';
import { retryTransferRequest } from '@/services/transfer-requests';
import type { TransferRequest } from '@/types/transfer-request';
import { canRetryTransfer, requiresResign } from '@/types/transfer-request';

interface TransactionTableProps {
  transactions: TransferRequest[];
  onRetrySuccess?: (updated: TransferRequest) => void;
}

/**
 * Get display token symbol from token_mint.
 * If token_mint is null, it's native SOL.
 * Otherwise, show truncated mint address or known symbol.
 */
function getTokenSymbol(tokenMint: string | null): string {
  if (!tokenMint) return 'SOL';
  // Known token mints (add more as needed)
  const KNOWN_MINTS: Record<string, string> = {
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  };
  return KNOWN_MINTS[tokenMint] ?? 'TOKEN';
}

export function TransactionTable({ transactions, onRetrySuccess }: TransactionTableProps) {
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    setRetryError(null);
    try {
      const updated = await retryTransferRequest(id);
      onRetrySuccess?.(updated);
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : 'Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted">
        <CheckCircle className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {retryError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {retryError}
        </div>
      )}
      <div className="overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-panel sticky top-0 z-10">
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider w-[60px]">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider w-[140px]">
                Recipient
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider w-[120px]">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-2 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider w-[90px]">
                Actions
              </th>
            </tr>
          </thead>
        </table>
      </div>
      <div className="overflow-y-auto max-h-[240px] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[60px]" />
            <col className="w-[140px]" />
            <col className="w-[120px]" />
            <col />
            <col className="w-[90px]" />
          </colgroup>
          <tbody className="divide-y divide-border/50">
          {transactions.map((tx, index) => {
            const isConfidential = tx.transfer_details.type === 'confidential';
            const amount =
              tx.transfer_details.type === 'public'
                ? tx.transfer_details.amount
                : null;
            const token = getTokenSymbol(tx.token_mint);
            // v0.3.0: Use utility functions for retry logic
            const canRetry = canRetryTransfer(tx.blockchain_status) && tx.blockchain_retry_count < 10;
            const needsResign = requiresResign(tx.blockchain_status);
            const isRetrying = retryingId === tx.id;

            return (
              <motion.tr
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group hover:bg-panel-hover transition-colors duration-150"
              >
                {/* TYPE Column */}
                <td className="px-4 py-4 w-12">
                  <div className="flex items-center gap-2">
                    {isConfidential ? (
                      <EyeOff className="h-4 w-4 text-primary" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted" />
                    )}
                  </div>
                </td>

                {/* RECIPIENT Column */}
                <td className="px-4 py-4">
                  <span className="font-mono text-sm text-foreground">
                    {formatAddress(tx.to_address)}
                  </span>
                </td>

                {/* AMOUNT Column */}
                <td className="px-4 py-4">
                  <span className="text-sm text-foreground">
                    {isConfidential ? (
                      <span className="text-muted">****</span>
                    ) : (
                      `${lamportsToSol(amount!)} ${token}`
                    )}
                  </span>
                </td>

                {/* STATUS Column */}
                <td className="px-4 py-4 min-w-[280px]">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={tx.blockchain_status} showTooltip />
                    {tx.blockchain_signature && (
                      <a
                        href={`https://explorer.solana.com/tx/${tx.blockchain_signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted hover:text-primary transition-colors"
                        title="View on Solana Explorer (Devnet)"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  {/* Error message for failed status */}
                  {tx.blockchain_status === 'failed' && tx.blockchain_last_error && (
                    <p className="text-xs text-red-400 mt-1 break-words">
                      {tx.blockchain_last_error}
                    </p>
                  )}
                  {/* v0.3.0: Special message for expired status */}
                  {needsResign && (
                    <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Blockhash expired — please create a new transfer
                    </p>
                  )}
                </td>

                {/* ACTIONS Column */}
                <td className="px-2 py-4 w-20">
                  {canRetry && (
                    <button
                      onClick={() => handleRetry(tx.id)}
                      disabled={isRetrying}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCw
                        className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`}
                      />
                      {isRetrying ? 'Retrying...' : 'Retry'}
                    </button>
                  )}
                  {/* v0.3.0: Re-sign button for expired transactions */}
                  {needsResign && (
                    <button
                      onClick={() => {
                        // Scroll to top or focus on the transfer form
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        // Could also trigger a callback to pre-fill the form
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 rounded-md transition-colors"
                      title="Create a new transfer request with fresh signature"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Re-sign
                    </button>
                  )}
                </td>
              </motion.tr>
            );
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
