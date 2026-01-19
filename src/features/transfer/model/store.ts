/**
 * Transfer Store - Zustand store for managing transfer state
 * 
 * Uses React 19 patterns with Zustand 5 for optimal performance
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { 
  TransferRequest, 
  BlockchainStatus,
  SubmitTransferRequest,
} from '@/shared/api';
import { 
  submitTransfer as apiSubmitTransfer, 
  getTransfer,
  listTransfers,
  retryTransfer as apiRetryTransfer,
  isTerminalStatus,
  ApiClientError,
} from '@/shared/api';

// ============================================================================
// Types
// ============================================================================

interface TransferState {
  // State
  transfers: Map<string, TransferRequest>;
  pendingPollingIds: Set<string>;
  isLoading: boolean;
  error: { type: string; message: string } | null;
  
  // Pagination
  nextCursor: string | null;
  hasMore: boolean;
  
  // Actions
  submitTransfer: (request: SubmitTransferRequest) => Promise<TransferRequest>;
  loadTransfers: (refresh?: boolean) => Promise<void>;
  loadMoreTransfers: () => Promise<void>;
  retryTransfer: (id: string) => Promise<TransferRequest>;
  updateTransferStatus: (id: string, status: BlockchainStatus) => void;
  startPolling: (id: string) => void;
  stopPolling: (id: string) => void;
  clearError: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useTransferStore = create<TransferState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    transfers: new Map(),
    pendingPollingIds: new Set(),
    isLoading: false,
    error: null,
    nextCursor: null,
    hasMore: true,
    
    // Submit a new transfer
    submitTransfer: async (request) => {
      set({ isLoading: true, error: null });
      
      try {
        const transfer = await apiSubmitTransfer(request);
        
        set((state) => ({
          transfers: new Map(state.transfers).set(transfer.id, transfer),
          isLoading: false,
        }));
        
        // Start polling for non-terminal transfers
        if (!isTerminalStatus(transfer.blockchain_status)) {
          get().startPolling(transfer.id);
        }
        
        return transfer;
      } catch (err) {
        const error = err instanceof ApiClientError
          ? { type: err.type, message: err.message }
          : { type: 'unknown', message: 'An unexpected error occurred' };
        
        set({ isLoading: false, error });
        throw err;
      }
    },
    
    // Load initial transfers
    loadTransfers: async (refresh = false) => {
      set({ isLoading: true, error: null });
      
      try {
        const response = await listTransfers(20);
        
        const transfersMap = new Map<string, TransferRequest>();
        for (const transfer of response.items) {
          transfersMap.set(transfer.id, transfer);
        }
        
        set({
          transfers: refresh ? transfersMap : new Map([...get().transfers, ...transfersMap]),
          nextCursor: response.next_cursor ?? null,
          hasMore: response.has_more,
          isLoading: false,
        });
      } catch (err) {
        const error = err instanceof ApiClientError
          ? { type: err.type, message: err.message }
          : { type: 'network_error', message: 'Failed to load transfers' };
        
        set({ isLoading: false, error });
      }
    },
    
    // Load more transfers (pagination)
    loadMoreTransfers: async () => {
      const { nextCursor, hasMore, isLoading } = get();
      
      if (!hasMore || isLoading || !nextCursor) return;
      
      set({ isLoading: true });
      
      try {
        const response = await listTransfers(20, nextCursor);
        
        set((state) => {
          const newTransfers = new Map(state.transfers);
          for (const transfer of response.items) {
            newTransfers.set(transfer.id, transfer);
          }
          
          return {
            transfers: newTransfers,
            nextCursor: response.next_cursor ?? null,
            hasMore: response.has_more,
            isLoading: false,
          };
        });
      } catch {
        set({ isLoading: false });
      }
    },
    
    // Retry a failed transfer
    retryTransfer: async (id) => {
      set({ error: null });
      
      try {
        const transfer = await apiRetryTransfer(id);
        
        set((state) => ({
          transfers: new Map(state.transfers).set(transfer.id, transfer),
        }));
        
        // Start polling again
        if (!isTerminalStatus(transfer.blockchain_status)) {
          get().startPolling(transfer.id);
        }
        
        return transfer;
      } catch (err) {
        const error = err instanceof ApiClientError
          ? { type: err.type, message: err.message }
          : { type: 'unknown', message: 'Failed to retry transfer' };
        
        set({ error });
        throw err;
      }
    },
    
    // Update transfer status (called from polling)
    updateTransferStatus: (id, status) => {
      set((state) => {
        const transfer = state.transfers.get(id);
        if (!transfer) return state;
        
        const updated = { ...transfer, blockchain_status: status };
        const newTransfers = new Map(state.transfers).set(id, updated);
        
        // Stop polling if terminal
        const newPolling = new Set(state.pendingPollingIds);
        if (isTerminalStatus(status)) {
          newPolling.delete(id);
        }
        
        return {
          transfers: newTransfers,
          pendingPollingIds: newPolling,
        };
      });
    },
    
    // Start polling for a transfer's status
    startPolling: (id) => {
      const { pendingPollingIds } = get();
      
      if (pendingPollingIds.has(id)) return;
      
      set((state) => ({
        pendingPollingIds: new Set(state.pendingPollingIds).add(id),
      }));
      
      // Start polling loop
      const poll = async () => {
        const POLL_INTERVAL = 3000; // 3 seconds
        
        while (get().pendingPollingIds.has(id)) {
          try {
            const transfer = await getTransfer(id);
            
            set((state) => ({
              transfers: new Map(state.transfers).set(id, transfer),
            }));
            
            if (isTerminalStatus(transfer.blockchain_status)) {
              get().stopPolling(id);
              break;
            }
          } catch {
            // Continue polling on error
          }
          
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
        }
      };
      
      poll();
    },
    
    // Stop polling for a transfer
    stopPolling: (id) => {
      set((state) => {
        const newPolling = new Set(state.pendingPollingIds);
        newPolling.delete(id);
        return { pendingPollingIds: newPolling };
      });
    },
    
    // Clear error state
    clearError: () => set({ error: null }),
  }))
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get transfers as a sorted array (newest first)
 */
export function useTransfersList(): TransferRequest[] {
  return useTransferStore((state) => 
    Array.from(state.transfers.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  );
}

/**
 * Get a single transfer by ID
 */
export function useTransfer(id: string): TransferRequest | undefined {
  return useTransferStore((state) => state.transfers.get(id));
}

/**
 * Check if a specific transfer is being polled
 */
export function useIsPolling(id: string): boolean {
  return useTransferStore((state) => state.pendingPollingIds.has(id));
}
