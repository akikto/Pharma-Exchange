import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types';
import type { NotificationPrefs } from '@/lib/notification-prefs';

export interface UpdateProfileInput {
  language?: 'en' | 'bn';
  theme?: 'light' | 'dark' | 'system';
  notificationPrefs?: Partial<NotificationPrefs>;
}

export function useUpdateProfile() {
  const setUser = (user: User) => useAuthStore.setState({ user, isAuthenticated: true });

  return useMutation({
    mutationFn: (body: UpdateProfileInput) => apiClient.patch<User>('/auth/me', body),
    onSuccess: (user) => setUser(user),
  });
}
