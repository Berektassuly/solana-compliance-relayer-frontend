/**
 * Dashboard Page - Operational metrics and system overview
 */
import { Suspense } from 'react';
import { AnalyticsOverview } from '@/widgets/AnalyticsOverview';
import { OperationalDashboard } from '@/widgets/OperationalDashboard';

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse mb-8">
      <div className="h-4 w-32 bg-panel rounded" />
      <div className="h-48 bg-panel rounded-xl" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-panel rounded" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-panel rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-40 bg-panel rounded-lg" />
        <div className="h-40 bg-panel rounded-lg" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Analytics Overview - Top widget */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <div className="mb-8">
          <AnalyticsOverview />
        </div>
      </Suspense>

      {/* Operational Dashboard */}
      <Suspense fallback={<DashboardSkeleton />}>
        <OperationalDashboard />
      </Suspense>
    </div>
  );
}
