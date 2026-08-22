import { cn } from '@/lib/utils';
import type { BannerMediaType } from '@/lib/banner-form';
import { resolveBannerMediaUrl } from '@/lib/banner-media-url';

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
  const src = resolveBannerMediaUrl(mediaUrl);

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
      data-testid="banner-media-image"
    />
  );
}
