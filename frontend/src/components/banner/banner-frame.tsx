import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BannerFrameProps = {
  children: ReactNode;
  className?: string;
  /** Accessible label for the frame region (e.g. live preview). */
  label?: string;
  testId?: string;
};

/** Fixed 2:1 promotional banner viewport — shared by home carousel and admin preview. */
export function BannerFrame({ children, className, label, testId }: BannerFrameProps) {
  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-[var(--radius-md)] bg-surface-raised', className)}
      data-testid={testId}
      {...(label ? { role: 'img', 'aria-label': label } : {})}
    >
      <div className="relative w-full aspect-[2/1]">
        {children}
      </div>
    </div>
  );
}
