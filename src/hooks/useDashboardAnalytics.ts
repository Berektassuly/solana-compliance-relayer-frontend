/**
 * useDashboardAnalytics Hook
 *
 * Fetches raw transfer data from the backend and computes all dashboard metrics
 * client-side. Implements 10-second polling for real-time updates.
 */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { listTransfers, type TransferRequest } from '@/shared/api';
import { fetchBlocklist, type BlocklistEntry } from '@/services/blocklist';
import type { SecurityFlag, VolumeDataPoint, AssetDistribution } from '@/types/analytics.types';

// ============================================================================
// Types
// ============================================================================

export interface ComplianceBreakdown {
  approved: number;
  rejected: number;
  pending: number;
}

export interface DashboardAnalytics {
  // Raw data
  transfers: TransferRequest[];
  
  // Operational metrics
  totalTransfers: number;
  transfers24h: number;
  successRate: number;
  avgLatencySeconds: number;
  
  // Compliance breakdown
  complianceBreakdown: ComplianceBreakdown;
  approvalRate: number;
  
  // Chart data
  volumeTimeSeries: VolumeDataPoint[];
  dailyTransactionCounts: AssetDistribution[];
  
  // Recent flags from blocklist
  recentFlags: SecurityFlag[];
  
  // State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const POLLING_INTERVAL_MS = 10_000; // 10 seconds
const FETCH_LIMIT = 100; // Fetch up to 100 transfers for analysis
const LAMPORTS_PER_SOL = 1_000_000_000;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate the time difference in milliseconds between two ISO date strings.
 */
function getLatencyMs(createdAt: string, updatedAt: string): number {
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  return Math.max(0, updated - created);
}

/**
 * Check if a date is within the last N hours.
 */
function isWithinHours(dateStr: string, hours: number): boolean {
  const date = new Date(dateStr).getTime();
  const now = Date.now();
  const cutoff = now - hours * 60 * 60 * 1000;
  return date >= cutoff;
}

/**
 * Check if a date is within the last N days.
 */
function isWithinDays(dateStr: string, days: number): boolean {
  const date = new Date(dateStr).getTime();
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return date >= cutoff;
}

/**
 * Get day of week label (e.g., "Mon", "Tue").
 */
function getDayLabel(dateStr: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

/**
 * Get hour label for a date (e.g., "14:00").
 */
function getHourLabel(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getHours().toString().padStart(2, '0')}:00`;
}

/**
 * Get full date+hour key for unique hourly grouping (e.g., "2026-01-24 14:00").
 * This prevents collisions between the same hour on different days.
 */
function getFullHourKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:00`;
}

/**
 * Get local date key in YYYY-MM-DD format (using local timezone, not UTC).
 */
function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convert blocklist entries to SecurityFlag format.
 */
function entriesToFlags(entries: BlocklistEntry[]): SecurityFlag[] {
  return entries.slice(0, 10).map((entry, index) => ({
    id: `blocklist-${index}`,
    type: 'blocklist' as const,
    reason: `Blocklist: ${entry.reason}`,
    severity: entry.reason.toLowerCase().includes('critical') ? 'critical' as const : 'high' as const,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Get public transfer amount in lamports, or 0 for confidential.
 */
function getAmount(transfer: TransferRequest): number {
  if (transfer.transfer_details.type === 'public') {
    return transfer.transfer_details.amount;
  }
  return 0;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDashboardAnalytics(): DashboardAnalytics {
  // Raw data state
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [blocklistEntries, setBlocklistEntries] = useState<BlocklistEntry[]>([]);
  
  // Loading/error state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch function
  const fetchData = useCallback(async () => {
    try {
      // Fetch transfers and blocklist in parallel
      const [transfersResponse, blocklistResponse] = await Promise.all([
        listTransfers(FETCH_LIMIT),
        fetchBlocklist().catch(() => ({ entries: [], count: 0 })), // Graceful fallback
      ]);

      setTransfers(transfersResponse.items);
      setBlocklistEntries(blocklistResponse.entries);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  // Initial fetch + polling
  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, POLLING_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ============================================================================
  // Computed Metrics (Memoized)
  // ============================================================================

  const analytics = useMemo(() => {
    // Total transfers
    const totalTransfers = transfers.length;

    // Transfers in last 24 hours
    const transfers24hList = transfers.filter(t => isWithinHours(t.created_at, 24));
    const transfers24h = transfers24hList.length;

    // Success rate: confirmed / (confirmed + failed)
    const confirmed = transfers.filter(t => t.blockchain_status === 'confirmed');
    const failed = transfers.filter(t => t.blockchain_status === 'failed');
    const terminalCount = confirmed.length + failed.length;
    const successRate = terminalCount > 0
      ? Math.round((confirmed.length / terminalCount) * 100)
      : 100;

    // Average latency for confirmed transactions
    let avgLatencySeconds = 0;
    if (confirmed.length > 0) {
      const totalLatencyMs = confirmed.reduce((sum, t) => {
        return sum + getLatencyMs(t.created_at, t.updated_at);
      }, 0);
      avgLatencySeconds = Math.round((totalLatencyMs / confirmed.length) / 100) / 10; // Round to 1 decimal
    }

    // Compliance breakdown
    const complianceBreakdown: ComplianceBreakdown = {
      approved: transfers.filter(t => t.compliance_status === 'approved').length,
      rejected: transfers.filter(t => t.compliance_status === 'rejected').length,
      pending: transfers.filter(t => t.compliance_status === 'pending').length,
    };

    // Approval rate
    const totalCompliance = complianceBreakdown.approved + complianceBreakdown.rejected + complianceBreakdown.pending;
    const approvalRate = totalCompliance > 0
      ? Math.round((complianceBreakdown.approved / totalCompliance) * 100)
      : 0;

    // 24h transaction counts (group by hour) - COUNT of transactions, not volume
    // Use full date+hour key to avoid collisions between same hour on different days
    const hourlyCounts: Map<string, { displayTime: string; count: number }> = new Map();
    
    // Initialize last 24 hours with full date+hour keys
    for (let i = 23; i >= 0; i--) {
      const date = new Date(Date.now() - i * 60 * 60 * 1000);
      const fullKey = getFullHourKey(date);
      const displayTime = `${date.getHours().toString().padStart(2, '0')}:00`;
      hourlyCounts.set(fullKey, { displayTime, count: 0 });
    }

    // Count transactions per hour using full date+hour key
    transfers24hList.forEach(t => {
      const transferDate = new Date(t.created_at);
      const fullKey = getFullHourKey(transferDate);
      if (hourlyCounts.has(fullKey)) {
        const entry = hourlyCounts.get(fullKey)!;
        hourlyCounts.set(fullKey, { ...entry, count: entry.count + 1 });
      }
    });

    // Convert to array for chart - XAxis uses interval={3} to show labels every 4 hours
    const volumeTimeSeries: VolumeDataPoint[] = Array.from(hourlyCounts.entries())
      .map(([, { displayTime, count }]) => ({
        time: displayTime,
        fullTime: displayTime, // Same as time, used for tooltip
        volume: count,
      }));

    // Recent flags from blocklist
    const recentFlags = entriesToFlags(blocklistEntries);

    // 7-day transaction counts by actual date (using LOCAL dates, not UTC)
    const transfers7dList = transfers.filter(t => isWithinDays(t.created_at, 7));
    const dailyCounts: Map<string, { label: string; count: number }> = new Map();
    
    // Initialize last 7 days with date-based keys (local YYYY-MM-DD format)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = getLocalDateKey(date);
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon", "Tue"
      dailyCounts.set(dateKey, { label: dayLabel, count: 0 });
    }

    // Count transfers per day using local date keys
    transfers7dList.forEach(t => {
      const transferDate = new Date(t.created_at);
      const dateKey = getLocalDateKey(transferDate);
      if (dailyCounts.has(dateKey)) {
        const entry = dailyCounts.get(dateKey)!;
        dailyCounts.set(dateKey, { ...entry, count: entry.count + 1 });
      }
    });

    // Convert to array for chart (oldest to newest)
    const dailyTransactionCounts: AssetDistribution[] = Array.from(dailyCounts.values())
      .map(({ label, count }) => ({
        asset: label,
        volume: count,
      }));

    return {
      totalTransfers,
      transfers24h,
      successRate,
      avgLatencySeconds,
      complianceBreakdown,
      approvalRate,
      volumeTimeSeries,
      dailyTransactionCounts,
      recentFlags,
    };
  }, [transfers, blocklistEntries]);

  return {
    transfers,
    ...analytics,
    isLoading,
    error,
    lastUpdated,
    refresh,
  };
}
