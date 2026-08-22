import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { BannerMediaType } from '@/lib/banner-form';
import {
  resolveBannerMediaFallbackUrl,
  resolveBannerMediaUrl,
} from '@/lib/banner-media-url';

type BannerMediaProps = {
  mediaUrl: string;
  mediaType: BannerMediaType;
  alt: string;
  className?: string;
  isActive?: boolean;
  priority?: boolean;
};

export function BannerMedia({
  mediaUrl,
  mediaType,
  alt,
  className,
  isActive = true,
  priority = false,
}: BannerMediaProps) {
  const [src, setSrc] = useState(() => resolveBannerMediaUrl(mediaUrl));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(resolveBannerMediaUrl(mediaUrl));
    setFailed(false);
  }, [mediaUrl]);

  const handleError = () => {
    const fallback = resolveBannerMediaFallbackUrl(mediaUrl, src);
    if (fallback) {
      setSrc(fallback);
      return;
    }
    setFailed(true);
  };

  if (failed) {
    return (
      <div
        className={cn('absolute inset-0 bg-gradient-to-br from-surface-sunken to-surface-raised', className)}
        role="img"
        aria-label={alt}
        data-testid="banner-media-fallback"
      />
    );
  }

  if (mediaType === 'VIDEO') {
    return (
      <video
        key={src}
        src={src}
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
        muted
        loop
        playsInline
        autoPlay={isActive}
        preload={isActive ? 'metadata' : 'none'}
        aria-label={alt}
        data-testid="banner-media-video"
        onError={handleError}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn('absolute inset-0 h-full w-full object-cover', className)}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      referrerPolicy="no-referrer"
      data-testid="banner-media-image"
      onError={handleError}
    />
  );
}
