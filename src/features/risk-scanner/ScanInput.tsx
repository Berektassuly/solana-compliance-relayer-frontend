'use client';

import { useState, useCallback } from 'react';
import { Search, Zap, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Demo addresses for quick testing
const DEMO_ADDRESSES = {
  blocked: '4oS78GPe66RqBduuAeiMFANf27FpmgXNwokZ3ocN4z1B',
  clean: 'HvwC9QSAzwEXkUkwqNNGhfNHoVqXJYfPvPZfQvJmHWcF',
} as const;

// Base58 validation regex (excludes 0, O, I, l)
const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

interface ScanInputProps {
  onScan: (address: string) => void;
  error?: string | null;
}

export function ScanInput({ onScan, error }: ScanInputProps) {
  const [address, setAddress] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isValid = BASE58_REGEX.test(address);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValid) {
        setValidationError('Invalid Solana address format');
        return;
      }
      setValidationError(null);
      onScan(address);
    },
    [address, isValid, onScan]
  );

  const handleDemoClick = useCallback(
    (demoAddress: string) => {
      setAddress(demoAddress);
      setValidationError(null);
      onScan(demoAddress);
    },
    [onScan]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    setValidationError(null);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Address Input */}
      <div className="space-y-2">
        <label className="text-sm text-muted">Wallet Address</label>
        <div className="relative">
          <Input
            placeholder="Enter Solana wallet address..."
            value={address}
            onChange={handleChange}
            error={validationError || undefined}
            className="pr-12"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-dark">
            <Search className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={!address.trim()}>
        <Search className="mr-2 h-4 w-4" />
        Scan Wallet
      </Button>

      {/* Demo Addresses */}
      <div className="pt-2">
        <p className="text-xs text-muted-dark mb-2 text-center">
          Quick scan with demo addresses:
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleDemoClick(DEMO_ADDRESSES.clean)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-border bg-panel hover:bg-panel-hover hover:border-border-light transition-all duration-200 text-muted hover:text-foreground"
          >
            <Zap className="h-3 w-3 text-green-400" />
            Clean Wallet
          </button>
          <button
            type="button"
            onClick={() => handleDemoClick(DEMO_ADDRESSES.blocked)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-border bg-panel hover:bg-panel-hover hover:border-border-light transition-all duration-200 text-muted hover:text-foreground"
          >
            <Zap className="h-3 w-3 text-red-400" />
            Blocked Wallet
          </button>
        </div>
      </div>
    </form>
  );
}
