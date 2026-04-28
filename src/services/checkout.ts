import { API_BASE_URL } from '@/lib/constants';
import type {
  CheckoutSession,
  CheckoutTransferSubmissionResponse,
  CreateCheckoutSessionRequest,
} from '@/types/checkout';
import type { ApiErrorResponse, TransferRequest } from '@/types/transfer-request';

export interface SubmitTransferRequestBody {
  from_address: string;
  to_address: string;
  transfer_details: {
    type: 'public';
    amount: number;
  };
  token_mint?: string | null;
  signature: string;
  nonce: string;
}

async function readApiError(response: Response, fallback: string): Promise<Error> {
  const error: ApiErrorResponse = await response.json().catch(() => ({
    error: { type: 'unknown', message: fallback },
  }));
  return new Error(error.error.message || fallback);
}

export async function createCheckoutSession(
  request: CreateCheckoutSessionRequest
): Promise<CheckoutSession> {
  const response = await fetch(`${API_BASE_URL}/checkout/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw await readApiError(response, 'Checkout session could not be created');
  }

  return response.json();
}

export async function fetchCheckoutSession(id: string): Promise<CheckoutSession> {
  const response = await fetch(
    `${API_BASE_URL}/checkout/sessions/${encodeURIComponent(id)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw await readApiError(response, 'Checkout session unavailable');
  }

  return response.json();
}

export async function submitCheckoutTransfer(
  sessionId: string,
  request: SubmitTransferRequestBody
): Promise<CheckoutTransferSubmissionResponse> {
  const response = await fetch(
    `${API_BASE_URL}/checkout/sessions/${encodeURIComponent(sessionId)}/submit-transfer`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': request.nonce,
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    throw await readApiError(response, 'Signed transfer could not be submitted');
  }

  return response.json();
}

export async function fetchLinkedTransfer(id: string): Promise<TransferRequest> {
  const response = await fetch(
    `${API_BASE_URL}/transfer-requests/${encodeURIComponent(id)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw await readApiError(response, 'Linked transfer request unavailable');
  }

  return response.json();
}
