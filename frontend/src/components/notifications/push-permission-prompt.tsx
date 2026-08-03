import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export function PushPermissionPrompt() {
  const { t } = useTranslation();
  const { showPrompt, enablePush, dismissPrompt } = usePushNotifications();

  if (!showPrompt) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-[5.5rem] z-40 px-4 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm"
      data-testid="push-permission-prompt"
    >
      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-base shadow-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-subtle flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-sm">{t('push.promptTitle')}</p>
            <p className="text-xs text-text-secondary">{t('push.promptDesc')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" size="sm" onClick={dismissPrompt}>
            {t('push.notNow')}
          </Button>
          <Button className="flex-1" size="sm" onClick={() => void enablePush()}>
            {t('push.enable')}
          </Button>
        </div>
      </div>
    </div>
  );
}
