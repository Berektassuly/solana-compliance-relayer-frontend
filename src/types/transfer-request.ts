/**
 * TypeScript interfaces matching the Solana Compliance Relayer backend.
 * Source of Truth: Backend Rust types in src/domain/types.rs
 */

// ============================================================================
// WASM Module Output Types
// ============================================================================

/**
 * Result from WASM keypair generation.
 */
export interface KeypairResult {
  public_key: string;
  secret_key: string;
}

/**
 * Result from WASM transfer generation.
 */
export interface TransferResult {
  request_json: string;
  from_address: string;
  to_address: string;
  /** UUID nonce used for this request */
  nonce: string;
  signature: string;
}

// ============================================================================
// Enums
// ============================================================================

/**
 * Blockchain submission status for a transfer.
 * 
 * Flow (v0.3.0 - Enterprise Reliability):
 *   received → pending_submission → processing → submitted → confirmed
 *                                                         ↘ expired (blockhash timeout)
 *                                              ↘ failed (max retries)
 * 
 * Note: 'pending' is deprecated/legacy - new requests use 'received'.
 */
export type BlockchainStatus =
  | 'received'           // NEW: Initial state (persisted before compliance check)
  | 'pending'            // DEPRECATED: Legacy alias for 'received'
  | 'pending_submission' // Compliance approved, queued for worker
  | 'processing'         // Worker claimed task, submission in progress
  | 'submitted'          // On-chain, awaiting confirmation
  | 'confirmed'          // TERMINAL: Finalized on blockchain
  | 'failed'             // TERMINAL: Max retries exceeded (may be retryable)
  | 'expired';           // TERMINAL: Blockhash expired (user must re-sign)

/**
 * Compliance check status for a transfer.
 */
export type ComplianceStatus = 'pending' | 'approved' | 'rejected';

// ============================================================================
// Transfer Details (Tagged Union)
// ============================================================================

/**
 * Standard public transfer with visible amount in lamports.
 */
export interface PublicTransfer {
  type: 'public';
  /** Amount in lamports (1 SOL = 1,000,000,000 lamports) */
  amount: number;
}

/**
 * Confidential transfer with zero-knowledge proofs (Token-2022).
 * Amount is encrypted and not visible.
 */
export interface ConfidentialTransfer {
  type: 'confidential';
  new_decryptable_available_balance: string;
  equality_proof: string;
  ciphertext_validity_proof: string;
  range_proof: string;
}

/**
 * Tagged union for transfer type.
 * Check `type` field to determine if public or confidential.
 */
export type TransferDetails = PublicTransfer | ConfidentialTransfer;

// ============================================================================
// Main Entity
// ============================================================================

/**
 * A transfer request as returned by the API.
 * 
 * v2 API: Now includes nonce field for replay protection
 */
export interface TransferRequest {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Sender wallet address (Base58 Solana address) */
  from_address: string;
  /** Recipient wallet address (Base58 Solana address) */
  to_address: string;
  /** Transfer details - public or confidential */
  transfer_details: TransferDetails;
  /** SPL Token mint address, null for native SOL */
  token_mint: string | null;
  /** Compliance check status */
  compliance_status: ComplianceStatus;
  /** Blockchain submission status */
  blockchain_status: BlockchainStatus;
  /** Solana transaction signature (if submitted) */
  blockchain_signature: string | null;
  /** Number of retry attempts (0-10) */
  blockchain_retry_count: number;
  /** Last error message from blockchain submission */
  blockchain_last_error: string | null;
  /** Next scheduled retry time (ISO 8601) */
  blockchain_next_retry_at: string | null;
  /** UUID nonce used for replay protection (v2 API) */
  nonce: string | null;
  /** Creation timestamp (ISO 8601) */
  created_at: string;
  /** Last update timestamp (ISO 8601) */
  updated_at: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Paginated response wrapper from GET /transfer-requests.
 */
export interface PaginatedResponse<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * Error response from the API.
 */
export interface ApiErrorResponse {
  error: {
    type: string;
    message: string;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Terminal states where polling should stop.
 * v0.3.0: Added 'expired' as a terminal state.
 */
export const TERMINAL_STATUSES: BlockchainStatus[] = ['confirmed', 'failed', 'expired'];

/**
 * Check if a status is terminal (no more updates expected).
 */
export function isTerminalStatus(status: BlockchainStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Check if a transfer can be retried via the API.
 * Note: 'expired' transfers CANNOT be retried - user must re-sign.
 */
export function canRetryTransfer(status: BlockchainStatus): boolean {
  return status === 'pending_submission' || status === 'failed';
}

/**
 * Check if a transfer requires user re-signing (expired blockhash).
 */
export function requiresResign(status: BlockchainStatus): boolean {
  return status === 'expired';
}

/**
 * Check if a transfer is confidential.
 */
export function isConfidential(request: TransferRequest): boolean {
  return request.transfer_details.type === 'confidential';
}

/**
 * Get the amount in lamports for public transfers, or null for confidential.
 */
export function getAmountLamports(request: TransferRequest): number | null {
  if (request.transfer_details.type === 'public') {
    return request.transfer_details.amount;
  }
  return null;
}
