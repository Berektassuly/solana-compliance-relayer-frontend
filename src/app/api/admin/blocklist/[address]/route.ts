import { NextRequest } from 'next/server';
import { proxyAdminRequest } from '../proxy';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  return proxyAdminRequest(
    request,
    `/admin/blocklist/${encodeURIComponent(address)}`,
    {
      method: 'DELETE',
    }
  );
}
