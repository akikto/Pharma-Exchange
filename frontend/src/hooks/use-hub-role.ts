import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

/** Role for cart hub tabs — respects seller routes and seller mode on /cart */
export function useHubRole(): 'buyer' | 'seller' {
  const { pathname } = useLocation();
  const mode = useAuthStore((s) => s.mode);
  if (pathname.startsWith('/seller')) return 'seller';
  return mode === 'seller' ? 'seller' : 'buyer';
}
