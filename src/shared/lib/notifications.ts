/**
 * Notification types and utilities for error handling UX
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

/**
 * Backend error types mapped to UI notifications
 */
export function mapBackendError(error: { type: string; message: string }): Omit<Notification, 'id'> {
  switch (error.type) {
    case 'validation_error':
      return {
        type: 'warning',
        title: 'Validation Error',
        message: error.message,
      };
    
    case 'authorization_error':
      return {
        type: 'error',
        title: 'Signature Verification Failed',
        message: 'Please sign the transaction again with your wallet.',
      };
    
    case 'insufficient_funds':
      return {
        type: 'warning',
        title: 'Insufficient Funds',
        message: error.message,
      };
    
    case 'rate_limited':
      return {
        type: 'error',
        title: 'Too Many Requests',
        message: 'Please wait a moment before trying again.',
        duration: 5000,
      };
    
    case 'blockchain_error':
    case 'timeout':
      return {
        type: 'error',
        title: 'Network Error',
        message: 'Transaction submission failed. Please try again.',
      };
    
    case 'database_error':
    case 'external_service_error':
      return {
        type: 'error',
        title: 'Service Unavailable',
        message: 'We\'re experiencing technical difficulties. Please try again later.',
      };
    
    case 'not_found':
      return {
        type: 'warning',
        title: 'Not Found',
        message: error.message,
      };
    
    default:
      return {
        type: 'error',
        title: 'Error',
        message: error.message || 'An unexpected error occurred.',
      };
  }
}

/**
 * Create success notification for transfer
 */
export function createTransferSuccessNotification(
  transferType: 'public' | 'confidential'
): Omit<Notification, 'id'> {
  return {
    type: 'success',
    title: 'Transfer Submitted',
    message: transferType === 'confidential'
      ? 'Your confidential transfer has been queued for processing.'
      : 'Your transfer has been submitted to the network.',
    duration: 4000,
  };
}

/**
 * Generate unique notification ID
 */
export function generateNotificationId(): string {
  return `notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
