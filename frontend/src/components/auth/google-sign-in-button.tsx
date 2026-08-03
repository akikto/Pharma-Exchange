import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { signInWithGoogle, isFirebaseConfigured } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';

interface GoogleSignInButtonProps {
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const loginWithFirebase = useAuthStore((s) => s.loginWithFirebase);
  const [loading, setLoading] = useState(false);

  if (!isFirebaseConfigured()) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
      await loginWithFirebase(idToken);
      toast({ description: t('toast.loginSuccess') });
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.loginFailed');
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full"
      loading={loading}
      onClick={() => void handleClick()}
      data-testid="google-sign-in"
    >
      {t('auth.continueGoogle')}
    </Button>
  );
}
