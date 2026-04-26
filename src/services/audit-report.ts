import { API_BASE_URL } from '@/lib/constants';
import type { TransferAuditReport } from '@/types/audit-report';
import type { ApiErrorResponse } from '@/types/transfer-request';

export async function fetchTransferAuditReport(
  id: string
): Promise<TransferAuditReport> {
  const response = await fetch(
    `${API_BASE_URL}/transfer-requests/${encodeURIComponent(id)}/audit-report`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({
      error: { type: 'unknown', message: 'Audit report unavailable' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}
