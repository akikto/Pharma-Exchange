import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/auth/password-input';
import { Logo } from '@/components/brand/logo';
import { useAuthStore } from '@/stores/auth-store';
import { ApiError } from '@/lib/api';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const schema = z.object({
    email: z.string().email(t('validation.email')),
    newPassword: z.string().min(8, t('validation.passwordMin')),
  });

  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await resetPassword(data.email.trim(), data.newPassword);
      navigate('/login');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError(t('auth.emailNotFound'));
      } else {
        setError(err instanceof Error ? err.message : t('auth.resetFailed'));
      }
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>
          <PasswordInput
            id="newPassword"
            label={t('auth.newPassword')}
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
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
