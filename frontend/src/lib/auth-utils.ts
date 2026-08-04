import type { AppMode, User } from '@/types';

export function isApprovedSeller(user: User | null | undefined): boolean {
  return user?.pharmacy?.verificationStatus === 'APPROVED';
}

export function getAppHomeRoute(mode: AppMode): string {
  return mode === 'seller' ? '/seller' : '/';
}
