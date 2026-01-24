'use client';

import { motion } from 'framer-motion';
import { Activity, TrendingUp, Clock, Shield } from 'lucide-react';
import type { ComplianceBreakdown } from '@/hooks/useDashboardAnalytics';

// ============================================================================
// Metric Card Component
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

function MetricCard({ title, value, subtitle, changeType = 'neutral', icon }: MetricCardProps) {
  const changeColorClass = {
    positive: 'text-status-confirmed',
    negative: 'text-status-failed',
    neutral: 'text-muted',
  }[changeType];

  return (
    <div className="bg-panel border border-border rounded-lg p-4 hover:border-border-light transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted">{title}</span>
        <span className="text-muted-dark">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {subtitle && (
          <span className={`text-xs ${changeColorClass}`}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compliance Mini Card
// ============================================================================

interface ComplianceMiniCardProps {
  stats: ComplianceBreakdown;
}

function ComplianceMiniCard({ stats }: ComplianceMiniCardProps) {
  const total = stats.approved + stats.rejected + stats.pending;
  const approvalRate = total > 0 ? Math.round((stats.approved / total) * 100) : 0;

  return (
    <div className="bg-panel border border-border rounded-lg p-4 hover:border-border-light transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted">Compliance</span>
        <Shield className="h-4 w-4 text-muted-dark" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">{approvalRate}%</span>
        <span className="text-xs text-status-confirmed">approved</span>
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-status-confirmed" />
          {stats.approved}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-status-failed" />
          {stats.rejected}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-status-pending" />
          {stats.pending}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export interface MetricsRowProps {
  totalTransfers: number;
  successRate: number;
  avgLatencySeconds: number;
  complianceBreakdown: ComplianceBreakdown;
  isLoading?: boolean;
}

export function MetricsRow({
  totalTransfers,
  successRate,
  avgLatencySeconds,
  complianceBreakdown,
  isLoading = false,
}: MetricsRowProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-panel border border-border rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
    >
      <MetricCard
        title="Total Transfers"
        value={totalTransfers}
        subtitle="all time"
        changeType="neutral"
        icon={<Activity className="h-4 w-4" />}
      />
      <MetricCard
        title="Success Rate"
        value={`${successRate}%`}
        changeType={successRate >= 95 ? 'positive' : successRate >= 80 ? 'neutral' : 'negative'}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <MetricCard
        title="Avg. Latency"
        value={avgLatencySeconds > 0 ? `${avgLatencySeconds}s` : 'N/A'}
        changeType={avgLatencySeconds <= 3 ? 'positive' : avgLatencySeconds <= 10 ? 'neutral' : 'negative'}
        icon={<Clock className="h-4 w-4" />}
      />
      <ComplianceMiniCard stats={complianceBreakdown} />
    </motion.div>
  );
}
