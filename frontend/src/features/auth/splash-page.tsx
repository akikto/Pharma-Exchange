import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLogo } from '@/components/brand/app-logo';
import { useAuthStore } from '@/stores/auth-store';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary px-6">
      <AppLogo variant="logo" onDark size="xl" showName className="text-white" />
      {isLoading && <p className="text-xs mt-6 text-white/75">Loading...</p>}
    </div>
  );
}
