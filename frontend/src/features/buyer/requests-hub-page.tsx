import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopBar } from '@/components/layout/top-bar';
import { CartTabPanel } from '@/components/cart/cart-tab-panel';
import { OrdersTabPanel } from '@/components/orders/orders-tab-panel';
import { BuyRequestsTabPanel } from '@/components/orders/buy-requests-tab-panel';
import { cn } from '@/lib/utils';

export type HubTab = 'cart' | 'orders' | 'requests';

const TABS: HubTab[] = ['cart', 'orders', 'requests'];

export function RequestsHubPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as HubTab) || 'cart';
  const activeTab = TABS.includes(tab) ? tab : 'cart';

  const setTab = (next: HubTab) => {
    setSearchParams(next === 'cart' ? {} : { tab: next }, { replace: true });
  };

  return (
    <div className="pb-4">
      <TopBar title={t('hub.title')} />
      <div className="px-4 pt-2">
        <p className="text-[10px] text-text-disabled mb-3">{t('hub.titleSub')}</p>
        <div className="flex rounded-[var(--radius-md)] border border-border-subtle p-1 mb-4" role="tablist">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setTab(key)}
              className={cn(
                'flex-1 rounded-[var(--radius-sm)] py-2 text-xs font-medium min-h-[44px] transition-colors',
                activeTab === key ? 'bg-primary text-primary-foreground' : 'text-text-secondary',
              )}
            >
              {t(`hub.tabs.${key}`)}
            </button>
          ))}
        </div>

        <div role="tabpanel">
          {activeTab === 'cart' && <CartTabPanel />}
          {activeTab === 'orders' && <OrdersTabPanel />}
          {activeTab === 'requests' && <BuyRequestsTabPanel />}
        </div>
      </div>
    </div>
  );
}
