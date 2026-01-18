import type { TransferRequest, TransferResponse } from '@/types/api';
import type { Transaction } from '@/types/transaction';
import { generateId } from '@/lib/utils';

/**
 * Submit a transfer request (mocked)
 */
export async function submitTransfer(
  request: TransferRequest
): Promise<{ response: TransferResponse; transaction: Transaction }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Generate transaction
  const transactionId = generateId();
  
  const transaction: Transaction = {
    id: transactionId,
    type: request.mode,
    recipient: request.recipient,
    amount: request.amount,
    token: request.asset.toUpperCase(),
    status: 'pending',
    timestamp: new Date(),
  };

  const response: TransferResponse = {
    transactionId,
    status: 'submitted',
    message: request.mode === 'confidential' 
      ? 'Transfer encrypted and submitted' 
      : 'Transfer submitted for compliance verification',
  };

  // Simulate status update after delay
  setTimeout(() => {
    // In a real app, this would be handled by WebSocket or polling
    console.log(`Transaction ${transactionId} confirmed`);
  }, 3000);

  return { response, transaction };
}

/**
 * Validate a recipient address (mocked)
 */
export async function validateRecipient(address: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  // Basic validation: check if it looks like a Solana address
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}
