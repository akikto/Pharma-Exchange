import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

/** Role for cart hub tabs — seller routes use /seller/*; /cart is always buyer context */
export function useHubRole(): 'buyer' | 'seller' {
  const { pathname } = useLocation();
  if (pathname.startsWith('/seller')) return 'seller';
  if (pathname.startsWith('/cart')) return 'buyer';
  const mode = useAuthStore((s) => s.mode);
  return mode === 'seller' ? 'seller' : 'buyer';
}
