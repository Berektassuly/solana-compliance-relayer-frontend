'use client';

import { motion } from 'framer-motion';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatAddress, formatAmount } from '@/lib/utils';
import type { Transaction } from '@/types/transaction';

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
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
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {transactions.map((tx, index) => (
            <motion.tr
              key={tx.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group hover:bg-panel-hover transition-colors duration-150"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {tx.type === 'confidential' ? (
                    <EyeOff className="h-4 w-4 text-primary" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted" />
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="font-mono text-sm text-foreground">
                  {formatAddress(tx.recipient)}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className="text-sm text-foreground">
                  {tx.type === 'confidential' ? (
                    <span className="text-muted">****</span>
                  ) : (
                    formatAmount(tx.amount, tx.token)
                  )}
                </span>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={tx.status} />
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
