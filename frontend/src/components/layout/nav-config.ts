import type { LucideIcon } from 'lucide-react';
import {
  Home, ShoppingCart, Package, MessageCircle, User, LayoutDashboard, Inbox, Heart, CreditCard, Pill, Image, Store, Bell,
} from 'lucide-react';
import type { AppMode } from '@/types';

export type NavBadgeKey = 'cart' | 'chat' | 'requests' | 'watchlist';

export type NavLabelKey = 'home' | 'dashboard' | 'cart' | 'inventory' | 'chat' | 'profile' | 'orders' | 'watchlist';

export interface NavItem {
  to: string;
  icon: LucideIcon;
  labelKey: NavLabelKey;
  badgeKey?: NavBadgeKey;
  /** Match nested routes (e.g. /seller for dashboard) */
  matchPrefix?: boolean;
}

/** PRD: Home, Cart, Watchlist, Chat, Profile */
export const buyerNav: NavItem[] = [
  { to: '/', icon: Home, labelKey: 'home', matchPrefix: false },
  { to: '/cart', icon: ShoppingCart, labelKey: 'cart', badgeKey: 'cart' },
  { to: '/watchlist', icon: Heart, labelKey: 'watchlist', badgeKey: 'watchlist' },
  { to: '/chat', icon: MessageCircle, labelKey: 'chat', badgeKey: 'chat' },
  { to: '/profile', icon: User, labelKey: 'profile' },
];

export const sellerNav: NavItem[] = [
  { to: '/seller', icon: LayoutDashboard, labelKey: 'dashboard', matchPrefix: true },
  { to: '/seller/orders', icon: Inbox, labelKey: 'orders', badgeKey: 'requests' },
  { to: '/seller/inventory', icon: Package, labelKey: 'inventory', matchPrefix: true },
  { to: '/chat', icon: MessageCircle, labelKey: 'chat', badgeKey: 'chat' },
  { to: '/profile', icon: User, labelKey: 'profile' },
];

export function getNavItems(mode: AppMode): NavItem[] {
  return mode === 'seller' ? sellerNav : buyerNav;
}

export type AdminLabelKey = 'dashboard' | 'sellers' | 'verifications' | 'reports' | 'payments' | 'medicines' | 'banners';

export interface AdminNavItem {
  to: string;
  icon: LucideIcon;
  labelKey: AdminLabelKey;
}

export const adminNav: AdminNavItem[] = [
  { to: '/admin', icon: LayoutDashboard, labelKey: 'dashboard' },
  { to: '/admin/sellers', icon: Store, labelKey: 'sellers' },
  { to: '/admin/verifications', icon: Inbox, labelKey: 'verifications' },
  { to: '/admin/medicines', icon: Pill, labelKey: 'medicines' },
  { to: '/admin/banners', icon: Image, labelKey: 'banners' },
  { to: '/admin/reports', icon: Package, labelKey: 'reports' },
  { to: '/admin/payments', icon: CreditCard, labelKey: 'payments' },
];

export type AdminBottomLabelKey = 'adminHome' | 'sellers' | 'verifications' | 'medicines' | 'notifications';

export interface AdminBottomNavItem {
  to: string;
  icon: LucideIcon;
  labelKey: AdminBottomLabelKey;
  /** When true, only an exact pathname match counts as active (e.g. Admin Dashboard). */
  end?: boolean;
}

/** Primary admin destinations for mobile bottom navigation (Home = Admin Dashboard). */
export const adminBottomNav: AdminBottomNavItem[] = [
  { to: '/admin', icon: Home, labelKey: 'adminHome', end: true },
  { to: '/admin/sellers', icon: Store, labelKey: 'sellers' },
  { to: '/admin/verifications', icon: Inbox, labelKey: 'verifications' },
  { to: '/admin/medicines', icon: Pill, labelKey: 'medicines' },
  { to: '/admin/notifications', icon: Bell, labelKey: 'notifications' },
];

export function isAdminNavItemActive(pathname: string, item: Pick<AdminNavItem, 'to'>): boolean {
  if (item.to === '/admin') return pathname === '/admin';
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function isAdminBottomNavItemActive(pathname: string, item: AdminBottomNavItem): boolean {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.to === '/') return pathname === '/';
  if (item.matchPrefix) return pathname === item.to || pathname.startsWith(`${item.to}/`);
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}
