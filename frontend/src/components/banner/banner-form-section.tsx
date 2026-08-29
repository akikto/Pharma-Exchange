import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BannerFormSectionVariant = 'click-action' | 'target-audience';

type BannerFormSectionProps = {
  variant: BannerFormSectionVariant;
  title: string;
  description?: string;
  children: ReactNode;
  testId?: string;
};

const VARIANT_STYLES: Record<
  BannerFormSectionVariant,
  { container: string; title: string; description: string; badge: string }
> = {
  'click-action': {
    container: 'border-info/35 bg-info/5 border-l-info',
    title: 'text-info',
    description: 'text-info/80',
    badge: 'bg-info/15 text-info',
  },
  'target-audience': {
    container: 'border-primary/35 bg-primary-subtle/60 border-l-primary',
    title: 'text-primary',
    description: 'text-primary/80',
    badge: 'bg-primary/10 text-primary',
  },
};

export function BannerFormSection({
  variant,
  title,
  description,
  children,
  testId,
}: BannerFormSectionProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <section
      data-testid={testId}
      className={cn(
        'space-y-4 rounded-[var(--radius-md)] border border-l-4 p-3',
        styles.container,
      )}
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn('text-sm font-semibold', styles.title)}>{title}</p>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', styles.badge)}>
            {variant === 'click-action' ? 'Destination' : 'Audience'}
          </span>
        </div>
        {description ? (
          <p className={cn('text-xs', styles.description)}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
