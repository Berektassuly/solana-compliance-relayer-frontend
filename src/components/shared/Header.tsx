'use client';

import { Activity, Shield } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-panel/50 backdrop-blur-sm">
      <h1 className="text-xl font-semibold text-foreground tracking-tight">
        Relayer
      </h1>
      
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-status-confirmed" />
          <span className="text-muted">Network Activity:</span>
          <span className="text-foreground font-medium">High</span>
        </div>
        
        <div className="h-4 w-px bg-border" />
        
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-muted">Anonymity:</span>
          <span className="text-foreground font-medium">Strong</span>
        </div>
      </div>
    </header>
  );
}
