/**
 * Mock analytics data for development.
 * Replace with API calls when backend aggregation endpoints are ready.
 */
import type { AnalyticsData } from '@/types/analytics.types';

export const mockAnalyticsData: AnalyticsData = {
  volumeTimeSeries: [
    { time: '00:00', fullTime: '00:00', volume: 2 },
    { time: '', fullTime: '04:00', volume: 1 },
    { time: '08:00', fullTime: '08:00', volume: 5 },
    { time: '', fullTime: '12:00', volume: 3 },
    { time: '16:00', fullTime: '16:00', volume: 8 },
    { time: '', fullTime: '20:00', volume: 4 },
  ],
  assetDistribution: [
    { asset: 'Mon', volume: 4.2 },
    { asset: 'Tue', volume: 6.8 },
    { asset: 'Wed', volume: 5.5 },
    { asset: 'Thu', volume: 7.2 },
    { asset: 'Fri', volume: 8.1 },
    { asset: 'Sat', volume: 3.9 },
  ],
  riskMetrics: {
    averageScore: 1.6,
    walletsAnalyzed: 1247,
    highRiskCount: 23,
    blockedCount: 8,
  },
  recentFlags: [
    {
      id: '1',
      type: 'blocklist',
      reason: 'Blocklist: Auto-Block! CRITICAL RISK [Directly malicious, score: 10]',
      severity: 'critical',
      timestamp: '2026-01-23T10:30:00Z',
    },
    {
      id: '2',
      type: 'blocklist',
      reason: 'Blocklist: Auto-Block! CRITICAL RISK [Directly malicious, score: 10]',
      severity: 'critical',
      timestamp: '2026-01-23T09:45:00Z',
    },
    {
      id: '3',
      type: 'blocklist',
      reason: 'Blocklist: Auto-Block! CRITICAL RISK [Directly malicious, score: 10]',
      severity: 'critical',
      timestamp: '2026-01-23T08:15:00Z',
    },
    {
      id: '4',
      type: 'blocklist',
      reason: 'Blocklist: Internal Security Alert Phishing Scam [flagged manually]',
      severity: 'high',
      timestamp: '2026-01-23T07:00:00Z',
    },
  ],
};
