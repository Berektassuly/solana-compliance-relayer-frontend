import type { TransferAuditReport } from './audit-report';
import type { TransferRequest } from './transfer-request';

export type CheckoutSessionStatus =
  | 'open'
  | 'transfer_submitted'
  | 'settled'
  | 'rejected'
  | 'expired'
  | 'failed';

export type CheckoutUseCase =
  | 'virtual_card_funding'
  | 'merchant_checkout'
  | 'remittance';

export interface CreateCheckoutSessionRequest {
  merchant_id: string;
  merchant_reference: string;
  destination_wallet: string;
  token_mint?: string | null;
  amount: number;
  customer_wallet?: string | null;
  expires_at?: string | null;
  merchant_metadata?: Record<string, unknown> | null;
}

export interface CheckoutSession {
  id: string;
  merchant_id: string;
  merchant_reference: string;
  destination_wallet: string;
  token_mint?: string | null;
  amount: number;
  customer_wallet?: string | null;
  status: CheckoutSessionStatus;
  expires_at: string;
  merchant_metadata?: Record<string, unknown> | null;
  transfer_request_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CheckoutTransferSubmissionResponse {
  session: CheckoutSession;
  transfer_request: TransferRequest;
}

export interface CheckoutFlowState {
  session: CheckoutSession | null;
  transfer: TransferRequest | null;
  audit: TransferAuditReport | null;
}
