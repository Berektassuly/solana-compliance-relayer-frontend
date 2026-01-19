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
 * Convert lamports to SOL for display.
 * 1 SOL = 1,000,000,000 lamports (10^9)
 */
export function lamportsToSol(lamports: number): string {
  const sol = lamports / 1_000_000_000;
  // Use up to 4 decimal places, remove trailing zeros
  return sol.toFixed(4).replace(/\.?0+$/, '');
}

/**
 * Generate a random transaction ID
 */
export function generateId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
