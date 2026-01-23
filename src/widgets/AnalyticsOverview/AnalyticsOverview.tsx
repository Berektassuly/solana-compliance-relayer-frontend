/**
 * AnalyticsOverview Widget
 *
 * Displays high-level metrics: transaction volume chart, asset distribution,
 * risk score gauge, and recent security flags.
 */
'use client';

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
import type { SecurityFlag } from '@/types/analytics.types';
import { mockAnalyticsData } from './mockAnalyticsData';

// ============================================================================
// Chart Color Definitions
// ============================================================================

const PURPLE_GRADIENT_ID = 'purpleGradient';
const BAR_GRADIENT_ID = 'barGradient';

// Risk score color thresholds
function getRiskGaugeColor(score: number): string {
  if (score <= 3) return '#22c55e'; // Green - Low risk
  if (score <= 6) return '#eab308'; // Yellow - Medium risk
  return '#ef4444'; // Red - High risk
}

// ============================================================================
// Sub-components
// ============================================================================

function VolumeChart() {
  const data = mockAnalyticsData.volumeTimeSeries;

  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-medium text-foreground mb-4">24h Transaction Volume</h3>
      {/* FIX: Added w-full to ensure Recharts can calculate width */}
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
              tickFormatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111722',
                border: '1px solid #1f2a3a',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value) => value != null ? [`$${Number(value).toLocaleString()}`, 'Volume'] : null}
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

function AssetDistributionChart() {
  const data = mockAnalyticsData.assetDistribution;

  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-medium text-foreground mb-4">Asset Distribution (Last 7 Days)</h3>
      {/* FIX: Added w-full to ensure Recharts can calculate width */}
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
              formatter={(value) => value != null ? [`${Number(value).toFixed(1)}M`, 'Volume'] : null}
            />
            <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`url(#${BAR_GRADIENT_ID})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RiskGauge() {
  const { averageScore } = mockAnalyticsData.riskMetrics;
  const percentage = (averageScore / 10) * 100;
  const color = getRiskGaugeColor(averageScore);

  const gaugeData = [
    { name: 'score', value: percentage, fill: color },
  ];

  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wide">Risk Metrics</h3>
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
            <span className="text-xs text-muted">Average Risk</span>
            <span className="text-xs text-muted">Score</span>
            <span className="text-xl font-bold mt-1" style={{ color }}>
              {averageScore.toFixed(1)}%
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

function RecentFlags() {
  const flags = mockAnalyticsData.recentFlags;

  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-medium text-foreground mb-4">Recent Flags</h3>
      <div className="space-y-1">
        {flags.map((flag) => (
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
            <VolumeChart />
            <AssetDistributionChart />
          </div>

          {/* Right Panel: Risk & Compliance */}
          <div className="flex-1 p-6 flex flex-col sm:flex-row gap-6">
            <RiskGauge />
            <RecentFlags />
          </div>
        </div>
      </div>
    </motion.div>
  );
}