import { NextRequest, NextResponse } from 'next/server';

function backendUrl(request: NextRequest, path: string): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
  if (configured) return `${configured}${path}`;
  return new URL(path, request.url).toString();
}

function adminHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (process.env.ADMIN_API_KEY) {
    headers.Authorization = `Bearer ${process.env.ADMIN_API_KEY}`;
  }
  return headers;
}

export async function proxyAdminRequest(
  request: NextRequest,
  path: string,
  init: RequestInit
) {
  try {
    const response = await fetch(backendUrl(request, path), {
      ...init,
      headers: {
        ...adminHeaders(),
        ...(init.headers ?? {}),
      },
      cache: 'no-store',
    });
    const contentType = response.headers.get('content-type') ?? '';
    const text = await response.text();

    if (contentType.includes('application/json')) {
      return new NextResponse(text, {
        status: response.status,
        headers: { 'Content-Type': contentType },
      });
    }

    return NextResponse.json(
      {
        error: {
          type: 'upstream_error',
          message: response.ok
            ? 'Admin API returned a non-JSON response'
            : `Admin API returned HTTP ${response.status}`,
        },
      },
      { status: response.ok ? 502 : response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          type: 'network_error',
          message: error instanceof Error ? error.message : 'Admin API unavailable',
        },
      },
      { status: 502 }
    );
  }
}
