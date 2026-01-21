/**
 * API service for blocklist management (admin operations).
 */

import { API_BASE_URL } from '@/lib/constants';

// ============================================================================
// Types
// ============================================================================

export interface BlocklistEntry {
  address: string;
  reason: string;
}

export interface BlocklistResponse {
  success: boolean;
  message: string;
}

export interface ListBlocklistResponse {
  count: number;
  entries: BlocklistEntry[];
}

interface ApiErrorResponse {
  error: {
    type: string;
    message: string;
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all blocklisted addresses.
 */
export async function fetchBlocklist(): Promise<ListBlocklistResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/blocklist`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({
      error: { type: 'unknown', message: 'Failed to fetch blocklist' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Add an address to the blocklist.
 */
export async function addToBlocklist(
  address: string,
  reason: string
): Promise<BlocklistResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/blocklist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address, reason }),
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({
      error: { type: 'unknown', message: 'Failed to add to blocklist' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Remove an address from the blocklist.
 */
export async function removeFromBlocklist(
  address: string
): Promise<BlocklistResponse> {
  const response = await fetch(
    `${API_BASE_URL}/admin/blocklist/${encodeURIComponent(address)}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({
      error: { type: 'unknown', message: 'Failed to remove from blocklist' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}
