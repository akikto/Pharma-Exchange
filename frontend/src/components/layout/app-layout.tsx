import { Outlet } from 'react-router-dom';
import { BottomNav } from './bottom-nav';
import { SideNav } from './side-nav';
import { RequestBottomSheet } from './request-bottom-sheet';
import { ShellModals } from './shell-modals';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-base flex edge-to-edge">
      <SideNav />
      <div className="flex-1 min-w-0 flex flex-col pb-[7.5rem] lg:pb-0">
        <div className="mx-auto w-full max-w-lg lg:max-w-5xl xl:max-w-6xl flex-1 w-full">
          <Outlet />
        </div>
        <RequestBottomSheet />
        <BottomNav />
      </div>
      <ShellModals />
    </div>
  );
}
