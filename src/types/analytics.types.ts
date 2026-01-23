/**
 * Analytics types for the AnalyticsOverview widget.
 * These interfaces mirror future API aggregation endpoints.
 */

/**
 * Single data point for the 24h transaction volume time series.
 */
export interface VolumeDataPoint {
  /** Time label for X-axis (may be empty for non-labeled points) */
  time: string;
  /** Full time label for tooltip (e.g., "14:00") */
  fullTime: string;
  /** Transaction count */
  volume: number;
}

/**
 * Asset distribution data for the bar chart.
 */
export interface AssetDistribution {
  /** Asset symbol (e.g., "SOL", "USDC") */
  asset: string;
  /** Volume in the last 7 days (USD) */
  volume: number;
}

/**
 * Security flag/event for the recent flags list.
 */
export interface SecurityFlag {
  /** Unique identifier */
  id: string;
  /** Flag type: blocklist match or risk threshold exceeded */
  type: 'blocklist' | 'risk_threshold';
  /** Human-readable reason */
  reason: string;
  /** Severity level */
  severity: 'critical' | 'high' | 'medium';
  /** Timestamp (ISO 8601) */
  timestamp: string;
}

/**
 * Risk metrics summary for the gauge display.
 */
export interface RiskMetrics {
  /** Average risk score (0-10) */
  averageScore: number;
  /** Total wallets analyzed in period */
  walletsAnalyzed: number;
  /** Number flagged as high risk */
  highRiskCount: number;
  /** Number blocked */
  blockedCount: number;
}

/**
 * Complete analytics data structure for the widget.
 */
export interface AnalyticsData {
  volumeTimeSeries: VolumeDataPoint[];
  assetDistribution: AssetDistribution[];
  riskMetrics: RiskMetrics;
  recentFlags: SecurityFlag[];
}
