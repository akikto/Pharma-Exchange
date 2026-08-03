import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

export function QuantityStepper({
  value,
  min,
  max,
  onChange,
  disabled,
  className,
  'aria-label': ariaLabel,
}: QuantityStepperProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div
      className={cn(
        'inline-flex items-center border border-border-subtle rounded-[var(--radius-md)]',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-surface-sunken disabled:opacity-40"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-surface-sunken disabled:opacity-40"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
