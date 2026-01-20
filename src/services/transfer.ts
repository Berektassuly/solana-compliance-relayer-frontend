import { generateKeypair, generatePublicTransfer } from '@/lib/wasm';
import { API_BASE_URL } from '@/lib/constants';
import type { TransferRequest as ApiTransferRequest } from '@/types/api';

/**
 * Submit a transfer request to the backend via WASM signing.
 * 
 * For public transfers: Generates keypair, signs transaction, submits to backend.
 * For confidential transfers: Currently not implemented (requires ZK proofs).
 */
export async function submitTransfer(
  request: ApiTransferRequest
): Promise<{ transaction: { id: string; status: string } }> {
  // 1. Generate a new ephemeral keypair (in production, use user's wallet)
  const keypair = await generateKeypair();

  // 2. Convert amount to lamports based on asset
  let amountLamports: number;
  let tokenMint: string | undefined;

  switch (request.asset.toLowerCase()) {
    case 'sol':
      // SOL: amount is in SOL, convert to lamports (1 SOL = 1e9 lamports)
      amountLamports = Math.floor(request.amount * 1_000_000_000);
      tokenMint = undefined;
      break;
    case 'usdc':
      // USDC: 6 decimals, amount is in USDC
      amountLamports = Math.floor(request.amount * 1_000_000);
      // Devnet USDC mint
      tokenMint = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr';
      break;
    case 'usdt':
      // USDT: 6 decimals
      amountLamports = Math.floor(request.amount * 1_000_000);
      // Devnet USDT mint (placeholder)
      tokenMint = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
      break;
    default:
      throw new Error(`Unsupported asset: ${request.asset}`);
  }

  // 3. Handle confidential mode (not fully implemented yet)
  if (request.mode === 'confidential') {
    throw new Error('Confidential transfers are not yet supported in the UI. Use the API directly.');
  }

  // 4. Generate the signed transfer request using WASM
  const transferResult = await generatePublicTransfer(
    keypair.secret_key,
    request.recipient,
    amountLamports,
    tokenMint
  );

  // 5. Submit to backend API
  const response = await fetch(`${API_BASE_URL}/transfer-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: transferResult.request_json,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const backendResponse = await response.json();
  
  return {
    transaction: {
      id: backendResponse.id,
      status: backendResponse.blockchain_status,
    },
  };
}

/**
 * Validate a recipient address
 */
export async function validateRecipient(address: string): Promise<boolean> {
  // Basic validation: check if it looks like a Solana address
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}
