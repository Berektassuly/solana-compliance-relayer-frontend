'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Activity, Shield, Zap, Loader2, Check, AlertCircle } from 'lucide-react';
import { generateKeypair, generatePublicTransfer, generateRandomAddress } from '@/lib/wasm';
import { API_BASE_URL } from '@/lib/constants';
import { v7 as uuidv7 } from 'uuid';

type ToastState = {
  type: 'success' | 'error' | 'idle';
  message: string;
};

export function Header() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<ToastState>({ type: 'idle', message: '' });

  const handleGeneratePublic = useCallback(async () => {
    setIsGenerating(true);
    setToast({ type: 'idle', message: '' });

    try {
      // 1. Generate a new keypair
      const keypair = await generateKeypair();

      // 2. Generate a random destination address
      const toAddress = await generateRandomAddress();

      // 3. Generate nonce for v2 API (replay protection / idempotency)
      const nonce = uuidv7();

      // 4. Generate the signed transfer request (1 SOL = 1e9 lamports)
      const transferResult = await generatePublicTransfer(
        keypair.secret_key,
        toAddress,
        1_000_000_000, // 1 SOL
        undefined, // Native SOL, no token mint
        nonce
      );

      // 5. Submit to the API (Idempotency-Key must match nonce)
      const response = await fetch(`${API_BASE_URL}/transfer-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': nonce,
        },
        body: transferResult.request_json,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      setToast({ type: 'success', message: 'Transfer submitted!' });

      // Clear toast after 3 seconds
      setTimeout(() => setToast({ type: 'idle', message: '' }), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setToast({ type: 'error', message });

      // Clear error toast after 5 seconds
      setTimeout(() => setToast({ type: 'idle', message: '' }), 5000);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/neon-logo.png"
            alt="Relayer Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <h1 className="text-xl font-bold text-slate-200 tracking-wider uppercase">
            Solana Relayer
          </h1>
        </div>

        {/* Generate Public Button */}
        <button
          onClick={handleGeneratePublic}
          disabled={isGenerating}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {isGenerating ? 'Generating...' : 'Generate Public'}
        </button>

        {/* Toast notification */}
        {toast.type !== 'idle' && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${
              toast.type === 'success'
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {toast.message}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-status-confirmed" />
          <span className="text-muted">Network Activity:</span>
          <span className="text-foreground font-medium">High</span>
        </div>

        <div className="h-4 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-muted">Anonymity:</span>
          <span className="text-foreground font-medium">Strong</span>
        </div>
      </div>
    </header>
  );
}
