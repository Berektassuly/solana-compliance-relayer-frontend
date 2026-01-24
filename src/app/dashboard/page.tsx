/**
 * Dashboard Page - Operational metrics and system overview
 * 
 * This page provides a secondary view focused on analytics and operations.
 * For the unified experience, see the home page.
 */
'use client';

import { Suspense } from 'react';
import { SystemHealthBar } from '@/components/shared/SystemHealthBar';
import { AnalyticsOverview } from '@/widgets/AnalyticsOverview';
import { MetricsRow } from '@/widgets/MetricsRow';
import { useDashboardAnalytics } from '@/hooks';

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse mb-8">
      <div className="h-4 w-32 bg-panel rounded" />
      <div className="h-48 bg-panel rounded-xl" />
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 bg-panel rounded-lg" />
      ))}
    </div>
  );
}

function DashboardContent() {
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

  return (
    <>
      {/* Analytics Overview */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
          Analytics Overview
        </h2>
        <AnalyticsOverview
          volumeTimeSeries={volumeTimeSeries}
          dailyTransactionCounts={dailyTransactionCounts}
          successRate={successRate}
          recentFlags={recentFlags}
        />
      </div>

      {/* Operational Metrics */}
      <div>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
          Operational Metrics
        </h2>
        <MetricsRow
          totalTransfers={totalTransfers}
          successRate={successRate}
          avgLatencySeconds={avgLatencySeconds}
          complianceBreakdown={complianceBreakdown}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <SystemHealthBar />
      
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={
          <>
            <AnalyticsSkeleton />
            <MetricsSkeleton />
          </>
        }>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}
