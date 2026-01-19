'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle, RotateCw } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatAddress, lamportsToSol } from '@/lib/utils';
import { retryTransferRequest } from '@/services/transfer-requests';
import type { TransferRequest } from '@/types/transfer-request';

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
    <div className="overflow-x-auto">
      {retryError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {retryError}
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Recipient
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {transactions.map((tx, index) => {
            const isConfidential = tx.transfer_details.type === 'confidential';
            const amount =
              tx.transfer_details.type === 'public'
                ? tx.transfer_details.amount
                : null;
            const token = getTokenSymbol(tx.token_mint);
            const canRetry =
              tx.blockchain_status === 'failed' &&
              tx.blockchain_retry_count < 10;
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
                <td className="px-4 py-4">
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
                <td className="px-4 py-4">
                  <StatusBadge status={tx.blockchain_status} />
                  {tx.blockchain_status === 'failed' && tx.blockchain_last_error && (
                    <p className="text-xs text-red-400 mt-1 max-w-[200px] truncate">
                      {tx.blockchain_last_error}
                    </p>
                  )}
                </td>

                {/* ACTIONS Column */}
                <td className="px-4 py-4">
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
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
