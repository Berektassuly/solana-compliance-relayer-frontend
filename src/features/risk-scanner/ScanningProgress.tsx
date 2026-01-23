'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Loader2 } from 'lucide-react';

interface ScanStep {
  id: string;
  label: string;
  duration: number; // milliseconds
}

const SCAN_STEPS: ScanStep[] = [
  { id: 'blocklist', label: 'Checking Internal Blocklist', duration: 1000 },
  { id: 'range', label: 'Querying Range Protocol Risk API', duration: 1500 },
  { id: 'helius', label: 'Scanning Helius DAS for Assets', duration: 1000 },
];

interface ScanningProgressProps {
  isBlocked: boolean;
  onComplete: () => void;
}

export function ScanningProgress({ isBlocked, onComplete }: ScanningProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    // If blocked, only animate first step then complete
    const stepsToAnimate = isBlocked ? 1 : SCAN_STEPS.length;

    if (currentStep >= stepsToAnimate) {
      // Small delay before showing result
      const timeout = setTimeout(onComplete, 300);
      return () => clearTimeout(timeout);
    }

    const step = SCAN_STEPS[currentStep];
    const timeout = setTimeout(() => {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
      setCurrentStep((prev) => prev + 1);
    }, step.duration);

    return () => clearTimeout(timeout);
  }, [currentStep, isBlocked, onComplete]);

  const totalDuration = isBlocked
    ? SCAN_STEPS[0].duration
    : SCAN_STEPS.reduce((sum, s) => sum + s.duration, 0);
  
  const elapsed = SCAN_STEPS.slice(0, currentStep).reduce((sum, s) => sum + s.duration, 0);
  const progress = Math.min((elapsed / totalDuration) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Header with Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground font-medium">SCANNING WALLET</span>
          <span className="text-muted">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step List */}
      <div className="space-y-3">
        {SCAN_STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(index);
          const isActive = index === currentStep && !isCompleted;
          // If blocked, mark later steps as skipped
          const isSkipped = isBlocked && index > 0;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 text-sm ${
                isSkipped ? 'opacity-30' : ''
              }`}
            >
              {/* Status Icon */}
              <div className="w-5 h-5 flex items-center justify-center">
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-400"
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-dark" />
                )}
              </div>

              {/* Label */}
              <span
                className={`flex-1 ${
                  isCompleted
                    ? 'text-foreground'
                    : isActive
                    ? 'text-primary'
                    : 'text-muted-dark'
                }`}
              >
                {step.label}
              </span>

              {/* Status Text */}
              <span
                className={`text-xs ${
                  isCompleted
                    ? 'text-green-400'
                    : isActive
                    ? 'text-primary'
                    : 'text-muted-dark'
                }`}
              >
                {isCompleted ? (isBlocked && index === 0 ? 'Blocked' : 'Clean') : isActive ? 'Analyzing...' : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
