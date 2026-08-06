import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AppMode } from '@/types';
import { disconnectSocket, connectSocket } from '@/lib/socket';
import { apiClient, setTokens, clearTokens, loadRefreshToken } from '@/lib/api';
import { unregisterFcmTokenFromBackend } from '@/lib/push-notifications';
import { isApprovedSeller, isAdminUser } from '@/lib/auth-utils';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: AppMode;
  modeUserSet: boolean;
  hasSeenOnboarding: boolean;
  login: (emailOrPhone: string, password: string, isEmail: boolean) => Promise<void>;
  demoLogin: () => Promise<{ isDemo?: boolean }>;
  loginWithFirebase: (idToken: string, firstName?: string, lastName?: string) => Promise<void>;
  register: (data: { email?: string; phone?: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setMode: (mode: AppMode, options?: { userSet?: boolean }) => void;
  applyPostLoginMode: () => void;
  setOnboardingSeen: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      mode: 'buyer',
      modeUserSet: false,
      hasSeenOnboarding: false,

      login: async (emailOrPhone, password, isEmail) => {
        const body = isEmail
          ? { email: emailOrPhone, password }
          : { phone: emailOrPhone, password };
        const data = await apiClient.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', body);
        setTokens(data.accessToken, data.refreshToken);
        set({ user: data.user, isAuthenticated: true });
        connectSocket();
        get().applyPostLoginMode();
      },

      demoLogin: async () => {
        const data = await apiClient.post<{ accessToken: string; refreshToken: string; user: User; isDemo?: boolean }>('/auth/demo-login', {});
        setTokens(data.accessToken, data.refreshToken);
        set({ user: data.user, isAuthenticated: true });
        connectSocket();
        await get().fetchProfile();
        get().applyPostLoginMode();
        return { isDemo: data.isDemo };
      },

      loginWithFirebase: async (idToken, firstName, lastName) => {
        const data = await apiClient.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/firebase', { idToken, firstName, lastName });
        setTokens(data.accessToken, data.refreshToken);
        set({ user: data.user, isAuthenticated: true });
        connectSocket();
        get().applyPostLoginMode();
      },

      register: async (data) => {
        const result = await apiClient.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/register', data);
        setTokens(result.accessToken, result.refreshToken);
        set({ user: result.user, isAuthenticated: true });
        connectSocket();
        get().applyPostLoginMode();
      },

      forgotPassword: async (email) => {
        return apiClient.post<{ message: string }>('/auth/forgot-password', { email });
      },

      resetPassword: async (token, newPassword) => {
        await apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword });
      },

      logout: async () => {
        await unregisterFcmTokenFromBackend();
        try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
        disconnectSocket();
        clearTokens();
        set({ user: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        const user = await apiClient.get<User>('/auth/me');
        set({ user, isAuthenticated: true });
        get().applyPostLoginMode();
      },

      setMode: (mode, options) => set({
        mode,
        ...(options?.userSet ? { modeUserSet: true } : {}),
      }),

      applyPostLoginMode: () => {
        const { user, modeUserSet } = get();
        if (isAdminUser(user)) {
          set({ mode: 'buyer' });
          return;
        }
        if (isApprovedSeller(user) && !modeUserSet) {
          set({ mode: 'seller' });
        } else if (!isApprovedSeller(user) && !modeUserSet) {
          set({ mode: 'buyer' });
        }
      },

      setOnboardingSeen: () => set({ hasSeenOnboarding: true }),

      initialize: async () => {
        set({ isLoading: true });
        const token = loadRefreshToken();
        if (token) {
          try {
            const data = await apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken: token });
            setTokens(data.accessToken, data.refreshToken);
            connectSocket();
            await get().fetchProfile();
          } catch {
            clearTokens();
            set({ user: null, isAuthenticated: false });
          }
        }
        set({ isLoading: false });
      },
    }),
    {
      name: 'pharmex-auth',
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
        mode: state.mode,
        modeUserSet: state.modeUserSet,
      }),
    }
  )
);
