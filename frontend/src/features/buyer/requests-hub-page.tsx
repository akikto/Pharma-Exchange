import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TopBar } from '@/components/layout/top-bar';
import { CartTabPanel } from '@/components/cart/cart-tab-panel';
import { OrdersTabPanel } from '@/components/orders/orders-tab-panel';
import { BuyRequestsTabPanel } from '@/components/orders/buy-requests-tab-panel';
import { useTabListKeyboard } from '@/hooks/use-tab-list';
import { cn } from '@/lib/utils';

export type HubTab = 'cart' | 'orders' | 'requests';

const TABS: HubTab[] = ['cart', 'orders', 'requests'];

function tabId(key: HubTab) {
  return `hub-tab-${key}`;
}

function panelId(key: HubTab) {
  return `hub-panel-${key}`;
}

export function RequestsHubPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as HubTab) || 'cart';
  const activeTab = TABS.includes(tab) ? tab : 'cart';

  const setTab = (next: HubTab) => {
    setSearchParams(next === 'cart' ? {} : { tab: next }, { replace: true });
  };

  const onTabKeyDown = useTabListKeyboard(TABS, activeTab, setTab);

  return (
    <div className="pb-4">
      <TopBar title={t('hub.title')} />
      <div className="pt-2">
        <p className="text-[10px] text-text-disabled mb-3">{t('hub.titleSub')}</p>
        <div
          className="flex rounded-[var(--radius-md)] border border-border-subtle p-1 mb-4"
          role="tablist"
          aria-label={t('hub.tabsLabel')}
          onKeyDown={onTabKeyDown}
        >
          {TABS.map((key) => (
            <button
              key={key}
              id={tabId(key)}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              aria-controls={panelId(key)}
              tabIndex={activeTab === key ? 0 : -1}
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

        {TABS.map((key) => (
          <div
            key={key}
            id={panelId(key)}
            role="tabpanel"
            aria-labelledby={tabId(key)}
            hidden={activeTab !== key}
            tabIndex={0}
          >
            {activeTab === key && key === 'cart' && <CartTabPanel />}
            {activeTab === key && key === 'orders' && <OrdersTabPanel />}
            {activeTab === key && key === 'requests' && <BuyRequestsTabPanel />}
          </div>
        ))}
      </div>
    </div>
  );
}
