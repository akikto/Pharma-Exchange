import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNav } from './bottom-nav';
import { SideNav } from './side-nav';
import { RequestBottomSheet } from './request-bottom-sheet';
import { ShellModals } from './shell-modals';
import { OfflineBanner } from './offline-banner';
import { PushPermissionPrompt } from '@/components/notifications/push-permission-prompt';

export function AppLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-surface-base flex edge-to-edge">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-md)] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
      >
        {t('a11y.skipToContent')}
      </a>
      <SideNav />
      <div className="flex-1 min-w-0 flex flex-col pb-[7.5rem] lg:pb-0">
        <OfflineBanner />
        <main
          id="main-content"
          className="mx-auto w-full max-w-lg lg:max-w-5xl xl:max-w-6xl flex-1 w-full"
          tabIndex={-1}
        >
          <Outlet />
        </main>
        <PushPermissionPrompt />
        <RequestBottomSheet />
        <BottomNav />
      </div>
      <ShellModals />
    </div>
  );
}
