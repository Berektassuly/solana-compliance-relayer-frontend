import type { Asset } from '@/types/transaction';

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Theme Colors (also in tailwind.config.ts)
export const COLORS = {
  background: '#0b0f14',
  panel: '#111722',
  border: '#1f2a3a',
  primary: '#7c3aed',
  primaryDark: '#5b21b6',
} as const;

// Available Assets
export const ASSETS: Asset[] = [
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    description: 'High Volume (Safe)',
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    description: 'Native Token',
  },
  {
    id: 'usdt',
    symbol: 'USDT',
    name: 'Tether',
    description: 'Stablecoin',
  },
];

// Transfer Mode Labels
export const MODE_LABELS = {
  public: {
    hint: 'Range Protocol: Clean',
    description: 'Standard transfer with compliance verification',
  },
  confidential: {
    hint: 'Will be encrypted via ElGamal',
    description: 'Privacy-preserving transfer with zero-knowledge proofs',
  },
} as const;
