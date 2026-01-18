export type TransferMode = 'public' | 'confidential';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface Transaction {
  id: string;
  type: TransferMode;
  recipient: string;
  amount: number;
  token: string;
  status: TransactionStatus;
  timestamp: Date;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  description: string;
}
