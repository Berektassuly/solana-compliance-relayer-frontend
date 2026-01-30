/**
 * API service for transfer requests.
 * Connects to the Railway backend at the configured API_BASE_URL.
 */

import { API_BASE_URL } from '@/lib/constants';
import type {
  TransferRequest,
  PaginatedResponse,
  ApiErrorResponse,
} from '@/types/transfer-request';

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch a paginated list of transfer requests.
 * Sorted by created_at DESC (newest first).
 *
 * @param limit - Maximum number of items (1-100, default: 20)
 * @param cursor - Cursor for pagination (ID to start after)
 */
export async function fetchTransferRequests(
  limit: number = 20,
  cursor?: string
): Promise<PaginatedResponse<TransferRequest>> {
  const params = new URLSearchParams();
  params.set('limit', String(Math.min(Math.max(limit, 1), 100)));
  if (cursor) {
    params.set('cursor', cursor);
  }

  const response = await fetch(
    `${API_BASE_URL}/transfer-requests?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({
      error: { type: 'unknown', message: 'Request failed' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Fetch a single transfer request by ID.
 *
 * @param id - Transfer request UUID
 */
export async function fetchTransferRequest(
  id: string
): Promise<TransferRequest> {
  const response = await fetch(`${API_BASE_URL}/transfer-requests/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({
      error: { type: 'unknown', message: 'Request failed' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Retry blockchain submission for a failed transfer request.
 * Call ONLY when the user manually clicks "Retry". Only show the Retry button
 * when blockchain_status = 'failed'. Do not call for 'pending_submission'
 * (Queued) — that causes a race with the backend worker and validation errors.
 *
 * @param id - Transfer request UUID
 */
export async function retryTransferRequest(
  id: string
): Promise<TransferRequest> {
  const response = await fetch(
    `${API_BASE_URL}/transfer-requests/${id}/retry`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({
      error: { type: 'unknown', message: 'Retry failed' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}
