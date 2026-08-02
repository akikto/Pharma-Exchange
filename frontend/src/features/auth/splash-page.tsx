import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

export function SplashPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, hasSeenOnboarding } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) return;
      if (isAuthenticated) navigate('/', { replace: true });
      else if (!hasSeenOnboarding) navigate('/onboarding', { replace: true });
      else navigate('/login', { replace: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, hasSeenOnboarding, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary">
      <div className="text-white text-center">
        <div className="text-5xl font-bold mb-2">PharmEx</div>
        <p className="text-primary-subtle text-sm">B2B Pharmacy Marketplace</p>
      </div>
    </div>
  );
}
