'use client';

import { useEffect, useState } from 'react';
import { TransactionTable } from './TransactionTable';
import { useUIStore } from '@/store/useUIStore';
import { getTransactions } from '@/services/transactions';
import type { Transaction } from '@/types/transaction';
import { Loader2 } from 'lucide-react';

export function Monitor() {
  const { transactions: storeTransactions } = useUIStore();
  const [initialTransactions, setInitialTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before rendering dynamic content
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load initial mock transactions
  useEffect(() => {
    if (!isMounted) return;
    getTransactions()
      .then(setInitialTransactions)
      .finally(() => setIsLoading(false));
  }, [isMounted]);

  // Combine store transactions with initial mock data
  const allTransactions = [...storeTransactions, ...initialTransactions];

  return (
    <div className="rounded-xl border border-border bg-panel p-6 space-y-4 min-h-[400px]">
      <h2 className="text-lg font-semibold text-foreground tracking-tight">
        MONITOR
      </h2>
      
      {!isMounted || isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : (
        <TransactionTable transactions={allTransactions} />
      )}
    </div>
  );
}
