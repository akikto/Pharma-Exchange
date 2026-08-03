import type { LucideIcon } from 'lucide-react';
import { Home, Search, ShoppingCart, MessageCircle, User, LayoutDashboard, Package, Inbox } from 'lucide-react';
import type { AppMode } from '@/types';

export type NavBadgeKey = 'cart' | 'chat' | 'requests';

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  badgeKey?: NavBadgeKey;
}

export const buyerNav: NavItem[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart', badgeKey: 'cart' },
  { to: '/chat', icon: MessageCircle, label: 'Chat', badgeKey: 'chat' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export const sellerNav: NavItem[] = [
  { to: '/seller', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/seller/inventory', icon: Package, label: 'Inventory' },
  { to: '/seller/requests', icon: Inbox, label: 'Requests', badgeKey: 'requests' },
  { to: '/chat', icon: MessageCircle, label: 'Chat', badgeKey: 'chat' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function getNavItems(mode: AppMode): NavItem[] {
  return mode === 'seller' ? sellerNav : buyerNav;
}

export const adminNav: NavItem[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/verifications', icon: Inbox, label: 'Verifications' },
  { to: '/admin/reports', icon: Package, label: 'Reports' },
];
