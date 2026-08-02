import { useLocation } from 'react-router-dom';

export function usePageRole(): 'buyer' | 'seller' {
  const { pathname } = useLocation();
  return pathname.startsWith('/seller') ? 'seller' : 'buyer';
}
