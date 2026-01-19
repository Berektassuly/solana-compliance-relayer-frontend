/**
 * Transfer Server Actions - React 19 Server Actions for transfer operations
 * 
 * These actions run on the server and can be used with useActionState
 */
'use server';

import { 
  submitTransfer as apiSubmitTransfer,
  getTransfer,
  listTransfers,
  retryTransfer as apiRetryTransfer,
  type TransferRequest,
  type SubmitTransferRequest,
  type PaginatedResponse,
} from '@/shared/api';

// ============================================================================
// Types
// ============================================================================

export type TransferActionState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; transfer: TransferRequest }
  | { status: 'error'; error: { type: string; message: string } };

export type ListActionState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PaginatedResponse<TransferRequest> }
  | { status: 'error'; error: { type: string; message: string } };

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Submit a new transfer request
 * Use with useActionState for form state management
 */
export async function submitTransferAction(
  _prevState: TransferActionState,
  formData: FormData
): Promise<TransferActionState> {
  const fromAddress = formData.get('from_address') as string;
  const toAddress = formData.get('to_address') as string;
  const amount = formData.get('amount') as string;
  const tokenMint = formData.get('token_mint') as string | null;
  const signature = formData.get('signature') as string;
  const transferType = formData.get('transfer_type') as 'public' | 'confidential';
  
  // Validate required fields
  if (!fromAddress || !toAddress || !signature) {
    return {
      status: 'error',
      error: {
        type: 'validation_error',
        message: 'Missing required fields',
      },
    };
  }
  
  try {
    const request: SubmitTransferRequest = {
      from_address: fromAddress,
      to_address: toAddress,
      transfer_details: 
        transferType === 'confidential'
          ? {
              type: 'confidential',
              new_decryptable_available_balance: formData.get('balance') as string,
              equality_proof: formData.get('equality_proof') as string,
              ciphertext_validity_proof: formData.get('ciphertext_validity_proof') as string,
              range_proof: formData.get('range_proof') as string,
            }
          : {
              type: 'public',
              amount: Number(amount),
            },
      token_mint: tokenMint || undefined,
      signature,
    };
    
    const transfer = await apiSubmitTransfer(request);
    
    return {
      status: 'success',
      transfer,
    };
  } catch (err) {
    const error = err instanceof Error
      ? { type: 'api_error', message: err.message }
      : { type: 'unknown', message: 'An unexpected error occurred' };
    
    return {
      status: 'error',
      error,
    };
  }
}

/**
 * Get a transfer by ID
 */
export async function getTransferAction(
  id: string
): Promise<TransferRequest | null> {
  try {
    return await getTransfer(id);
  } catch {
    return null;
  }
}

/**
 * List transfers with optional cursor
 */
export async function listTransfersAction(
  cursor?: string
): Promise<PaginatedResponse<TransferRequest>> {
  return listTransfers(20, cursor);
}

/**
 * Retry a failed transfer
 */
export async function retryTransferAction(
  _prevState: TransferActionState,
  formData: FormData
): Promise<TransferActionState> {
  const id = formData.get('id') as string;
  
  if (!id) {
    return {
      status: 'error',
      error: {
        type: 'validation_error',
        message: 'Transfer ID is required',
      },
    };
  }
  
  try {
    const transfer = await apiRetryTransfer(id);
    return {
      status: 'success',
      transfer,
    };
  } catch (err) {
    const error = err instanceof Error
      ? { type: 'api_error', message: err.message }
      : { type: 'unknown', message: 'Failed to retry transfer' };
    
    return {
      status: 'error',
      error,
    };
  }
}
