import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/logo';
import { useAuthStore } from '@/stores/auth-store';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const forgotPassword = useAuthStore((s) => s.forgotPassword);

  const schema = z.object({
    email: z.string().email(t('validation.email')),
  });

  type Form = z.infer<typeof schema>;
  const form = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    setError('');
    try {
      await forgotPassword(data.email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col p-6 max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center gap-6">
        <Logo size="xl" className="justify-center" />
        <div className="text-center">
          <h1 className="text-xl font-bold">{t('auth.resetPasswordTitle')}</h1>
          <p className="text-sm text-text-secondary mt-1">{t('auth.resetPasswordDesc')}</p>
        </div>

        {sent ? (
          <p className="text-sm text-text-secondary text-center" data-testid="forgot-password-sent">
            {t('auth.resetEmailSent')}
          </p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="forgot-password-form">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="text-xs text-danger">{form.formState.errors.email.message}</p>
              )}
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.sendResetEmail')}</Button>
          </form>
        )}

        <p className="text-center text-sm text-text-secondary">
          <Link to="/login" className="text-primary font-medium">{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
