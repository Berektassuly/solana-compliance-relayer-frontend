'use client';

import { useState, useCallback } from 'react';
import { ShieldX, Copy, Check, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { BlockedResponse } from '@/types/risk-check';

interface BlockedResultProps {
  result: BlockedResponse;
  onReset: () => void;
}

export function BlockedResult({ result, onReset }: BlockedResultProps) {
  const [copied, setCopied] = useState(false);

  const truncatedAddress = `${result.address.slice(0, 12)}...${result.address.slice(-8)}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  }, [result.address]);

  return (
    <div className="space-y-4">
      {/* Blocked Header */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="p-2 rounded-lg bg-red-500/20">
          <ShieldX className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-400">BLOCKED</h3>
          <p className="text-sm text-muted">
            This wallet is flagged in our internal blocklist
          </p>
        </div>
      </div>

      {/* Details Card */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Address */}
        <div className="p-4 border-b border-border">
          <div className="text-xs text-muted uppercase tracking-wide mb-1">
            ADDRESS
          </div>
          <div className="flex items-center justify-between">
            <code className="text-sm text-foreground font-mono">
              {truncatedAddress}
            </code>
            <button
              onClick={handleCopy}
              className="p-1.5 text-muted hover:text-foreground transition-colors"
              title="Copy address"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Reason */}
        <div className="p-4 bg-panel">
          <div className="text-xs text-muted uppercase tracking-wide mb-1">
            REASON
          </div>
          <p className="text-sm text-foreground">{result.reason}</p>
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <span className="text-amber-400 text-lg">⚠️</span>
        <p className="text-sm text-amber-200">
          Transactions to/from this address will be rejected by the relayer.
        </p>
      </div>

      {/* Action */}
      <Button variant="secondary" onClick={onReset} className="w-full">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Scan Another Wallet
      </Button>
    </div>
  );
}
