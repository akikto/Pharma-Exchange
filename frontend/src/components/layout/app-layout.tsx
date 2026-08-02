import { Outlet } from 'react-router-dom';
import { BottomNav } from './bottom-nav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-base pb-16 lg:pb-0">
      <div className="mx-auto max-w-lg lg:max-w-7xl">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
