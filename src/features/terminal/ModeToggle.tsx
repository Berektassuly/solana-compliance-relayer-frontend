'use client';

import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import type { TransferMode } from '@/types/transaction';
import { cn } from '@/lib/utils';

const modes: { value: TransferMode; label: string; icon: typeof Eye }[] = [
  { value: 'public', label: 'PUBLIC', icon: Eye },
  { value: 'confidential', label: 'CONFIDENTIAL', icon: EyeOff },
];

export function ModeToggle() {
  const { transferMode, setTransferMode } = useUIStore();

  return (
    <div className="relative flex rounded-lg bg-panel p-1 border border-border">
      {/* Animated background indicator */}
      <motion.div
        className="absolute inset-y-1 rounded-md bg-gradient-primary shadow-lg"
        initial={false}
        animate={{
          x: transferMode === 'public' ? 4 : '100%',
          width: 'calc(50% - 8px)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{
          left: transferMode === 'public' ? 0 : 0,
        }}
        layoutId="mode-indicator"
      />

      {modes.map(({ value, label, icon: Icon }) => {
        const isActive = transferMode === value;
        return (
          <button
            key={value}
            onClick={() => setTransferMode(value)}
            className={cn(
              'relative z-10 flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-md transition-colors duration-200',
              isActive ? 'text-white' : 'text-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
