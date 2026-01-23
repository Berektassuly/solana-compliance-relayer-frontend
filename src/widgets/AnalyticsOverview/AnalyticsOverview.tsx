/**
 * AnalyticsOverview Widget
 *
 * Displays high-level metrics: transaction volume chart, asset distribution,
 * risk score gauge, and recent security flags.
 */
'use client';

import { useState, useEffect } from 'react';
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
import { useDashboardAnalytics } from '@/hooks';
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
  // Use live data if available, fallback to mock
  const chartData = data.length > 0 ? data : mockAnalyticsData.volumeTimeSeries;

  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-medium text-foreground mb-4">Transactions (24h)</h3>
      {/* FIX: Added w-full to ensure Recharts can calculate width */}
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={PURPLE_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
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
              }}
              formatter={(value) => value != null ? [Math.round(Number(value)), 'Transactions'] : null}
            />
            <Area
              type="monotone"
              dataKey="volume"
              stroke="#7c3aed"
              strokeWidth={2}
              fill={`url(#${PURPLE_GRADIENT_ID})`}
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
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-medium text-foreground mb-4">Transactions (Last 7 Days)</h3>
      {/* FIX: Added w-full to ensure Recharts can calculate width */}
      <div className="h-32 w-full">
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
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wide">Transaction Status</h3>
      <div className="flex items-center justify-center">
        {/* FIX: Keep relative and ensure width/height are defined */}
        <div className="relative h-32 w-32">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={10}
              data={gaugeData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={5}
                background={{ fill: '#1f2a3a' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs text-muted">Success</span>
            <span className="text-xs text-muted">Rate</span>
            <span className="text-xl font-bold mt-1" style={{ color }}>
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
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-medium text-foreground mb-4">Recent Flags</h3>
      <div className="space-y-1">
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

export function AnalyticsOverview() {
  // Prevent SSR rendering of charts which causes dimension warnings
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch live data from the analytics hook
  const { volumeTimeSeries, dailyTransactionCounts, successRate, recentFlags } = useDashboardAnalytics();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      {/* Header */}
      <h2 className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
        Analytics Overview
      </h2>

      {/* Main Container */}
      <div className="bg-panel border border-border rounded-xl overflow-hidden shadow-lg shadow-primary/5">
        <div className="flex flex-col lg:flex-row">
          {/* Left Panel: Traffic & Volume */}
          <div className="flex-1 p-6 flex flex-col sm:flex-row gap-6 border-b lg:border-b-0 lg:border-r border-border">
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
          <div className="flex-1 p-6 flex flex-col sm:flex-row gap-6">
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