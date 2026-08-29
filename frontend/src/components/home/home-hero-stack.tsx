import { HomeBannerCarousel } from '@/components/home/home-banner-carousel';
import { BulkProcurementBanner } from '@/components/home/bulk-procurement-banner';
import { ShopHeader } from '@/components/home/shop-header';
import {
  HOME_PROMO_BANNER_SHELL_CLASS,
  HOME_PROMO_BANNER_SPACING_CLASS,
} from '@/components/home/home-layout';
import { cn } from '@/lib/utils';

/** Promo banner + optional bulk CTA + shop card — shared width and spacing. */
export function HomeHeroStack({ className }: { className?: string }) {
  return (
    <div className={cn('flex w-full min-w-0 max-w-full flex-col gap-3', className)} data-testid="home-hero-stack">
      <div
        className={cn(
          HOME_PROMO_BANNER_SHELL_CLASS,
          HOME_PROMO_BANNER_SPACING_CLASS,
          'min-w-0 px-0',
        )}
        data-testid="home-promo-banner-shell"
      >
        <HomeBannerCarousel embedded />
      </div>
      <BulkProcurementBanner />
      <ShopHeader />
    </div>
  );
}
