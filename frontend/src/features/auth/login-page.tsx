import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/auth/password-input';
import { AuthWelcomeCard } from '@/components/auth/auth-welcome-card';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { useAuthStore } from '@/stores/auth-store';
import { ApiError } from '@/lib/api';
import { getPostLoginRoute } from '@/lib/auth-utils';
import { Logo } from '@/components/brand/logo';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types';

type AuthTab = 'signIn' | 'register';

export function LoginPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<AuthTab>(searchParams.get('tab') === 'register' ? 'register' : 'signIn');
  const [isEmail, setIsEmail] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<User | null>(null);
  const [isDemoSession, setIsDemoSession] = useState(false);
  const [registerStep, setRegisterStep] = useState<'form' | 'otp'>('form');
  const [contact, setContact] = useState<{ email?: string; phone?: string }>({});
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const demoLogin = useAuthStore((s) => s.demoLogin);
  const registerUser = useAuthStore((s) => s.register);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get('tab') === 'register') setTab('register');
  }, [searchParams]);

  const loginSchema = z.object({
    identifier: z.string().min(1, t('validation.required')),
    password: z.string().min(8, t('validation.passwordMin')),
  });

  const registerSchema = z.object({
    firstName: z.string().min(1, t('validation.required')),
    lastName: z.string().min(1, t('validation.required')),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().min(10).optional().or(z.literal('')),
    password: z.string().min(8, t('validation.passwordMin')),
  }).refine((d) => d.email || d.phone, { message: t('validation.emailOrPhone') });

  const otpSchema = z.object({ code: z.string().length(6, t('auth.otpLength')) });

  type LoginForm = z.infer<typeof loginSchema>;
  type RegisterForm = z.infer<typeof registerSchema>;
  type OtpForm = z.infer<typeof otpSchema>;

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  const showWelcome = async (demo = false) => {
    await fetchProfile();
    const profile = useAuthStore.getState().user;
    if (profile) {
      setWelcomeUser(profile);
      setIsDemoSession(demo);
    } else {
      const { user, mode } = useAuthStore.getState();
      navigate(getPostLoginRoute(user, mode));
    }
  };

  const onLogin = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    try {
      const useEmail = isEmail || data.identifier.includes('@');
      await login(data.identifier.trim(), data.password, useEmail);
      toast({ description: t('toast.loginSuccess') });
      await showWelcome();
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

  const onRegister = async (data: RegisterForm) => {
    setLoading(true);
    setError('');
    try {
      const result = await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        password: data.password,
      });
      if (result.requiresOtpVerification) {
        setContact({ email: data.email || undefined, phone: data.phone || undefined });
        setRegisterStep('otp');
        return;
      }
      toast({ description: t('toast.loginSuccess') });
      await showWelcome();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CONFLICT') {
        setError(t('auth.accountExists'));
      } else {
        setError(err instanceof Error ? err.message : t('auth.registerFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (data: OtpForm) => {
    setLoading(true);
    setError('');
    try {
      if (!contact.phone) {
        setError(t('auth.otpFailed'));
        return;
      }
      await verifyOtp({ phone: contact.phone, code: data.code, purpose: 'registration' });
      toast({ description: t('toast.loginSuccess') });
      await showWelcome();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.otpFailed'));
    } finally {
      setLoading(false);
    }
  };

  const onDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await demoLogin();
      toast({ description: t('auth.demoLoginSuccess') });
      await showWelcome(Boolean(result.isDemo));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (welcomeUser) {
    return (
      <div className="flex min-h-screen w-full max-w-md min-w-0 flex-col box-border overflow-x-hidden py-6 mx-auto edge-to-edge justify-center">
        <AuthWelcomeCard
          user={welcomeUser}
          isDemo={isDemoSession}
          onContinue={() => {
            const { user, mode } = useAuthStore.getState();
            navigate(getPostLoginRoute(user, mode));
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full max-w-md min-w-0 flex-col box-border overflow-x-hidden py-6 mx-auto edge-to-edge">
      <div className="flex w-full min-w-0 flex-1 flex-col justify-center gap-6">
        <div className="text-center flex flex-col items-center gap-3">
          <Logo size="xl" className="justify-center" />
          <p className="text-text-secondary">{tab === 'signIn' ? t('auth.signInDesc') : t('auth.createAccountDesc')}</p>
        </div>

        <div className="flex w-full min-w-0 gap-2 p-1 bg-surface-sunken rounded-[var(--radius-md)]" data-testid="auth-tabs">
          <button
            type="button"
            className={`min-w-0 flex-1 truncate px-2 py-2 text-sm rounded-[var(--radius-sm)] ${tab === 'signIn' ? 'bg-surface-base shadow-sm font-medium' : ''}`}
            onClick={() => { setTab('signIn'); setError(''); setRegisterStep('form'); }}
          >
            {t('auth.signIn')}
          </button>
          <button
            type="button"
            className={`min-w-0 flex-1 truncate px-2 py-2 text-sm rounded-[var(--radius-sm)] ${tab === 'register' ? 'bg-surface-base shadow-sm font-medium' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            {t('auth.createAccount')}
          </button>
        </div>

        {tab === 'signIn' ? (
          <form onSubmit={loginForm.handleSubmit(onLogin)} className="w-full min-w-0 space-y-4" data-testid="login-form">
            <div className="flex w-full min-w-0 gap-2 p-1 bg-surface-sunken rounded-[var(--radius-md)]">
              <button type="button" className={`min-w-0 flex-1 truncate px-2 py-2 text-sm rounded-[var(--radius-sm)] ${isEmail ? 'bg-surface-base shadow-sm font-medium' : ''}`} onClick={() => setIsEmail(true)}>{t('auth.email')}</button>
              <button type="button" className={`min-w-0 flex-1 truncate px-2 py-2 text-sm rounded-[var(--radius-sm)] ${!isEmail ? 'bg-surface-base shadow-sm font-medium' : ''}`} onClick={() => setIsEmail(false)}>{t('auth.phone')}</button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier">{isEmail ? t('auth.email') : t('auth.phone')}</Label>
              <Input
                id="identifier"
                type={isEmail ? 'email' : 'tel'}
                autoComplete={isEmail ? 'email' : 'tel'}
                placeholder={isEmail ? 'buyer@pharmex.bd' : '+8801XXXXXXXXX'}
                {...loginForm.register('identifier')}
              />
              {loginForm.formState.errors.identifier && (
                <p className="text-xs text-danger">{loginForm.formState.errors.identifier.message}</p>
              )}
            </div>

            <PasswordInput
              id="password"
              label={t('auth.password')}
              autoComplete="current-password"
              placeholder={t('auth.passwordMin')}
              error={loginForm.formState.errors.password?.message}
              {...loginForm.register('password')}
            />

            {error && <p className="text-sm text-danger">{error}</p>}

            <p className="text-end text-sm">
              <Link to="/forgot-password" className="text-primary font-medium" dir="ltr">
                {t('auth.forgotPassword')}
              </Link>
            </p>

            <Button type="submit" className="w-full max-w-full" size="lg" loading={loading}>{t('auth.signIn')}</Button>
          </form>
        ) : registerStep === 'otp' ? (
          <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-4" data-testid="register-otp-form">
            <p className="text-sm text-text-secondary text-center">
              {t('auth.verifyOtpDesc', { contact: contact.email || contact.phone })}
            </p>
            <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest" {...otpForm.register('code')} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.verifyOtp')}</Button>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4" data-testid="register-form">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('auth.firstName')}</Label>
                <Input {...registerForm.register('firstName')} />
                {registerForm.formState.errors.firstName && (
                  <p className="text-xs text-danger">{registerForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label>{t('auth.lastName')}</Label>
                <Input {...registerForm.register('lastName')} />
                {registerForm.formState.errors.lastName && (
                  <p className="text-xs text-danger">{registerForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label>{t('auth.email')}</Label>
              <Input type="email" {...registerForm.register('email')} />
            </div>
            <div>
              <Label>{t('auth.phone')}</Label>
              <Input type="tel" {...registerForm.register('phone')} />
            </div>
            <PasswordInput
              label={t('auth.password')}
              autoComplete="new-password"
              placeholder={t('auth.passwordMin')}
              error={registerForm.formState.errors.password?.message}
              {...registerForm.register('password')}
            />
            {registerForm.formState.errors.root && (
              <p className="text-xs text-danger">{registerForm.formState.errors.root.message}</p>
            )}
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.register')}</Button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-surface-base px-2 text-text-secondary">{t('common.or')}</span></div>
        </div>

        <GoogleSignInButton onSuccess={() => void showWelcome()} onError={setError} />

        <Button variant="secondary" className="w-full max-w-full whitespace-normal text-center h-auto min-h-12 py-2.5" loading={loading} onClick={() => void onDemoLogin()} data-testid="demo-login">
          {t('auth.tryDemo')}
        </Button>

        <Button variant="ghost" className="w-full max-w-full whitespace-normal text-center h-auto min-h-12 py-2.5" onClick={() => navigate('/otp')}>
          {t('auth.continueOtp')}
        </Button>

        <p className="text-center text-xs text-text-secondary">{t('auth.correctSite')}</p>
      </div>
    </div>
  );
}
