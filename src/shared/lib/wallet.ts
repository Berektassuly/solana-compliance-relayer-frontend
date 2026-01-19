/**
 * Wallet utilities for Solana wallet integration and message signing
 */
import bs58 from 'bs58';

/**
 * Create the signing message for a transfer request
 * Format: "{from_address}:{to_address}:{amount|confidential}:{token_mint|SOL}"
 * 
 * This must match the backend's SubmitTransferRequest.create_signing_message()
 */
export function createSigningMessage(
  fromAddress: string,
  toAddress: string,
  amount: number | 'confidential',
  tokenMint?: string
): string {
  const amountPart = typeof amount === 'number' ? amount.toString() : 'confidential';
  const mintPart = tokenMint || 'SOL';
  return `${fromAddress}:${toAddress}:${amountPart}:${mintPart}`;
}

/**
 * Sign a message using the wallet adapter
 * Returns base58-encoded signature
 */
export async function signMessage(
  message: string,
  signMessageFn: (message: Uint8Array) => Promise<Uint8Array>
): Promise<string> {
  const messageBytes = new TextEncoder().encode(message);
  const signature = await signMessageFn(messageBytes);
  return bs58.encode(signature);
}

/**
 * Validate a Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
}

/**
 * Truncate an address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
