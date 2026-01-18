import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            'flex h-11 w-full rounded-lg border bg-panel px-4 py-2 text-sm text-foreground placeholder:text-muted-dark transition-all duration-200',
            'border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-status-failed focus:border-status-failed focus:ring-status-failed/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-status-failed">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
