'use client';

import { getRiskColor } from '@/types/risk-check';

interface RiskGaugeProps {
  score: number;
  maxScore?: number;
}

export function RiskGauge({ score, maxScore = 10 }: RiskGaugeProps) {
  const riskColor = getRiskColor(score);
  const percentage = (score / maxScore) * 100;

  // Define color classes
  const colorClasses = {
    green: {
      filled: 'bg-green-500',
      glow: 'shadow-green-500/30',
    },
    yellow: {
      filled: 'bg-amber-500',
      glow: 'shadow-amber-500/30',
    },
    red: {
      filled: 'bg-red-500',
      glow: 'shadow-red-500/30',
    },
  };

  const colors = colorClasses[riskColor];

  return (
    <div className="space-y-2">
      {/* Score Display */}
      <div className="flex items-baseline justify-center gap-1">
        <span className={`text-3xl font-bold ${
          riskColor === 'green' ? 'text-green-400' :
          riskColor === 'yellow' ? 'text-amber-400' :
          'text-red-400'
        }`}>
          {score}
        </span>
        <span className="text-lg text-muted">/{maxScore}</span>
      </div>

      {/* Visual Gauge */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxScore }).map((_, index) => {
          const isFilled = index < score;
          return (
            <div
              key={index}
              className={`h-2 flex-1 rounded-sm transition-all duration-300 ${
                isFilled
                  ? `${colors.filled} ${colors.glow} shadow-lg`
                  : 'bg-border'
              }`}
            />
          );
        })}
      </div>

      {/* Percentage Bar (alternative view) */}
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors.filled}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
