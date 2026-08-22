import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HomeSectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
}

export function HomeSectionHeader({ title, subtitle, icon: Icon, className }: HomeSectionHeaderProps) {
  return (
    <div className={cn('mb-3', className)}>
      <div className="flex items-center gap-2">
        <span className="h-5 w-1 shrink-0 rounded-full bg-gradient-to-b from-primary to-accent" aria-hidden />
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-primary">
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
        <h2 className="min-w-0 font-semibold tracking-tight text-text-primary">{title}</h2>
      </div>
      {subtitle && (
        <p className="mt-1 pl-3 text-xs leading-relaxed text-text-secondary">{subtitle}</p>
      )}
    </div>
  );
}
