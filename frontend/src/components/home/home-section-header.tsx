import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  sectionThemeAccentBar,
  sectionThemeIconShell,
  type SectionTheme,
} from '@/lib/section-theme';

interface HomeSectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  theme?: SectionTheme;
  className?: string;
}

export function HomeSectionHeader({ title, subtitle, icon: Icon, theme = 'default', className }: HomeSectionHeaderProps) {
  return (
    <div className={cn('mb-3', className)}>
      <div className="flex items-center gap-2">
        <span
          className={cn('h-5 w-1 shrink-0 rounded-full bg-gradient-to-b', sectionThemeAccentBar(theme))}
          aria-hidden
        />
        {Icon && (
          <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', sectionThemeIconShell(theme))}>
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
