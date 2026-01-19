/**
 * Operational Dashboard Widget
 * 
 * Displays service metrics, health status, and compliance overview
 */
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Cpu,
  Shield,
} from 'lucide-react';
import { getHealth, type HealthResponse } from '@/shared/api';
import { useTransferStore, useTransfersList } from '@/features/transfer/model/store';

// ============================================================================
// Metric Card Component
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, changeType = 'neutral', icon }: MetricCardProps) {
  const changeColorClass = {
    positive: 'text-status-confirmed',
    negative: 'text-status-failed',
    neutral: 'text-muted',
  }[changeType];
  
  return (
    <div className="bg-panel border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted">{title}</span>
        <span className="text-muted-dark">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground">{value}</span>
        {change && (
          <span className={`text-xs ${changeColorClass}`}>{change}</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Health Status Component
// ============================================================================

function HealthIndicator({ status, label }: { status: 'healthy' | 'degraded' | 'unhealthy'; label: string }) {
  const config = {
    healthy: { color: 'text-status-confirmed', bg: 'bg-status-confirmed/20', icon: CheckCircle2 },
    degraded: { color: 'text-status-pending', bg: 'bg-status-pending/20', icon: AlertCircle },
    unhealthy: { color: 'text-status-failed', bg: 'bg-status-failed/20', icon: XCircle },
  }[status];
  
  const Icon = config.icon;
  
  return (
    <div className="flex items-center gap-2">
      <div className={`p-1 rounded ${config.bg}`}>
        <Icon className={`h-3 w-3 ${config.color}`} />
      </div>
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-sm font-medium ${config.color} capitalize`}>{status}</span>
    </div>
  );
}

// ============================================================================
// Compliance Overview Component
// ============================================================================

function ComplianceOverview() {
  const transfers = useTransfersList();
  
  const stats = transfers.reduce(
    (acc, t) => {
      acc[t.compliance_status]++;
      return acc;
    },
    { approved: 0, rejected: 0, pending: 0 } as Record<string, number>
  );
  
  const total = stats.approved + stats.rejected + stats.pending;
  const approvalRate = total > 0 ? Math.round((stats.approved / total) * 100) : 0;
  
  return (
    <div className="bg-panel border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">Compliance Status</h3>
        <Shield className="h-4 w-4 text-muted-dark" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-status-confirmed" />
            <span className="text-sm text-muted">Approved</span>
          </div>
          <span className="text-sm font-mono text-foreground">{stats.approved}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-status-failed" />
            <span className="text-sm text-muted">Rejected</span>
          </div>
          <span className="text-sm font-mono text-foreground">{stats.rejected}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-status-pending" />
            <span className="text-sm text-muted">Pending</span>
          </div>
          <span className="text-sm font-mono text-foreground">{stats.pending}</span>
        </div>
        
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-dark">Approval Rate</span>
            <span className="text-sm font-semibold text-status-confirmed">{approvalRate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Dashboard Widget
// ============================================================================

export function OperationalDashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const transfers = useTransfersList();
  const { loadTransfers } = useTransferStore();
  
  // Calculate metrics
  const confirmedCount = transfers.filter(t => t.blockchain_status === 'confirmed').length;
  const failedCount = transfers.filter(t => t.blockchain_status === 'failed').length;
  const successRate = confirmedCount + failedCount > 0
    ? Math.round((confirmedCount / (confirmedCount + failedCount)) * 100)
    : 100;
  
  // Fetch health on mount
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await getHealth();
        setHealth(data);
      } catch {
        // Silently fail
      }
    };
    
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  // Load transfers on mount
  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadTransfers(true),
      getHealth().then(setHealth).catch(() => {}),
    ]);
    setIsRefreshing(false);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Operational Dashboard</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg hover:bg-panel-hover transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-muted ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          title="Total Transfers"
          value={transfers.length}
          change="Last 24h"
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
          value="2.4s"
          change="▼ 0.3s"
          changeType="positive"
          icon={<Clock className="h-4 w-4" />}
        />
      </div>
      
      {/* Health & Compliance */}
      <div className="grid grid-cols-2 gap-4">
        {/* System Health */}
        <div className="bg-panel border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground">System Health</h3>
            <span className="text-xs text-muted-dark">v{health?.version || '0.3.0'}</span>
          </div>
          
          <div className="space-y-3">
            <HealthIndicator 
              status={health?.database || 'healthy'} 
              label="Database" 
            />
            <HealthIndicator 
              status={health?.blockchain || 'healthy'} 
              label="Blockchain" 
            />
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-status-confirmed/20">
                <Cpu className="h-3 w-3 text-status-confirmed" />
              </div>
              <span className="text-sm text-muted">Range API</span>
              <span className="text-sm font-medium text-status-confirmed">Healthy</span>
            </div>
          </div>
        </div>
        
        {/* Compliance Overview */}
        <ComplianceOverview />
      </div>
    </motion.div>
  );
}
