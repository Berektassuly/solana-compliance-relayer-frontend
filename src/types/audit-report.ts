import type { BlockchainStatus, ComplianceStatus } from './transfer-request';

export type AuditAssetType = 'native_sol' | 'spl_token' | 'token2022_confidential';

export type AuditAmount =
  | {
      visibility: 'public';
      amount: number;
    }
  | {
      visibility: 'confidential';
      marker: string;
    };

export type AuditFinalDecision =
  | 'approved_for_settlement'
  | 'rejected_before_settlement'
  | 'settled'
  | 'failed_or_expired';

export interface InternalBlocklistHit {
  address: string;
  role: string;
  reason: string;
}

export type LastErrorType =
  | 'none'
  | 'jito_state_unknown'
  | 'jito_bundle_failed'
  | 'transaction_failed'
  | 'network_error'
  | 'validation_error';

export interface PrivateSubmissionAuditMetadata {
  original_tx_signature?: string | null;
  last_error_type: LastErrorType;
  blockhash_used?: string | null;
  retry_count: number;
  next_retry_at?: string | null;
}

export interface TransferAuditReport {
  transfer_id: string;
  sender_address: string;
  recipient_address: string;
  asset_type: AuditAssetType;
  token_mint?: string | null;
  amount: AuditAmount;
  nonce?: string | null;
  compliance_status: ComplianceStatus;
  blockchain_status: BlockchainStatus;
  risk_decision_summary: string;
  rejection_reason?: string | null;
  internal_blocklist_hits: InternalBlocklistHit[];
  range_risk_score?: number | null;
  range_risk_level?: string | null;
  helius_asset_screening_status?: string | null;
  blockchain_signature?: string | null;
  original_tx_signature?: string | null;
  private_submission_metadata?: PrivateSubmissionAuditMetadata | null;
  created_at: string;
  updated_at: string;
  final_decision: AuditFinalDecision;
}
