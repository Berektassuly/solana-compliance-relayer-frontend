import type { Transaction, TransferMode } from './transaction';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TransferRequest {
  mode: TransferMode;
  asset: string;
  recipient: string;
  amount: number;
}

export interface TransferResponse {
  transactionId: string;
  status: 'submitted' | 'failed';
  message?: string;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
}

export interface NetworkStats {
  activity: 'High' | 'Medium' | 'Low';
  anonymity: 'Strong' | 'Moderate' | 'Weak';
}
