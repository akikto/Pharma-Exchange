import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { isPushConfigured } from '@/lib/firebase';
import {
  getNotificationPermission,
  registerFcmTokenWithBackend,
  requestNotificationPermission,
  subscribeToForegroundPush,
} from '@/lib/push-notifications';
import { getNotificationRoute } from '@/lib/notification-routes';
import { dismissPushPrompt, isPushPromptDismissed } from '@/lib/push-device';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [permission, setPermission] = useState(getNotificationPermission());
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !isPushConfigured()) return;
    void registerFcmTokenWithBackend().catch(() => undefined);
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !isPushConfigured()) return;

    let unsubscribe: (() => void) | undefined;
    void subscribeToForegroundPush((payload) => {
      const title = payload.notification?.title ?? payload.data?.title;
      const body = payload.notification?.body ?? payload.data?.body;
      const route = getNotificationRoute(payload.data);
      if (title || body) {
        toast({
          title,
          description: body,
          onClick: route ? () => navigate(route) : undefined,
        });
      }
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => unsubscribe?.();
  }, [isAuthenticated, isLoading, navigate, qc, toast]);

  useEffect(() => {
    if (!isAuthenticated || !isPushConfigured() || isPushPromptDismissed()) {
      setShowPrompt(false);
      return;
    }
    const current = getNotificationPermission();
    setPermission(current);
    setShowPrompt(current === 'default');
  }, [isAuthenticated]);

  const enablePush = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      await registerFcmTokenWithBackend();
      setShowPrompt(false);
      return true;
    }
    if (result === 'denied') {
      dismissPushPrompt();
      setShowPrompt(false);
    }
    return false;
  }, []);

  const dismissPrompt = useCallback(() => {
    dismissPushPrompt();
    setShowPrompt(false);
  }, []);

  return {
    permission,
    showPrompt,
    enablePush,
    dismissPrompt,
    isConfigured: isPushConfigured(),
  };
}
