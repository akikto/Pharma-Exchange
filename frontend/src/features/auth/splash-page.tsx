import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Logo } from '@/components/brand/logo';

export function SplashPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, hasSeenOnboarding } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (isAuthenticated) navigate('/', { replace: true });
      else if (!hasSeenOnboarding) navigate('/onboarding', { replace: true });
      else navigate('/login', { replace: true });
    }, 800);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, hasSeenOnboarding, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#0F4C6E] via-[#0F766E] to-[#166534] px-6">
      <Logo size="hero" className="justify-center" />
      <p className="text-white/85 text-sm mt-6">B2B Pharmacy Marketplace</p>
      {isLoading && <p className="text-xs mt-4 text-white/70">Loading...</p>}
    </div>
  );
}
