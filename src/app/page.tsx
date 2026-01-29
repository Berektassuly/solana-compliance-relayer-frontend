'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scan, Zap, Loader2, Check, AlertCircle } from 'lucide-react';

import { SystemHealthBar } from '@/components/shared/SystemHealthBar';
import { Footer } from '@/components/shared/Footer';
import { AdminOverlay } from '@/components/dashboard/AdminOverlay';
import { AnalyticsOverview } from '@/widgets/AnalyticsOverview';
import { MetricsRow } from '@/widgets/MetricsRow';
import { Terminal } from '@/features/terminal';
import { Monitor } from '@/features/monitor';
import { RiskScanner } from '@/features/risk-scanner';
import { useDashboardAnalytics } from '@/hooks';
import { generateKeypair, generatePublicTransfer, generateRandomAddress } from '@/lib/wasm';
import { API_BASE_URL } from '@/lib/constants';
import { v7 as uuidv7 } from 'uuid';

// ============================================================================
// Risk Scanner Overlay Component
// ============================================================================

interface RiskScannerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

function RiskScannerOverlay({ isOpen, onClose }: RiskScannerOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-xl z-50 overflow-y-auto"
          >
            <div className="min-h-full p-4 pt-14">
              <div className="relative">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute -top-10 right-0 p-2 rounded-lg bg-panel border border-border hover:bg-panel-hover transition-colors"
                >
                  <X className="h-4 w-4 text-muted" />
                </button>
                
                <RiskScanner />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Risk Scanner Toggle Button
// ============================================================================

interface ScannerToggleProps {
  onClick: () => void;
}

function ScannerToggle({ onClick }: ScannerToggleProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors"
    >
      <Scan className="h-4 w-4" />
      <span className="text-sm font-medium">Risk Scanner</span>
    </motion.button>
  );
}

// ============================================================================
// Generate Public Toggle Button
// ============================================================================

type ToastState = {
  type: 'success' | 'error' | 'idle';
  message: string;
};

interface GeneratePublicToggleProps {
  isGenerating: boolean;
  toast: ToastState;
  onClick: () => void;
}

function GeneratePublicToggle({ isGenerating, toast, onClick }: GeneratePublicToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <motion.button
        onClick={onClick}
        disabled={isGenerating}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {isGenerating ? 'Generating...' : 'Generate Public'}
        </span>
      </motion.button>

      {/* Toast notification */}
      <AnimatePresence>
        {toast.type !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg ${
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Section Header Component
// ============================================================================

interface SectionHeaderProps {
  title: string;
  children?: React.ReactNode;
}

function SectionHeader({ title, children }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xs font-semibold text-muted uppercase tracking-widest">
        {title}
      </h2>
      {children}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function HomePage() {
  const [isRiskScannerOpen, setIsRiskScannerOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<ToastState>({ type: 'idle', message: '' });

  // Unified data hook - fetch once at page level
  const {
    volumeTimeSeries,
    dailyTransactionCounts,
    successRate,
    recentFlags,
    totalTransfers,
    avgLatencySeconds,
    complianceBreakdown,
    isLoading,
  } = useDashboardAnalytics();

  const openRiskScanner = useCallback(() => {
    setIsRiskScannerOpen(true);
  }, []);

  const closeRiskScanner = useCallback(() => {
    setIsRiskScannerOpen(false);
  }, []);

  const openAdmin = useCallback(() => {
    setIsAdminOpen(true);
  }, []);

  const closeAdmin = useCallback(() => {
    setIsAdminOpen(false);
  }, []);

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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sticky System Health Header */}
      <SystemHealthBar onAdminClick={openAdmin} />

      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* ============================================================== */}
        {/* Section 1: Analytics Hero */}
        {/* ============================================================== */}
        <section>
          <SectionHeader title="Analytics Overview" />
          
          {/* Analytics Charts (24h Volume, Distribution, Risk Gauge) */}
          <AnalyticsOverview
            volumeTimeSeries={volumeTimeSeries}
            dailyTransactionCounts={dailyTransactionCounts}
            successRate={successRate}
            recentFlags={recentFlags}
            compact
          />
        </section>

        {/* Operational Metrics Row */}
        <section>
          <MetricsRow
            totalTransfers={totalTransfers}
            successRate={successRate}
            avgLatencySeconds={avgLatencySeconds}
            complianceBreakdown={complianceBreakdown}
            isLoading={isLoading}
          />
        </section>

        {/* ============================================================== */}
        {/* Section 2: Execution & Monitoring */}
        {/* ============================================================== */}
        <section>
          <SectionHeader title="Execution & Monitoring">
            <div className="flex items-center gap-3">
              <GeneratePublicToggle
                isGenerating={isGenerating}
                toast={toast}
                onClick={handleGeneratePublic}
              />
              <ScannerToggle onClick={openRiskScanner} />
            </div>
          </SectionHeader>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
            {/* Left Column (33%) - Terminal */}
            <div className="min-w-0">
              <Terminal />
            </div>

            {/* Right Column (66%) - Monitor */}
            <div className="min-w-0">
              <Monitor />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Risk Scanner Overlay */}
      <RiskScannerOverlay
        isOpen={isRiskScannerOpen}
        onClose={closeRiskScanner}
      />

      {/* Admin Overlay */}
      <AdminOverlay
        isOpen={isAdminOpen}
        onClose={closeAdmin}
      />
    </div>
  );
}
