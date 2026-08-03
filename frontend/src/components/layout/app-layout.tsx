import { Outlet } from 'react-router-dom';
import { BottomNav } from './bottom-nav';
import { SideNav } from './side-nav';
import { RequestBottomSheet } from './request-bottom-sheet';
import { ShellModals } from './shell-modals';
import { OfflineBanner } from './offline-banner';
import { PushPermissionPrompt } from '@/components/notifications/push-permission-prompt';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-base flex edge-to-edge">
      <SideNav />
      <div className="flex-1 min-w-0 flex flex-col pb-[7.5rem] lg:pb-0">
        <OfflineBanner />
        <div className="mx-auto w-full max-w-lg lg:max-w-5xl xl:max-w-6xl flex-1 w-full">
          <Outlet />
        </div>
        <PushPermissionPrompt />
        <RequestBottomSheet />
        <BottomNav />
      </div>
      <ShellModals />
    </div>
  );
}
