/**
 * Solana Compliance Relayer API Client
 * 
 * Service-oriented API client with proper error handling and type safety.
 * Directly maps to backend API endpoints.
 */

// ============================================================================
// Backend-aligned Domain Types
// ============================================================================

/**
 * Blockchain submission status for a transfer.
 * 
 * v0.3.0: Added 'received' (new initial state) and 'expired' (blockhash timeout).
 * 'pending' is now deprecated/legacy.
 */
export type BlockchainStatus = 
  | 'received'           // NEW: Initial state (persisted before compliance check)
  | 'pending'            // DEPRECATED: Legacy alias for 'received'
  | 'pending_submission' // Compliance approved, queued for worker
  | 'processing'         // Worker claimed task
  | 'submitted'          // On-chain, awaiting confirmation
  | 'confirmed'          // TERMINAL: Finalized
  | 'failed'             // TERMINAL: Max retries exceeded
  | 'expired';           // TERMINAL: Blockhash expired (user must re-sign)

export type ComplianceStatus = 'pending' | 'approved' | 'rejected';

export type TransferMode = 'public' | 'confidential';

/**
 * Transfer details - matches backend TransferType enum
 */
export type TransferDetails = 
  | { type: 'public'; amount: number }
  | { 
      type: 'confidential'; 
      new_decryptable_available_balance: string;
      equality_proof: string;
      ciphertext_validity_proof: string;
      range_proof: string;
    };

/**
 * TransferRequest - Core entity from backend
 * Matches: src/domain/types.rs::TransferRequest
 * 
 * v2 API: Now includes nonce field for replay protection
 */
export interface TransferRequest {
  id: string;
  from_address: string;
  to_address: string;
  transfer_details: TransferDetails;
  token_mint?: string | null;
  compliance_status: ComplianceStatus;
  blockchain_status: BlockchainStatus;
  blockchain_signature?: string | null;
  blockchain_retry_count: number;
  blockchain_last_error?: string | null;
  blockchain_next_retry_at?: string | null;
  /** UUID nonce used for this request (v2 API) */
  nonce?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * SubmitTransferRequest - API request body
 * Matches: src/domain/types.rs::SubmitTransferRequest
 * 
 * v2 API: Now requires nonce for replay protection and idempotency
 */
export interface SubmitTransferRequest {
  from_address: string;
  to_address: string;
  transfer_details: TransferDetails;
  token_mint?: string | null;
  /** UUID nonce for replay protection (required, 32-64 chars) */
  nonce: string;
  signature: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  next_cursor?: string;
  has_more: boolean;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: 'healthy' | 'degraded' | 'unhealthy';
  blockchain: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
}

/**
 * Backend error response
 */
export interface ErrorResponse {
  error: {
    type: string;
    message: string;
  };
}

/**
 * Rate limit error response
 */
export interface RateLimitResponse extends ErrorResponse {
  retry_after: number;
}

// ============================================================================
// API Client Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClientError extends Error {
  constructor(
    public readonly type: string,
    message: string,
    public readonly status: number,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// ============================================================================
// API Client Methods
// ============================================================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const errorBody = await response.json();
      
      if (response.status === 429) {
        const rateLimitError = errorBody as RateLimitResponse;
        throw new ApiClientError(
          rateLimitError.error.type,
          rateLimitError.error.message,
          response.status,
          rateLimitError.retry_after
        );
      }
      
      const error = errorBody as ErrorResponse;
      throw new ApiClientError(
        error.error.type,
        error.error.message,
        response.status
      );
    }
    
    throw new ApiClientError(
      'network_error',
      `HTTP ${response.status}: ${response.statusText}`,
      response.status
    );
  }
  
  return response.json();
}

/**
 * Submit a new transfer request
 * 
 * v2 API: Now includes Idempotency-Key header for replay protection.
 * The header value must match the nonce in the request body.
 */
export async function submitTransfer(
  request: SubmitTransferRequest
): Promise<TransferRequest> {
  const response = await fetch(`${API_BASE_URL}/transfer-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': request.nonce,
    },
    body: JSON.stringify(request),
  });
  
  return handleResponse<TransferRequest>(response);
}

/**
 * Get a single transfer request by ID
 */
export async function getTransfer(id: string): Promise<TransferRequest> {
  const response = await fetch(`${API_BASE_URL}/transfer-requests/${id}`);
  return handleResponse<TransferRequest>(response);
}

/**
 * List transfer requests with pagination
 */
export async function listTransfers(
  limit: number = 20,
  cursor?: string
): Promise<PaginatedResponse<TransferRequest>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set('cursor', cursor);
  }
  
  const response = await fetch(`${API_BASE_URL}/transfer-requests?${params}`);
  return handleResponse<PaginatedResponse<TransferRequest>>(response);
}

/**
 * Retry blockchain submission for a transfer
 */
export async function retryTransfer(id: string): Promise<TransferRequest> {
  const response = await fetch(`${API_BASE_URL}/transfer-requests/${id}/retry`, {
    method: 'POST',
  });
  return handleResponse<TransferRequest>(response);
}

/**
 * Get system health status
 */
export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return handleResponse<HealthResponse>(response);
}

// Export error class for type checking
export { ApiClientError };

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract public amount from transfer details
 */
export function getTransferAmount(details: TransferDetails): number | null {
  if (details.type === 'public') {
    return details.amount;
  }
  return null; // Confidential transfers don't expose amount
}

/**
 * Check if a transfer is in a terminal state.
 * v0.3.0: Added 'expired' as terminal state.
 */
export function isTerminalStatus(status: BlockchainStatus): boolean {
  return status === 'confirmed' || status === 'failed' || status === 'expired';
}

/**
 * Check if a transfer can be retried via the API.
 * NOTE: 'expired' transfers CANNOT be retried - user must re-sign.
 */
export function canRetry(transfer: TransferRequest): boolean {
  return (
    transfer.blockchain_status === 'pending_submission' ||
    transfer.blockchain_status === 'failed'
  );
}

/**
 * Check if a transfer requires user to re-sign (expired blockhash).
 * The original signature is permanently invalid and a new request must be created.
 */
export function requiresResign(transfer: TransferRequest): boolean {
  return transfer.blockchain_status === 'expired';
}

/**
 * Format transfer status for display
 */
export function formatStatus(status: BlockchainStatus): string {
  const labels: Record<BlockchainStatus, string> = {
    received: 'Validating',
    pending: 'Validating',  // Legacy
    pending_submission: 'Queued',
    processing: 'Processing',
    submitted: 'Submitted',
    confirmed: 'Confirmed',
    failed: 'Failed',
    expired: 'Expired',
  };
  return labels[status];
}
