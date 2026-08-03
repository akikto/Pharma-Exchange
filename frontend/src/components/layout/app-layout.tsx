import { Outlet } from 'react-router-dom';
import { BottomNav } from './bottom-nav';
import { SideNav } from './side-nav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-base flex">
      <SideNav />
      <div className="flex-1 min-w-0 flex flex-col pb-16 lg:pb-0">
        <div className="mx-auto w-full max-w-lg lg:max-w-5xl xl:max-w-6xl flex-1">
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
