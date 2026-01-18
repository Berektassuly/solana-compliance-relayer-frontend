import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format wallet address for display (e.g., "Ax39...9dK")
 */
export function formatAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number, token: string): string {
  return `${amount.toLocaleString()} ${token}`;
}

/**
 * Generate a random transaction ID
 */
export function generateId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
