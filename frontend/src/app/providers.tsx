import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppRouter } from '@/app/router';
import { useAuthStore } from '@/stores/auth-store';
import { setUnauthorizedHandler } from '@/lib/api';
import { useThemeStore } from '@/stores/theme-store';
import { Toaster } from '@/hooks/use-toast';
import i18n from '@/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

function AppInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const logout = useAuthStore((s) => s.logout);
  const setTheme = useThemeStore((s) => s.setTheme);
  const theme = useThemeStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    initialize();
  }, [initialize, logout]);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  useEffect(() => {
    if (user?.language === 'bn' || user?.language === 'en') {
      void i18n.changeLanguage(user.language);
    }
  }, [user?.language]);

  return <>{children}</>;
}

export function AppProviders() {
  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppInitializer>
            <AppRouter />
            <Toaster />
          </AppInitializer>
        </QueryClientProvider>
      </ErrorBoundary>
    </I18nextProvider>
  );
}
