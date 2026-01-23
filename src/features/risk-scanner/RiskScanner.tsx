'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

import { checkWalletRisk } from '@/services/risk-check';
import type { RiskCheckResponse } from '@/types/risk-check';
import { isBlockedResponse } from '@/types/risk-check';

import { ScanInput } from './ScanInput';
import { ScanningProgress } from './ScanningProgress';
import { BlockedResult } from './BlockedResult';
import { AnalyzedResult } from './AnalyzedResult';

type ScanState = 'idle' | 'scanning' | 'result';

export function RiskScanner() {
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<RiskCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skipAnimation, setSkipAnimation] = useState(false);

  const handleScan = useCallback(async (address: string) => {
    setScanState('scanning');
    setError(null);
    setSkipAnimation(false);

    try {
      const response = await checkWalletRisk(address);
      
      // Check if response is from cache - skip animation
      if (!isBlockedResponse(response) && response.from_cache) {
        setSkipAnimation(true);
        setResult(response);
        setScanState('result');
      } else {
        setResult(response);
        // Animation will call onComplete when done
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Risk check failed');
      setScanState('idle');
    }
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setScanState('result');
  }, []);

  const handleReset = useCallback(() => {
    setScanState('idle');
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-panel p-6 space-y-6 min-h-[520px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            WALLET RISK SCANNER
          </h2>
          <p className="text-sm text-muted">
            Pre-flight compliance check powered by Range Protocol
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {scanState === 'idle' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ScanInput onScan={handleScan} error={error} />
          </motion.div>
        )}

        {scanState === 'scanning' && result && !skipAnimation && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ScanningProgress
              isBlocked={isBlockedResponse(result)}
              onComplete={handleAnimationComplete}
            />
          </motion.div>
        )}

        {scanState === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {isBlockedResponse(result) ? (
              <BlockedResult result={result} onReset={handleReset} />
            ) : (
              <AnalyzedResult result={result} onReset={handleReset} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
