import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/auth/password-input';
import { Logo } from '@/components/brand/logo';
import { useAuthStore } from '@/stores/auth-store';

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const schema = z.object({
    newPassword: z.string().min(8, t('validation.passwordMin')),
    confirmPassword: z.string().min(8, t('validation.passwordMin')),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('auth.passwordMismatch'),
    path: ['confirmPassword'],
  });

  type Form = z.infer<typeof schema>;
  const form = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    if (!token) {
      setError(t('auth.resetTokenMissing'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(token, data.newPassword);
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col p-6 max-w-md mx-auto justify-center gap-4">
        <Logo size="xl" className="justify-center" />
        <p className="text-center text-sm text-danger">{t('auth.resetTokenMissing')}</p>
        <Button asChild className="w-full">
          <Link to="/forgot-password">{t('auth.requestNewResetLink')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-6 max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center gap-6">
        <Logo size="xl" className="justify-center" />
        <div className="text-center">
          <h1 className="text-xl font-bold">{t('auth.setNewPasswordTitle')}</h1>
          <p className="text-sm text-text-secondary mt-1">{t('auth.setNewPasswordDesc')}</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="reset-password-form">
          <PasswordInput
            id="newPassword"
            label={t('auth.newPassword')}
            autoComplete="new-password"
            error={form.formState.errors.newPassword?.message}
            {...form.register('newPassword')}
          />
          <PasswordInput
            id="confirmPassword"
            label={t('auth.confirmPassword')}
            autoComplete="new-password"
            error={form.formState.errors.confirmPassword?.message}
            {...form.register('confirmPassword')}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.updatePassword')}</Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          <Link to="/login" className="text-primary font-medium">{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
