import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppRouter } from '@/app/router';
import { useAuthStore } from '@/stores/auth-store';
import { setUnauthorizedHandler } from '@/lib/api';
import { useThemeStore } from '@/stores/theme-store';
import { Toaster } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { prefetchCloudData } from '@/lib/cloud-sync';
import { migrateLegacyLocalStorage } from '@/lib/local-db';
import { useOnlineStatus } from '@/hooks/use-online-status';
import i18n from '@/i18n';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const logout = useAuthStore((s) => s.logout);
  const setTheme = useThemeStore((s) => s.setTheme);
  const theme = useThemeStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
    void migrateLegacyLocalStorage();
    initialize();
  }, [initialize, logout]);

  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  useEffect(() => {
    if (user?.language === 'bn' || user?.language === 'en') {
      void i18n.changeLanguage(user.language);
    }
    if (user?.theme === 'light' || user?.theme === 'dark' || user?.theme === 'system') {
      useThemeStore.getState().setTheme(user.theme);
    }
  }, [user?.language, user?.theme]);

  useEffect(() => {
    if (isLoading || !isOnline) return;
    void prefetchCloudData(queryClient, { isAuthenticated });
  }, [isLoading, isAuthenticated, isOnline]);

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
