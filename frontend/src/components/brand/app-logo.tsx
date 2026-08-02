import { useState } from 'react';
import { brand } from '@/config/brand';
import { cn } from '@/lib/utils';

type AppLogoProps = {
  /** Use wide logo instead of square icon */
  variant?: 'icon' | 'logo';
  /** For splash screen on primary background */
  onDark?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
};

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

const logoSizes = {
  sm: 'h-8 max-w-[120px]',
  md: 'h-12 max-w-[180px]',
  lg: 'h-16 max-w-[240px]',
  xl: 'h-28 max-w-[320px]',
};

export function AppLogo({
  variant = 'icon',
  onDark = false,
  size = 'md',
  showName = false,
  className,
}: AppLogoProps) {
  const [imgError, setImgError] = useState(false);
  const [useIconFallback, setUseIconFallback] = useState(false);

  const src =
    variant === 'logo' && !useIconFallback
      ? onDark
        ? brand.logoOnDark
        : brand.logo
      : brand.icon;

  const sizeClass = variant === 'logo' && !useIconFallback ? logoSizes[size] : sizes[size];

  if (imgError) {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div
          className={cn(
            sizeClass,
            'rounded-2xl bg-primary flex items-center justify-center text-white font-bold',
            size === 'xl' ? 'text-3xl' : 'text-lg'
          )}
        >
          {brand.name.slice(0, 2).toUpperCase()}
        </div>
        {showName && (
          <div className="text-center">
            <p className={cn('font-bold', onDark ? 'text-white' : 'text-primary', size === 'xl' ? 'text-3xl' : 'text-xl')}>
              {brand.name}
            </p>
            {brand.tagline && (
              <p className={cn('text-sm', onDark ? 'text-white/80' : 'text-text-secondary')}>{brand.tagline}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <img
        src={src}
        alt={brand.name}
        className={cn(sizeClass, (variant === 'icon' || useIconFallback) && 'rounded-2xl object-cover')}
        onError={() => {
          if (variant === 'logo' && !useIconFallback) {
            setUseIconFallback(true);
            return;
          }
          setImgError(true);
        }}
      />
      {showName && (
        <div className="text-center">
          <p className={cn('font-bold', onDark ? 'text-white' : 'text-primary', size === 'xl' ? 'text-3xl' : 'text-xl')}>
            {brand.name}
          </p>
          {brand.tagline && (
            <p className={cn('text-sm', onDark ? 'text-white/80' : 'text-text-secondary')}>{brand.tagline}</p>
          )}
        </div>
      )}
    </div>
  );
}
