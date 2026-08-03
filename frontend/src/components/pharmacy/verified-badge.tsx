import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export function VerifiedBadge({ size = 'sm', className }: VerifiedBadgeProps) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-success bg-success/10 rounded-full font-medium',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        className,
      )}
      data-testid="verified-badge"
    >
      <ShieldCheck className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} aria-hidden />
      {t('home.verified')}
    </span>
  );
}
