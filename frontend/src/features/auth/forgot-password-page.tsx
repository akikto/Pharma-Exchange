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

type Step = 'phone' | 'reset';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const sendOtp = useAuthStore((s) => s.sendOtp);
  const resendOtp = useAuthStore((s) => s.resendOtp);
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const phoneSchema = z.object({
    phone: z.string().min(10, t('validation.phone')),
  });

  const resetSchema = z.object({
    code: z.string().regex(/^\d{4,9}$/, t('validation.otp')),
    newPassword: z.string().min(8, t('validation.passwordMin')),
  });

  type PhoneForm = z.infer<typeof phoneSchema>;
  type ResetForm = z.infer<typeof resetSchema>;

  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const onSendOtp = async (data: PhoneForm) => {
    setLoading(true);
    setError('');
    try {
      await sendOtp({ phone: data.phone.trim(), purpose: 'password_reset' });
      setPhone(data.phone.trim());
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (data: ResetForm) => {
    setLoading(true);
    setError('');
    try {
      await resetPassword(phone, data.code, data.newPassword);
      navigate('/login');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError(t('auth.phoneNotFound'));
      } else {
        setError(err instanceof Error ? err.message : t('auth.resetFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      await resendOtp({ phone });
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

        {step === 'phone' ? (
          <form onSubmit={phoneForm.handleSubmit(onSendOtp)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth.phone')}</Label>
              <Input id="phone" type="tel" autoComplete="tel" {...phoneForm.register('phone')} />
              {phoneForm.formState.errors.phone && (
                <p className="text-xs text-danger">{phoneForm.formState.errors.phone.message}</p>
              )}
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.sendResetOtp')}</Button>
          </form>
        ) : (
          <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
            <p className="text-sm text-text-secondary">{t('auth.verifyOtpDesc', { contact: phone })}</p>
            <div className="space-y-2">
              <Label htmlFor="code">{t('auth.otpCode')}</Label>
              <Input id="code" inputMode="numeric" autoComplete="one-time-code" {...resetForm.register('code')} />
              {resetForm.formState.errors.code && (
                <p className="text-xs text-danger">{resetForm.formState.errors.code.message}</p>
              )}
            </div>
            <PasswordInput
              id="newPassword"
              label={t('auth.newPassword')}
              autoComplete="new-password"
              error={resetForm.formState.errors.newPassword?.message}
              {...resetForm.register('newPassword')}
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.updatePassword')}</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={handleResend} disabled={loading}>
              {t('auth.resendOtp')}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-text-secondary">
          <Link to="/login" className="text-primary font-medium">{t('auth.backToLogin')}</Link>
        </p>
      </div>
    </div>
  );
}
