import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, MessageCircle, User, LayoutDashboard, Package, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useCartCount } from '@/hooks/use-api';

const buyerNav: { to: string; icon: typeof Home; label: string; badgeKey?: 'cart' }[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart', badgeKey: 'cart' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const sellerNav: { to: string; icon: typeof Home; label: string; badgeKey?: 'cart' }[] = [
  { to: '/seller', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/seller/inventory', icon: Package, label: 'Inventory' },
  { to: '/seller/requests', icon: Inbox, label: 'Requests' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const location = useLocation();
  const mode = useAuthStore((s) => s.mode);
  const cartCount = useCartCount();
  const nav = mode === 'seller' ? sellerNav : buyerNav;

  const getBadge = (key?: 'cart') => {
    if (key === 'cart') return cartCount > 0 ? cartCount : 0;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-surface-base safe-bottom lg:hidden">
      <div className="flex items-center justify-around h-16">
        {nav.map(({ to, icon: Icon, label, badgeKey }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          const badge = badgeKey ? getBadge(badgeKey) : 0;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-3 py-1 min-w-[64px] min-h-[48px] justify-center',
                active ? 'text-primary' : 'text-text-secondary'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'fill-primary/20')} />
              {badge > 0 && (
                <span className="absolute top-0 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
