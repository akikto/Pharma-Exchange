import type { AppMode, User } from '@/types';

export function isApprovedSeller(user: User | null | undefined): boolean {
  return user?.pharmacy?.verificationStatus === 'APPROVED';
}

export function isAdminUser(user: User | null | undefined): boolean {
  return user?.role === 'ADMIN';
}

/** Default landing route after auth, based on role and mode. */
export function getPostLoginRoute(user: User | null | undefined, mode: AppMode): string {
  if (isAdminUser(user)) return '/admin';
  if (mode === 'seller' && isApprovedSeller(user)) return '/seller';
  return '/';
}

/** @deprecated Use getPostLoginRoute with user context */
export function getAppHomeRoute(mode: AppMode): string {
  return mode === 'seller' ? '/seller' : '/';
}
