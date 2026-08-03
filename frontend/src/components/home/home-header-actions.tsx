import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavBadge } from '@/components/ui/nav-badge';
import { useWatchlistCount } from '@/hooks/use-watchlist';
import { useToast } from '@/hooks/use-toast';

export function HomeHeaderActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const watchlistCount = useWatchlistCount();
  const { toast } = useToast();

  return (
    <div className="flex items-center gap-0" data-testid="home-header-actions">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        aria-label={t('home.barcodeScan')}
        onClick={() => toast({ description: t('home.barcodeComingSoon') })}
      >
        <ScanBarcode className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        aria-label={t('home.watchlistShortcut', { count: watchlistCount })}
        onClick={() => navigate('/watchlist')}
      >
        <Heart className="h-5 w-5" />
        <NavBadge count={watchlistCount} />
      </Button>
    </div>
  );
}
