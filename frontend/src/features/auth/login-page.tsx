import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { ApiError } from '@/lib/api';
import { Logo } from '@/components/brand/logo';
import { useToast } from '@/hooks/use-toast';

export function LoginPage() {
  const { t } = useTranslation();
  const [isEmail, setIsEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const { toast } = useToast();

  const schema = z.object({
    identifier: z.string().min(1, t('validation.required')),
    password: z.string().min(8, t('validation.passwordMin')),
  });

  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const useEmail = isEmail || data.identifier.includes('@');
      await login(data.identifier.trim(), data.password, useEmail);
      toast({ description: t('toast.loginSuccess') });
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RATE_LIMIT_EXCEEDED') {
        setError(err.message);
      } else if (err instanceof ApiError && err.message === 'Invalid credentials') {
        setError(t('auth.invalidCredentials'));
      } else {
        setError(err instanceof Error ? err.message : t('auth.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col p-6 max-w-md mx-auto edge-to-edge">
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div className="text-center flex flex-col items-center gap-3">
          <Logo size="xl" className="justify-center" />
          <p className="text-text-secondary">{t('auth.signInDesc')}</p>
          <p className="text-xs text-text-disabled">{t('auth.signInDescSub')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="login-form">
          <div className="flex gap-2 p-1 bg-surface-sunken rounded-[var(--radius-md)]">
            <button type="button" className={`flex-1 py-2 text-sm rounded-[var(--radius-sm)] ${isEmail ? 'bg-surface-base shadow-sm font-medium' : ''}`} onClick={() => setIsEmail(true)}>{t('auth.email')}</button>
            <button type="button" className={`flex-1 py-2 text-sm rounded-[var(--radius-sm)] ${!isEmail ? 'bg-surface-base shadow-sm font-medium' : ''}`} onClick={() => setIsEmail(false)}>{t('auth.phone')}</button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifier">{isEmail ? t('auth.email') : t('auth.phone')}</Label>
            <Input
              id="identifier"
              type={isEmail ? 'email' : 'tel'}
              autoComplete={isEmail ? 'email' : 'tel'}
              placeholder={isEmail ? 'admin@pharmex.bd' : '+8801XXXXXXXXX'}
              {...register('identifier')}
            />
            {errors.identifier && <p className="text-xs text-danger">{errors.identifier.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                minLength={8}
                placeholder={t('auth.passwordMin')}
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-secondary"
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <p className="text-right text-sm">
            <Link to="/forgot-password" className="text-primary font-medium">{t('auth.forgotPassword')}</Link>
          </p>

          <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.signIn')}</Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-surface-base px-2 text-text-secondary">{t('common.or')}</span></div>
        </div>

        <Button variant="secondary" className="w-full" onClick={() => navigate('/otp')}>
          {t('auth.continueOtp')}
        </Button>

        <p className="text-center text-xs text-text-secondary">{t('auth.correctSite')}</p>

        <p className="text-center text-sm text-text-secondary">
          {t('auth.newPharmacy')} <Link to="/register" className="text-primary font-medium">{t('auth.createAccount')}</Link>
        </p>
      </div>
    </div>
  );
}
