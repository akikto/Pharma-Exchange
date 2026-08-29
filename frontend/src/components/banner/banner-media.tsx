import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';
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
  /** Home promo videos stay muted for autoplay; user can tap to enable sound. */
  showSoundToggle?: boolean;
};

export function BannerMedia({
  mediaUrl,
  mediaType,
  alt,
  className,
  isActive = true,
  priority = false,
  showSoundToggle = false,
}: BannerMediaProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState(() => resolveBannerMediaUrl(mediaUrl));
  const [failed, setFailed] = useState(false);
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    setSrc(resolveBannerMediaUrl(mediaUrl));
    setFailed(false);
    setSoundOn(false);
  }, [mediaUrl]);

  useEffect(() => {
    if (!isActive) setSoundOn(false);
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !soundOn;
    if (soundOn) {
      void video.play().catch(() => {
        setSoundOn(false);
      });
    }
  }, [soundOn]);

  const handleError = () => {
    const fallback = resolveBannerMediaFallbackUrl(mediaUrl, src);
    if (fallback) {
      setSrc(fallback);
      return;
    }
    setFailed(true);
  };

  const handleSoundToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setSoundOn((current) => !current);
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
      <>
        <video
          ref={videoRef}
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
        {showSoundToggle ? (
          <button
            type="button"
            className="absolute top-3 right-3 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60"
            onClick={handleSoundToggle}
            aria-label={soundOn ? t('home.bannerMute') : t('home.bannerUnmute')}
            aria-pressed={soundOn}
            data-testid="banner-media-sound-toggle"
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        ) : null}
      </>
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
