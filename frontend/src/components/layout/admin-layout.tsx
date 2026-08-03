import { Link, Outlet } from 'react-router-dom';
import { Logo } from '@/components/brand/logo';
import { adminNav } from './nav-config';
import { NavLinkItem } from './nav-link';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-surface-raised flex">
      <aside className="hidden md:flex md:flex-col md:w-56 lg:w-60 shrink-0 border-r border-border-subtle bg-surface-base sticky top-0 h-screen py-6 px-4">
        <Link to="/admin" className="px-3 mb-6">
          <Logo size="sm" />
          <p className="text-xs text-text-secondary mt-1">Admin Panel</p>
        </Link>
        <nav className="flex flex-col gap-1" aria-label="Admin navigation">
          {adminNav.map((item) => (
            <NavLinkItem key={item.to} item={item} variant="side" />
          ))}
        </nav>
        <Link to="/" className="mt-auto px-3 text-sm text-primary hover:underline">
          ← Back to app
        </Link>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="md:hidden sticky top-0 z-40 border-b border-border-subtle bg-surface-base px-4 h-14 flex items-center gap-3">
          <Logo size="sm" />
          <span className="font-semibold text-sm">Admin</span>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
