import { NextRequest } from 'next/server';
import { proxyAdminRequest } from './proxy';

export async function GET(request: NextRequest) {
  return proxyAdminRequest(request, '/admin/blocklist', {
    method: 'GET',
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyAdminRequest(request, '/admin/blocklist', {
    method: 'POST',
    body,
  });
}
