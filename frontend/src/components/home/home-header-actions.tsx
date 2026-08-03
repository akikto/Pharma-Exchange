import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, ShoppingCart, ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavBadge } from '@/components/ui/nav-badge';
import { useNavBadges } from '@/hooks/use-nav-badges';
import { useWatchlistCount } from '@/hooks/use-watchlist';
import { useToast } from '@/hooks/use-toast';

export function HomeHeaderActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const badges = useNavBadges();
  const watchlistCount = useWatchlistCount();
  const { toast } = useToast();

  return (
    <div className="flex items-center gap-0.5" data-testid="home-header-actions">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('home.barcodeScan')}
        onClick={() => toast({ description: t('home.barcodeComingSoon') })}
      >
        <ScanBarcode className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={t('home.watchlistShortcut', { count: watchlistCount })}
        onClick={() => navigate('/watchlist')}
      >
        <Heart className="h-5 w-5" />
        <NavBadge count={watchlistCount} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={t('home.cartShortcut', { count: badges.cart })}
        onClick={() => navigate('/cart')}
      >
        <ShoppingCart className="h-5 w-5" />
        <NavBadge count={badges.cart} />
      </Button>
    </div>
  );
}
