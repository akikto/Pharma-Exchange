import { HomeBannerCarousel } from '@/components/home/home-banner-carousel';
import { BulkProcurementBanner } from '@/components/home/bulk-procurement-banner';
import { ShopHeader } from '@/components/home/shop-header';
import { HOME_HERO_GAP_CLASS } from '@/components/home/home-layout';
import { cn } from '@/lib/utils';

/** Promo banner + optional bulk CTA + shop card — shared width and spacing. */
export function HomeHeroStack({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 max-w-full flex-col box-border',
        HOME_HERO_GAP_CLASS,
        className,
      )}
      data-testid="home-hero-stack"
    >
      <HomeBannerCarousel />
      <BulkProcurementBanner />
      <ShopHeader />
    </div>
  );
}
