'use client';

import { useState, useCallback } from 'react';
import {
  ShieldCheck,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  Zap,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { AnalyzedResponse } from '@/types/risk-check';
import { getRiskColor } from '@/types/risk-check';

import { RiskGauge } from './RiskGauge';

interface AnalyzedResultProps {
  result: AnalyzedResponse;
  onReset: () => void;
}

export function AnalyzedResult({ result, onReset }: AnalyzedResultProps) {
  const [copied, setCopied] = useState(false);

  const truncatedAddress = `${result.address.slice(0, 12)}...${result.address.slice(-8)}`;
  const riskColor = getRiskColor(result.risk_score);
  const isHighRisk = result.risk_score >= 6;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  }, [result.address]);

  const explorerUrl = `https://explorer.solana.com/address/${result.address}`;

  // Format timestamp
  const checkedAt = new Date(result.checked_at).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <div className="space-y-4">
      {/* Success Header */}
      <div
        className={`flex items-center justify-between p-4 rounded-lg border ${
          isHighRisk
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-green-500/10 border-green-500/20'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isHighRisk ? 'bg-amber-500/20' : 'bg-green-500/20'
            }`}
          >
            {isHighRisk ? (
              <AlertTriangle className="h-6 w-6 text-amber-400" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-green-400" />
            )}
          </div>
          <div>
            <h3
              className={`text-lg font-semibold ${
                isHighRisk ? 'text-amber-400' : 'text-green-400'
              }`}
            >
              ANALYSIS COMPLETE
            </h3>
            <p className="text-sm text-muted">
              {isHighRisk
                ? 'Elevated risk detected - review recommended'
                : 'Wallet passed compliance checks'}
            </p>
          </div>
        </div>

        {/* Cache Badge */}
        {result.from_cache && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Zap className="h-3 w-3" />
            Cached
          </div>
        )}
      </div>

      {/* Address */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-panel border border-border">
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

      {/* Summary Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Risk Score */}
        <div className="p-4 rounded-lg border border-border bg-panel text-center">
          <div className="text-xs text-muted uppercase tracking-wide mb-2">
            RISK SCORE
          </div>
          <RiskGauge score={result.risk_score} />
        </div>

        {/* Risk Level */}
        <div className="p-4 rounded-lg border border-border bg-panel text-center">
          <div className="text-xs text-muted uppercase tracking-wide mb-2">
            RISK LEVEL
          </div>
          <div className="flex flex-col items-center gap-2 mt-3">
            <span
              className={`text-2xl ${
                riskColor === 'green'
                  ? 'text-green-400'
                  : riskColor === 'yellow'
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {riskColor === 'green' ? '🟢' : riskColor === 'yellow' ? '🟡' : '🔴'}
            </span>
            <span className="text-sm font-medium text-foreground">
              {result.risk_level}
            </span>
          </div>
        </div>

        {/* Sanctioned Assets */}
        <div className="p-4 rounded-lg border border-border bg-panel text-center">
          <div className="text-xs text-muted uppercase tracking-wide mb-2">
            SANCTIONED ASSETS
          </div>
          <div className="flex flex-col items-center gap-2 mt-3">
            {result.has_sanctioned_assets ? (
              <>
                <span className="text-2xl">🔴</span>
                <span className="text-sm font-medium text-red-400">Detected</span>
              </>
            ) : result.helius_assets_checked ? (
              <>
                <span className="text-2xl text-green-400">✓</span>
                <span className="text-sm font-medium text-foreground">None</span>
              </>
            ) : (
              <>
                <span className="text-2xl text-muted">—</span>
                <span className="text-xs text-muted-dark">Not Checked</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="px-4 py-2 bg-border/30 border-b border-border">
          <span className="text-xs text-muted uppercase tracking-wide">
            ANALYSIS DETAILS
          </span>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted leading-relaxed">
            &quot;{result.reasoning}&quot;
          </p>
        </div>
      </div>

      {/* Per-source Breakdown */}
      <div className="rounded-lg border border-border p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-400" />
          <span className="text-foreground">Internal Blocklist:</span>
          <span className="text-green-400">Clean</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Check className="h-4 w-4 text-green-400" />
          <span className="text-foreground">Range Protocol:</span>
          <span
            className={
              result.risk_score <= 3
                ? 'text-green-400'
                : result.risk_score <= 6
                ? 'text-amber-400'
                : 'text-red-400'
            }
          >
            Score {result.risk_score} ({result.risk_level})
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {result.helius_assets_checked ? (
            <>
              <Check className="h-4 w-4 text-green-400" />
              <span className="text-foreground">Helius DAS:</span>
              <span
                className={
                  result.has_sanctioned_assets ? 'text-red-400' : 'text-green-400'
                }
              >
                {result.has_sanctioned_assets
                  ? 'Sanctioned assets detected'
                  : 'No sanctioned assets'}
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-foreground">Helius DAS:</span>
              <span className="text-muted-dark">Unavailable (non-Helius RPC)</span>
            </>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-center text-xs text-muted">
        Checked at: {checkedAt}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onReset} className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Scan Another Wallet
        </Button>
        <Button
          variant="outline"
          asChild
          className="flex-1"
        >
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
            View on Explorer
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
