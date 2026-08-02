import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AppMode } from '@/types';
import { apiClient, setTokens, clearTokens, loadRefreshToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mode: AppMode;
  hasSeenOnboarding: boolean;
  login: (emailOrPhone: string, password: string, isEmail: boolean) => Promise<void>;
  loginWithFirebase: (idToken: string, firstName?: string, lastName?: string) => Promise<void>;
  register: (data: { email?: string; phone?: string; password: string; firstName: string; lastName: string }) => Promise<{ devOtp?: string }>;
  verifyOtp: (data: { phone?: string; email?: string; code: string; purpose: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setMode: (mode: AppMode) => void;
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
      hasSeenOnboarding: false,

      login: async (emailOrPhone, password, isEmail) => {
        const body = isEmail
          ? { email: emailOrPhone, password }
          : { phone: emailOrPhone, password };
        const data = await apiClient.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/login', body);
        setTokens(data.accessToken, data.refreshToken);
        set({ user: data.user, isAuthenticated: true });
      },

      loginWithFirebase: async (idToken, firstName, lastName) => {
        const data = await apiClient.post<{ accessToken: string; refreshToken: string; user: User }>('/auth/firebase', { idToken, firstName, lastName });
        setTokens(data.accessToken, data.refreshToken);
        set({ user: data.user, isAuthenticated: true });
      },

      register: async (data) => {
        const result = await apiClient.post<{ devOtp?: string }>('/auth/register', data);
        return result;
      },

      verifyOtp: async (data) => {
        const result = await apiClient.post<{ accessToken?: string; refreshToken?: string; user?: User }>('/auth/verify-otp', data);
        if (result.accessToken && result.refreshToken) {
          setTokens(result.accessToken, result.refreshToken);
          await get().fetchProfile();
        }
      },

      logout: async () => {
        try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
        clearTokens();
        set({ user: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        const user = await apiClient.get<User>('/auth/me');
        set({ user, isAuthenticated: true });
      },

      setMode: (mode) => set({ mode }),
      setOnboardingSeen: () => set({ hasSeenOnboarding: true }),

      initialize: async () => {
        set({ isLoading: true });
        const token = loadRefreshToken();
        if (token) {
          try {
            const data = await apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken: token });
            setTokens(data.accessToken, data.refreshToken);
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
      }),
    }
  )
);
