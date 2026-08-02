import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, MessageCircle, User, LayoutDashboard, Package, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

const buyerNav = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const sellerNav = [
  { to: '/seller', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/seller/inventory', icon: Package, label: 'Inventory' },
  { to: '/seller/requests', icon: Inbox, label: 'Requests' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const mode = useAuthStore((s) => s.mode);
  const nav = mode === 'seller' ? sellerNav : buyerNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-surface-base safe-bottom lg:hidden">
      <div className="flex items-center justify-around h-16">
        {nav.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 min-w-[64px] min-h-[48px] justify-center',
                active ? 'text-primary' : 'text-text-secondary'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'fill-primary/20')} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
