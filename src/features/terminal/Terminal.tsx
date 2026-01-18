'use client';

import { ModeToggle } from './ModeToggle';
import { TransferForm } from './TransferForm';

export function Terminal() {
  return (
    <div className="rounded-xl border border-border bg-panel p-6 space-y-6">
      <h2 className="text-lg font-semibold text-foreground tracking-tight">
        TERMINAL
      </h2>
      
      <ModeToggle />
      
      <TransferForm />
    </div>
  );
}
