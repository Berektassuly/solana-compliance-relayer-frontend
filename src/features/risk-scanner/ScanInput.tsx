'use client';

import { useState, useCallback } from 'react';
import { Search, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
    setValidationError(null);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm text-muted" htmlFor="risk-scan-address">Wallet Address</label>
        <div className="relative">
          <Input
            id="risk-scan-address"
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

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={!address.trim()}>
        <Search className="mr-2 h-4 w-4" />
        Scan Wallet
      </Button>
    </form>
  );
}
