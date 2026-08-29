import { cn } from '@/lib/utils';

interface NavBadgeProps {
  count: number;
  className?: string;
}

export function NavBadge({ count, className }: NavBadgeProps) {
  if (count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);
  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-sm ring-2 ring-surface-base',
        className,
      )}
      aria-label={`${count} unread`}
    >
      {label}
    </span>
  );
}
