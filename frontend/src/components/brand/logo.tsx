import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
};

const sizeMap = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
  hero: 'h-28 w-28',
};

export function Logo({ className, size = 'md', showText = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src="/icons/icon-192.png"
        srcSet="/icons/icon-96.png 96w, /icons/icon-192.png 192w, /icons/icon-512.png 512w"
        sizes="(max-width: 640px) 40px, 56px"
        alt="Pharma-Exchange"
        className={cn('rounded-2xl object-cover shadow-sm', sizeMap[size])}
        width={192}
        height={192}
        decoding="async"
      />
      {showText && (
        <span className="font-bold text-primary leading-tight">
          Pharma<span className="text-accent">Exchange</span>
        </span>
      )}
    </div>
  );
}
