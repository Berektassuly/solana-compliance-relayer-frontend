import { create } from 'zustand';
import type { Transaction, TransferMode } from '@/types/transaction';

interface UIState {
  // Transfer mode state
  transferMode: TransferMode;
  setTransferMode: (mode: TransferMode) => void;
  
  // Transactions state
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  updateTransactionStatus: (id: string, status: Transaction['status']) => void;
  
  // Loading states
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Default to public mode
  transferMode: 'public',
  setTransferMode: (mode) => set({ transferMode: mode }),
  
  // Transactions list
  transactions: [],
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),
  updateTransactionStatus: (id, status) =>
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id ? { ...tx, status } : tx
      ),
    })),
  
  // Loading state
  isSubmitting: false,
  setIsSubmitting: (value) => set({ isSubmitting: value }),
}));
