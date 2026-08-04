import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { OrdersTabPanel } from '@/components/orders/orders-tab-panel';

export function SellerOrdersPage() {
  const { t } = useTranslation();

  return (
    <div>
      <TopBar
        title={t('seller.orders')}
        showBack
        backTo="/seller"
        actions={(
          <Link to="/seller/analytics">
            <Button size="sm" variant="ghost" aria-label={t('seller.analytics')}>
              <TrendingUp className="h-4 w-4" />
            </Button>
          </Link>
        )}
      />
      <div className="p-4">
        <OrdersTabPanel />
      </div>
    </div>
  );
}
