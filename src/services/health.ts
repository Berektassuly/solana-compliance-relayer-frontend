import { API_BASE_URL } from '@/lib/constants';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthResponse {
  status: HealthStatus;
  database: HealthStatus;
  blockchain: HealthStatus;
  timestamp: string;
  version: string;
}

interface ApiErrorResponse {
  error?: {
    message?: string;
  };
  message?: string;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({
      message: 'Health check failed',
    }));
    throw new Error(error.error?.message ?? error.message ?? 'Health check failed');
  }

  return response.json();
}
