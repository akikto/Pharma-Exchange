import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const statusConfig = {
  success: { bg: 'bg-success/10', text: 'text-success', icon: 'check-circle' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', icon: 'clock' },
  danger: { bg: 'bg-danger/10', text: 'text-danger', icon: 'x-circle' },
  info: { bg: 'bg-info/10', text: 'text-info', icon: 'info' },
  neutral: { bg: 'bg-surface-sunken', text: 'text-text-secondary', icon: 'pause' },
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
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', config.bg, config.text, className)}>
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      {label}
    </span>
  );
}
