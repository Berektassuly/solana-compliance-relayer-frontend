'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scan } from 'lucide-react';

import { SystemHealthBar } from '@/components/shared/SystemHealthBar';
import { Footer } from '@/components/shared/Footer';
import { AnalyticsOverview } from '@/widgets/AnalyticsOverview';
import { MetricsRow } from '@/widgets/MetricsRow';
import { Terminal } from '@/features/terminal';
import { Monitor } from '@/features/monitor';
import { RiskScanner } from '@/features/risk-scanner';
import { useDashboardAnalytics } from '@/hooks';

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sticky System Health Header */}
      <SystemHealthBar />

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
            <ScannerToggle onClick={openRiskScanner} />
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
    </div>
  );
}
