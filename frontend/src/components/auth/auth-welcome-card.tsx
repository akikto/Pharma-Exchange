import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

interface AuthWelcomeCardProps {
  user: User;
  isDemo?: boolean;
  onContinue: () => void;
}

export function AuthWelcomeCard({ user, isDemo, onContinue }: AuthWelcomeCardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6" data-testid="auth-welcome-card">
      <div className="text-center flex flex-col items-center gap-3">
        <div className="h-16 w-16 rounded-full bg-primary-subtle flex items-center justify-center text-2xl font-bold text-primary">
          {user.firstName?.[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold">{t('auth.welcomeTitle', { name: user.firstName })}</h1>
          <p className="text-sm text-text-secondary mt-1">{user.email || user.phone}</p>
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 space-y-2 text-sm">
        {isDemo && (
          <p className="text-xs text-warning bg-warning/10 rounded-[var(--radius-sm)] px-2 py-1">
            {t('auth.demoModeHint')}
          </p>
        )}
        <div className="flex justify-between gap-4">
          <span className="text-text-secondary">{t('auth.accountRole')}</span>
          <span className="font-medium capitalize">{user.role?.toLowerCase() ?? 'buyer'}</span>
        </div>
        {user.pharmacy ? (
          <div className="flex justify-between gap-4">
            <span className="text-text-secondary">{t('auth.pharmacyStatus')}</span>
            <span className="font-medium">{user.pharmacy.name} · {user.pharmacy.verificationStatus}</span>
          </div>
        ) : (
          <p className="text-text-secondary">{t('auth.noPharmacyYet')}</p>
        )}
      </div>

      <Button className="w-full" size="lg" onClick={onContinue}>
        {t('auth.continueToApp')}
      </Button>
    </div>
  );
}
