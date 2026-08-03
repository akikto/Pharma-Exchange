import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StatusStepperProps {
  steps: readonly string[];
  currentStatus: string;
  labels: Record<string, string>;
  terminalStatus?: string;
  className?: string;
}

export function StatusStepper({
  steps,
  currentStatus,
  labels,
  terminalStatus,
  className,
}: StatusStepperProps) {
  const { t } = useTranslation();
  const isTerminal = terminalStatus && currentStatus === terminalStatus;
  const currentIndex = steps.indexOf(currentStatus as (typeof steps)[number]);

  return (
    <ol className={cn('flex flex-col gap-0', className)} aria-label="Status progress">
      {steps.map((step, index) => {
        const done = isTerminal ? false : currentIndex > index;
        const active = !isTerminal && currentStatus === step;
        const upcoming = !done && !active;

        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold shrink-0',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary text-primary',
                  upcoming && 'border-border-subtle text-text-disabled',
                  isTerminal && 'border-border-subtle text-text-disabled',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              {index < steps.length - 1 && (
                <span className={cn('w-0.5 flex-1 min-h-[24px] my-1', done ? 'bg-primary' : 'bg-border-subtle')} />
              )}
            </div>
            <div className="pb-6 pt-1">
              <p className={cn('text-sm font-medium', active ? 'text-primary' : 'text-text-primary')}>
                {labels[step] ?? step}
              </p>
              {active && <p className="text-xs text-text-secondary">{t('orders.stepCurrent')}</p>}
            </div>
          </li>
        );
      })}
      {isTerminal && terminalStatus && (
        <li className="flex gap-3 -mt-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-danger text-danger text-xs font-semibold shrink-0">
            !
          </span>
          <p className="pt-1 text-sm font-medium text-danger">{labels[terminalStatus] ?? terminalStatus}</p>
        </li>
      )}
    </ol>
  );
}
