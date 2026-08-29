import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BannerFrame } from '@/components/banner/banner-frame';
import { BannerMedia } from '@/components/banner/banner-media';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useHomeBanners } from '@/hooks/use-banners';
import { useGeolocation } from '@/hooks/use-geolocation';
import { openBannerDestination, resolveBannerDestination } from '@/lib/banner-navigation';
import type { HomeBanner } from '@/lib/banner-form';
import { cn } from '@/lib/utils';

const AUTOPLAY_MS = 6000;
const BANNER_FRAME_CLASS = 'border border-accent/25 shadow-elevation-1';
const BANNER_FRAME_EMBEDDED_CLASS = 'rounded-none border-0 shadow-none bg-transparent';

function BannerSlide({
  banner,
  isActive,
}: {
  banner: HomeBanner;
  isActive: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const destination = resolveBannerDestination(banner.actionType, banner.actionTarget);
  const alt = banner.mediaAlt?.trim() || banner.title;

  const handleClick = () => {
    if (!destination) return;
    const result = openBannerDestination(destination);
    if (typeof result === 'string') navigate(result);
  };

  const content = (
    <>
      <BannerMedia
        mediaUrl={banner.mediaUrl}
        mediaType={banner.mediaType}
        alt={alt}
        isActive={isActive}
        priority={isActive}
        showSoundToggle={banner.mediaType === 'VIDEO'}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />
      {banner.isSponsored ? (
        <span className="absolute top-3 left-3 z-20 rounded-full bg-accent/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white pointer-events-none shadow-sm">
          {t('home.bannerSponsored')}
        </span>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 z-20 p-4 text-left text-white pointer-events-none">
        <p className="font-semibold text-base sm:text-lg drop-shadow">{banner.title}</p>
        {banner.subtitle ? (
          <p className="text-xs sm:text-sm text-white/90 mt-0.5 line-clamp-2">{banner.subtitle}</p>
        ) : null}
        {banner.ctaText ? (
          <span className="inline-block mt-2 text-xs font-semibold bg-accent/90 text-white px-2.5 py-1 rounded-full shadow-sm">
            {banner.ctaText}
          </span>
        ) : null}
      </div>
    </>
  );

  if (destination) {
    return (
      <div className="absolute inset-0" data-testid={`home-banner-slide-${banner.id}`}>
        {content}
        <button
          type="button"
          className="absolute inset-0 z-10 w-full h-full text-left"
          onClick={handleClick}
          aria-label={banner.ctaText || banner.title}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0" aria-hidden={!isActive} data-testid={`home-banner-slide-${banner.id}`}>
      {content}
    </div>
  );
}

export function HomeBannerCarousel({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation();
  const { coords } = useGeolocation();
  const { data: banners = [], isLoading, isError } = useHomeBanners(
    coords
      ? { latitude: coords.latitude, longitude: coords.longitude }
      : undefined,
  );
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const count = banners.length;
  const activeIndex = count > 0 ? ((index % count) + count) % count : 0;

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    setIndex(0);
  }, [count]);

  useEffect(() => {
    if (count <= 1 || reducedMotion) return;
    const timer = window.setInterval(() => goTo(activeIndex + 1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [activeIndex, count, goTo, reducedMotion]);

  if (isError) return null;

  const frameClass = embedded ? BANNER_FRAME_EMBEDDED_CLASS : BANNER_FRAME_CLASS;

  if (isLoading) {
    return (
      <div className="w-full min-w-0 max-w-full" data-testid="home-banner-carousel-loading">
        <BannerFrame className={frameClass}>
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        </BannerFrame>
      </div>
    );
  }

  if (count === 0) return null;

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = event.changedTouches[0]?.clientX ?? start;
    const delta = end - start;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) goTo(activeIndex + 1);
    else goTo(activeIndex - 1);
  };

  return (
    <section
      className="block w-full min-w-0 max-w-full box-border touch-pan-x"
      aria-roledescription="carousel"
      aria-label={t('home.bannerCarouselAria')}
      data-testid="home-banner-carousel"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <BannerFrame className={frameClass}>
        <div className="absolute inset-0">
          {banners.map((banner, i) => (
            <div
              key={banner.id}
              className={cn(
                'absolute inset-0 transition-opacity duration-500',
                i === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none',
              )}
              aria-hidden={i !== activeIndex}
            >
              <BannerSlide banner={banner} isActive={i === activeIndex} />
            </div>
          ))}
        </div>

        {count > 1 ? (
          <>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 h-8 w-8 rounded-full bg-black/35 text-white border-0 hover:bg-black/50"
              onClick={() => goTo(activeIndex - 1)}
              aria-label={t('home.bannerPrev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 h-8 w-8 rounded-full bg-black/35 text-white border-0 hover:bg-black/50"
              onClick={() => goTo(activeIndex + 1)}
              aria-label={t('home.bannerNext')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1.5" role="tablist">
              {banners.map((banner, i) => (
                <button
                  key={banner.id}
                  type="button"
                  role="tab"
                  aria-selected={i === activeIndex}
                  aria-label={t('home.bannerDot', { title: banner.title, index: i + 1, count })}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === activeIndex ? 'w-5 bg-accent' : 'w-1.5 bg-white/50',
                  )}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          </>
        ) : null}
      </BannerFrame>
    </section>
  );
}
