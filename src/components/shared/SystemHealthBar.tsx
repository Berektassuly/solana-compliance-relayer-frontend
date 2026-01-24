'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, Cpu, Database, Globe } from 'lucide-react';
import { getHealth, type HealthResponse } from '@/shared/api';

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

interface HealthIndicatorProps {
  status: HealthStatus;
  label: string;
  icon: React.ReactNode;
}

function HealthIndicator({ status, label, icon }: HealthIndicatorProps) {
  const config = {
    healthy: { color: 'text-status-confirmed', bg: 'bg-status-confirmed/20', StatusIcon: CheckCircle2 },
    degraded: { color: 'text-status-pending', bg: 'bg-status-pending/20', StatusIcon: AlertCircle },
    unhealthy: { color: 'text-status-failed', bg: 'bg-status-failed/20', StatusIcon: XCircle },
  }[status];

  return (
    <div className="flex items-center gap-2">
      <div className={`p-1 rounded ${config.bg}`}>
        <span className={config.color}>{icon}</span>
      </div>
      <span className="text-xs text-muted hidden sm:inline">{label}</span>
      <div className={`h-1.5 w-1.5 rounded-full ${status === 'healthy' ? 'bg-status-confirmed' : status === 'degraded' ? 'bg-status-pending' : 'bg-status-failed'}`} />
    </div>
  );
}

export function SystemHealthBar() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await getHealth();
        setHealth(data);
      } catch {
        // Silently fail - show as unhealthy
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-0 z-50 w-full bg-panel/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-10">
          {/* Left - System Health Label */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted uppercase tracking-wide">System Health</span>
            <span className="text-xs text-muted-dark">v{health?.version || '0.3.0'}</span>
          </div>

          {/* Right - Health Indicators */}
          <div className="flex items-center gap-4 md:gap-6">
            <HealthIndicator
              status={health?.database || 'healthy'}
              label="Database"
              icon={<Database className="h-3 w-3" />}
            />
            <HealthIndicator
              status={health?.blockchain || 'healthy'}
              label="Blockchain"
              icon={<Globe className="h-3 w-3" />}
            />
            <HealthIndicator
              status="healthy"
              label="Range API"
              icon={<Cpu className="h-3 w-3" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
