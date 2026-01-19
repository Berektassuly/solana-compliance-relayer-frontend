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
  signature: string;
}

// ============================================================================
// Enums
// ============================================================================

/**
 * Blockchain submission status for a transfer.
 * Flow: pending → pending_submission → processing → submitted → confirmed | failed
 */
export type BlockchainStatus =
  | 'pending'
  | 'pending_submission'
  | 'processing'
  | 'submitted'
  | 'confirmed'
  | 'failed';

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
 */
export const TERMINAL_STATUSES: BlockchainStatus[] = ['confirmed', 'failed'];

/**
 * Check if a status is terminal (no more updates expected).
 */
export function isTerminalStatus(status: BlockchainStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
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
