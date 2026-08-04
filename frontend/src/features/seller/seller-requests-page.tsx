import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { BuyRequestsTabPanel } from '@/components/orders/buy-requests-tab-panel';

export function SellerRequestsPage() {
  const { t } = useTranslation();

  return (
    <div>
      <TopBar
        title={t('seller.pendingBuyRequests')}
        showBack
        backTo="/seller"
        actions={(
          <Link to="/seller">
            <Button size="sm" variant="ghost" aria-label={t('nav.dashboard')}>
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </Link>
        )}
      />
      <div className="p-4">
        <BuyRequestsTabPanel />
      </div>
    </div>
  );
}
