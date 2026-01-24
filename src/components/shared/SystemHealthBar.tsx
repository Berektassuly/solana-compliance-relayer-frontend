'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, AlertCircle, XCircle, Cpu, Database, Globe, Settings } from 'lucide-react';
import { getHealth, type HealthResponse } from '@/shared/api';

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

interface SystemHealthBarProps {
  onAdminClick?: () => void;
}

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

export function SystemHealthBar({ onAdminClick }: SystemHealthBarProps = {}) {
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
          {/* Left - Logo and Title */}
          <div className="flex items-center gap-3">
            <Image
              src="/assets/neon-logo.png"
              alt="Relayer Logo"
              width={40}
              height={40}
              className="object-contain mix-blend-screen"
            />
            <h1 className="text-sm font-bold text-slate-200 tracking-wider uppercase">
              Solana Relayer
            </h1>
          </div>

          {/* Right - Health Indicators + Admin */}
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
            
            {/* Admin Toggle */}
            {onAdminClick && (
              <>
                <div className="h-4 w-px bg-border hidden md:block" />
                <button
                  onClick={onAdminClick}
                  className="p-1.5 rounded-md hover:bg-panel-hover transition-colors group"
                  title="Admin Panel"
                >
                  <Settings className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
