import type { Asset } from '@/types/transaction';

// API Configuration
// Configure this in .env.local as NEXT_PUBLIC_API_URL. When omitted, requests
// are same-origin so the UI never embeds an environment-specific backend host.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

// Theme Colors (also in tailwind.config.ts)
export const COLORS = {
  background: '#fdf8f8',
  panel: '#ffffff',
  border: '#c8c5ca',
  primary: '#1c1b1b',
  primaryDark: '#09090b',
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
    hint: 'Disabled in the public demo while Solana ZK support is caveated',
    description: 'Token-2022 confidential transfer capability, not a live checkout path',
  },
} as const;
