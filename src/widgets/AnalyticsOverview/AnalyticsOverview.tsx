/**
 * AnalyticsOverview Widget
 *
 * Displays high-level metrics: transaction volume chart, asset distribution,
 * risk score gauge, and recent security flags.
 */
'use client';

import { useHydrated, useDashboardAnalytics } from '@/hooks';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldX, ChevronDown } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { SecurityFlag, VolumeDataPoint, AssetDistribution } from '@/types/analytics.types';
import { mockAnalyticsData } from './mockAnalyticsData';

// ============================================================================
// Chart Color Definitions
// ============================================================================

const PURPLE_GRADIENT_ID = 'purpleGradient';
const BAR_GRADIENT_ID = 'barGradient';

// Success rate color thresholds
function getStatusColor(rate: number): string {
  if (rate >= 90) return '#22c55e'; // Green - Excellent
  if (rate >= 70) return '#eab308'; // Yellow - Warning
  return '#ef4444'; // Red - Critical
}

// ============================================================================
// Sub-components
// ============================================================================

interface VolumeChartProps {
  data: VolumeDataPoint[];
}

function VolumeChart({ data }: VolumeChartProps) {
  // Use data directly - should always have 24 data points from hook
  const chartData = data;

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col">
      <h3 className="text-sm font-medium text-foreground mb-4">Transactions (24h)</h3>
      {/* FIX: Added w-full to ensure Recharts can calculate width */}
      <div className="flex-1 min-h-[8rem] w-full flex items-center">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={PURPLE_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="fullTime"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              interval={3}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(value: number) => Math.round(value).toString()}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111722',
                border: '1px solid #1f2a3a',
                borderRadius: '8px',
                color: '#fff',
                padding: '8px 12px',
              }}
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div style={{ backgroundColor: '#111722', border: '1px solid #1f2a3a', borderRadius: '8px', padding: '8px 12px', color: '#fff' }}>
                      <div style={{ fontWeight: 500 }}>{data.fullTime}</div>
                      <div style={{ color: '#a78bfa' }}>{data.volume} transactions</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#7c3aed"
              strokeWidth={2}
              fill={`url(#${PURPLE_GRADIENT_ID})`}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface AssetDistributionChartProps {
  data: AssetDistribution[];
}

function AssetDistributionChart({ data }: AssetDistributionChartProps) {
  // Use live data if available, fallback to mock
  const chartData = data.length > 0 ? data : mockAnalyticsData.assetDistribution;

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col">
      <h3 className="text-sm font-medium text-foreground mb-4">Transactions (Last 7 Days)</h3>
      {/* FIX: Added w-full to ensure Recharts can calculate width */}
      <div className="flex-1 min-h-[8rem] w-full flex items-center">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={BAR_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={1} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="asset"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111722',
                border: '1px solid #1f2a3a',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value) => value != null ? [Number(value), 'Transactions'] : null}
            />
            <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`url(#${BAR_GRADIENT_ID})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface TransactionStatusGaugeProps {
  successRate: number;
}

function TransactionStatusGauge({ successRate }: TransactionStatusGaugeProps) {
  const color = getStatusColor(successRate);

  const gaugeData = [
    { name: 'rate', value: successRate, fill: color },
  ];

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col">
      <h3 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wide">Transaction Status</h3>
      <div className="flex-1 flex items-center justify-center p-4">
        {/* Upscaled gauge container with breathing room */}
        <div className="relative h-50 w-50">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={13}
              data={gaugeData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={6}
                background={{ fill: '#1f2a3a' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted">Success</span>
            <span className="text-xs text-muted">Rate</span>
            <span className="text-3xl font-bold mt-1" style={{ color }}>
              {successRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlagItem({ flag }: { flag: SecurityFlag }) {
  const Icon = flag.severity === 'critical' ? ShieldX : ShieldAlert;
  const colorClass = flag.severity === 'critical' ? 'text-status-failed' : 'text-status-pending';
  const iconBg = flag.severity === 'critical' ? 'bg-status-failed/20' : 'bg-status-pending/20';

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`p-1.5 rounded ${iconBg} flex-shrink-0`}>
        <Icon className={`h-3 w-3 ${colorClass}`} />
      </div>
      <p className={`text-xs ${colorClass} leading-relaxed line-clamp-2`}>
        {flag.reason}
      </p>
    </div>
  );
}

interface RecentFlagsProps {
  flags: SecurityFlag[];
}

function RecentFlags({ flags }: RecentFlagsProps) {
  // Use live data if available, fallback to mock
  const displayFlags = flags.length > 0 ? flags : mockAnalyticsData.recentFlags;

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col">
      <h3 className="text-sm font-medium text-foreground mb-4">Recent Blocklist Flags</h3>
      <div className="flex-1 space-y-1">
        {displayFlags.map((flag) => (
          <FlagItem key={flag.id} flag={flag} />
        ))}
      </div>
      <button className="flex items-center gap-1 text-xs text-primary hover:text-primary-light transition-colors mt-2">
        Show more
        <ChevronDown className="h-3 w-3" />
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export interface AnalyticsOverviewProps {
  /** Volume time series data (24h) - if not provided, uses internal hook */
  volumeTimeSeries?: VolumeDataPoint[];
  /** Daily transaction counts (7d) - if not provided, uses internal hook */
  dailyTransactionCounts?: AssetDistribution[];
  /** Success rate percentage - if not provided, uses internal hook */
  successRate?: number;
  /** Recent security flags - if not provided, uses internal hook */
  recentFlags?: SecurityFlag[];
  /** Whether to use compact mode (smaller padding) */
  compact?: boolean;
}

export function AnalyticsOverview({
  volumeTimeSeries: propVolumeTimeSeries,
  dailyTransactionCounts: propDailyTransactionCounts,
  successRate: propSuccessRate,
  recentFlags: propRecentFlags,
  compact = false,
}: AnalyticsOverviewProps = {}) {
  // Prevent SSR rendering of charts which causes dimension warnings
  const isMounted = useHydrated();

  // Fetch live data from the analytics hook (only if props not provided)
  const hookData = useDashboardAnalytics();
  
  // Use props if provided, otherwise fall back to hook data
  const volumeTimeSeries = propVolumeTimeSeries ?? hookData.volumeTimeSeries;
  const dailyTransactionCounts = propDailyTransactionCounts ?? hookData.dailyTransactionCounts;
  const successRate = propSuccessRate ?? hookData.successRate;
  const recentFlags = propRecentFlags ?? hookData.recentFlags;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      {/* Header
      <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
        Analytics Overview
      </h2>
      */}
      {/* Main Container */}
      <div className="bg-panel border border-border rounded-xl overflow-hidden shadow-lg shadow-primary/5">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          {/* Left Panel: Traffic & Volume */}
          <div className={`flex-1 ${compact ? 'p-4' : 'p-6'} flex flex-col sm:flex-row sm:items-stretch gap-6 border-b lg:border-b-0 lg:border-r border-border`}>
            {isMounted ? (
              <>
                <VolumeChart data={volumeTimeSeries} />
                <AssetDistributionChart data={dailyTransactionCounts} />
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0 h-32 bg-panel-hover rounded animate-pulse" />
                <div className="flex-1 min-w-0 h-32 bg-panel-hover rounded animate-pulse" />
              </>
            )}
          </div>

          {/* Right Panel: Status & Compliance */}
          <div className={`flex-1 ${compact ? 'p-4' : 'p-6'} flex flex-col sm:flex-row sm:items-stretch gap-6`}>
            {isMounted ? (
              <TransactionStatusGauge successRate={successRate} />
            ) : (
              <div className="flex-1 min-w-0 h-32 bg-panel-hover rounded animate-pulse" />
            )}
            <RecentFlags flags={recentFlags} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}