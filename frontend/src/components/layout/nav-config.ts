import type { LucideIcon } from 'lucide-react';
import { Home, ShoppingCart, Package, MessageCircle, User, LayoutDashboard, Inbox } from 'lucide-react';
import type { AppMode } from '@/types';

export type NavBadgeKey = 'cart' | 'chat' | 'requests';

export type NavLabelKey = 'feed' | 'cart' | 'inventory' | 'chat' | 'profile';

export interface NavItem {
  to: string;
  icon: LucideIcon;
  labelKey: NavLabelKey;
  badgeKey?: NavBadgeKey;
  /** Match nested routes (e.g. /seller for dashboard) */
  matchPrefix?: boolean;
}

/** PRD: Feed, Cart, Inventory, Chat, Profile */
export const buyerNav: NavItem[] = [
  { to: '/', icon: Home, labelKey: 'feed', matchPrefix: false },
  { to: '/cart', icon: ShoppingCart, labelKey: 'cart', badgeKey: 'cart' },
  { to: '/search', icon: Package, labelKey: 'inventory' },
  { to: '/chat', icon: MessageCircle, labelKey: 'chat', badgeKey: 'chat' },
  { to: '/profile', icon: User, labelKey: 'profile' },
];

export const sellerNav: NavItem[] = [
  { to: '/seller', icon: LayoutDashboard, labelKey: 'feed', matchPrefix: true },
  { to: '/cart', icon: ShoppingCart, labelKey: 'cart', badgeKey: 'cart' },
  { to: '/seller/inventory', icon: Package, labelKey: 'inventory', badgeKey: 'requests', matchPrefix: true },
  { to: '/chat', icon: MessageCircle, labelKey: 'chat', badgeKey: 'chat' },
  { to: '/profile', icon: User, labelKey: 'profile' },
];

export function getNavItems(mode: AppMode): NavItem[] {
  return mode === 'seller' ? sellerNav : buyerNav;
}

export type AdminLabelKey = 'dashboard' | 'verifications' | 'reports';

export interface AdminNavItem {
  to: string;
  icon: LucideIcon;
  labelKey: AdminLabelKey;
}

export const adminNav: AdminNavItem[] = [
  { to: '/admin', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/admin/verifications', icon: Inbox, labelKey: 'verifications' },
  { to: '/admin/reports', icon: Package, labelKey: 'reports' },
];

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.to === '/') return pathname === '/';
  if (item.matchPrefix) return pathname === item.to || pathname.startsWith(`${item.to}/`);
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
