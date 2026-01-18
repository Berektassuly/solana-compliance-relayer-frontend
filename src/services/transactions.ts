import type { Transaction } from '@/types/transaction';

// Mock transaction data matching the prototype
const mockTransactions: Transaction[] = [
  {
    id: 'tx_001',
    type: 'confidential',
    recipient: 'Ax39h7Kp2bNm5vQwRt8yLc4jDf6sGe9dK',
    amount: 100,
    token: 'USDC',
    status: 'pending',
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
  },
  {
    id: 'tx_002',
    type: 'public',
    recipient: 'NfD8mZx3pWq7yTb2nRvKs5hLc4jAxR1',
    amount: 500,
    token: 'USDC',
    status: 'confirmed',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
  {
    id: 'tx_003',
    type: 'confidential',
    recipient: 'Bk7nL2mPx9qWvRt4yHc8jDf3sGe5aM',
    amount: 250,
    token: 'SOL',
    status: 'confirmed',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: 'tx_004',
    type: 'public',
    recipient: 'Cx4pN8kRy7mWvQt3zHd9jEf2sGe6bL',
    amount: 1000,
    token: 'USDC',
    status: 'confirmed',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
  },
];

/**
 * Fetch all transactions (mocked)
 */
export async function getTransactions(): Promise<Transaction[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockTransactions;
}

/**
 * Fetch a single transaction by ID (mocked)
 */
export async function getTransactionById(id: string): Promise<Transaction | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockTransactions.find((tx) => tx.id === id) || null;
}

/**
 * Subscribe to transaction updates (mocked with polling simulation)
 */
export function subscribeToTransactions(
  callback: (transactions: Transaction[]) => void,
  intervalMs = 5000
): () => void {
  const interval = setInterval(async () => {
    const transactions = await getTransactions();
    callback(transactions);
  }, intervalMs);

  return () => clearInterval(interval);
}
