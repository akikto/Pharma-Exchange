import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShellStore } from '@/stores/shell-store';

const DISMISS_KEY = 'pharmex-bulk-banner-dismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function BulkProcurementBanner() {
  const { t } = useTranslation();
  const openModal = useShellStore((s) => s.openModal);
  const [visible, setVisible] = useState(() => !readDismissed());

  useEffect(() => {
    const handler = () => setVisible(false);
    window.addEventListener('bulk-banner-dismiss', handler);
    return () => window.removeEventListener('bulk-banner-dismiss', handler);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
    window.dispatchEvent(new Event('bulk-banner-dismiss'));
  };

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-warning/30 border-l-4 border-l-warning bg-warning/5 p-3 shadow-elevation-1 relative"
      data-testid="bulk-procurement-banner"
    >
      <button
        type="button"
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-surface-raised"
        aria-label={t('common.close')}
        onClick={dismiss}
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <Package className="h-8 w-8 text-warning shrink-0 drop-shadow-sm" />
        <div className="flex-1">
          <p className="font-semibold text-sm">{t('home.bulkBannerTitle')}</p>
          <p className="text-xs text-text-secondary mt-0.5">{t('home.bulkBannerDesc')}</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => openModal('bulk')}>{t('home.bulkBannerCta')}</Button>
            <Link to="/search">
              <Button size="sm" variant="secondary">{t('home.bulkBannerBrowse')}</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
