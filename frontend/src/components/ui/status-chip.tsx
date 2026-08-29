import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const statusConfig = {
  success: { bg: 'bg-success-subtle', text: 'text-success', border: 'border-success/25' },
  warning: { bg: 'bg-warning-subtle', text: 'text-warning', border: 'border-warning/25' },
  danger: { bg: 'bg-danger-subtle', text: 'text-danger', border: 'border-danger/25' },
  info: { bg: 'bg-info-subtle', text: 'text-info', border: 'border-info/25' },
  neutral: { bg: 'bg-surface-sunken', text: 'text-text-secondary', border: 'border-border-subtle' },
} as const;

interface StatusChipProps {
  label: string;
  variant?: keyof typeof statusConfig;
  icon?: LucideIcon;
  className?: string;
}

export function StatusChip({ label, variant = 'neutral', icon: Icon, className }: StatusChipProps) {
  const config = statusConfig[variant];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', config.bg, config.text, config.border, className)}>
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {label}
    </span>
  );
}
