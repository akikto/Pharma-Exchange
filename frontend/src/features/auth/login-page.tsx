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
import { useTabListKeyboard } from '@/hooks/use-tab-list';
import type { User } from '@/types';

type AuthTab = 'signIn' | 'register';
const AUTH_TABS: AuthTab[] = ['signIn', 'register'];

export function LoginPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<AuthTab>(searchParams.get('tab') === 'register' ? 'register' : 'signIn');
  const [isEmail, setIsEmail] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState<User | null>(null);
  const [isDemoSession, setIsDemoSession] = useState(false);
  const onAuthTabKeyDown = useTabListKeyboard(AUTH_TABS, tab, setTab);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const registerUser = useAuthStore((s) => s.register);
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
    acceptedTerms: z.boolean().refine((v) => v === true, {
      message: 'You must accept the Terms & Conditions and Privacy Policy',
    }),
  }).refine((d) => d.email || d.phone, { message: t('validation.emailOrPhone') });

  type LoginForm = z.infer<typeof loginSchema>;
  type RegisterForm = z.infer<typeof registerSchema>;

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

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
      const { acceptedTerms: _, ...payload } = data;
      void _;
      await registerUser({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email || undefined,
        phone: payload.phone || undefined,
        password: payload.password,
      });
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

  if (welcomeUser) {
    return (
      <div
        className="flex min-h-screen w-full max-w-md min-w-0 flex-col box-border overflow-x-hidden py-6 mx-auto edge-to-edge px-6 justify-center"
        data-testid="login-page-root"
      >
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
    <div
      className="flex min-h-screen w-full max-w-md min-w-0 flex-col box-border overflow-x-hidden py-6 mx-auto edge-to-edge px-6"
      data-testid="login-page-root"
    >
      <div className="flex w-full min-w-0 flex-1 flex-col justify-center gap-6">
        <div className="text-center flex flex-col items-center gap-3">
          <Logo size="xl" className="justify-center" />
          <p className="text-text-secondary">{tab === 'signIn' ? t('auth.signInDesc') : t('auth.createAccountDesc')}</p>
        </div>

        <div
          className="flex w-full min-w-0 gap-2 p-1 bg-surface-sunken rounded-[var(--radius-md)]"
          data-testid="auth-tabs"
          role="tablist"
          aria-label={t('auth.tabsLabel')}
          onKeyDown={onAuthTabKeyDown}
        >
          <button
            id="auth-tab-signin"
            type="button"
            role="tab"
            aria-selected={tab === 'signIn'}
            aria-controls="auth-panel-signin"
            tabIndex={tab === 'signIn' ? 0 : -1}
            className={`min-w-0 flex-1 truncate px-2 py-2 text-sm rounded-[var(--radius-sm)] ${tab === 'signIn' ? 'bg-surface-base shadow-sm font-medium' : ''}`}
            onClick={() => { setTab('signIn'); setError(''); }}
          >
            {t('auth.signIn')}
          </button>
          <button
            id="auth-tab-register"
            type="button"
            role="tab"
            aria-selected={tab === 'register'}
            aria-controls="auth-panel-register"
            tabIndex={tab === 'register' ? 0 : -1}
            className={`min-w-0 flex-1 truncate px-2 py-2 text-sm rounded-[var(--radius-sm)] ${tab === 'register' ? 'bg-surface-base shadow-sm font-medium' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            {t('auth.createAccount')}
          </button>
        </div>

        {tab === 'signIn' ? (
          <form
            id="auth-panel-signin"
            role="tabpanel"
            aria-labelledby="auth-tab-signin"
            onSubmit={loginForm.handleSubmit(onLogin)}
            className="w-full min-w-0 space-y-4"
            data-testid="login-form"
          >
            <div
              className="flex w-full min-w-0 gap-2 p-1 bg-surface-sunken rounded-[var(--radius-md)]"
              role="tablist"
              aria-label={t('auth.signInMethodLabel')}
            >
              <button
                type="button"
                role="tab"
                aria-selected={isEmail}
                tabIndex={isEmail ? 0 : -1}
                className={`min-w-0 flex-1 truncate px-2 py-2 text-sm rounded-[var(--radius-sm)] ${isEmail ? 'bg-surface-base shadow-sm font-medium' : ''}`}
                onClick={() => setIsEmail(true)}
              >
                {t('auth.email')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isEmail}
                tabIndex={!isEmail ? 0 : -1}
                className={`min-w-0 flex-1 truncate px-2 py-2 text-sm rounded-[var(--radius-sm)] ${!isEmail ? 'bg-surface-base shadow-sm font-medium' : ''}`}
                onClick={() => setIsEmail(false)}
              >
                {t('auth.phone')}
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier">{isEmail ? t('auth.email') : t('auth.phone')}</Label>
              <Input
                id="identifier"
                type={isEmail ? 'email' : 'tel'}
                autoComplete={isEmail ? 'email' : 'tel'}
                placeholder={isEmail ? 'buyer@pharmex.bd' : '+919XXXXXXXXX'}
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
        ) : (
          <form
            id="auth-panel-register"
            role="tabpanel"
            aria-labelledby="auth-tab-register"
            onSubmit={registerForm.handleSubmit(onRegister)}
            className="space-y-4"
            data-testid="register-form"
          >
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
            <label className="flex items-start gap-2 text-xs text-text-secondary" data-testid="terms-accept-row">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-primary"
                data-testid="accept-terms-checkbox"
                {...registerForm.register('acceptedTerms')}
              />
              <span>
                I have read and agree to the{' '}
                <Link className="underline" to="/terms-and-conditions" target="_blank" rel="noreferrer">
                  Terms &amp; Conditions
                </Link>{' '}
                and{' '}
                <Link className="underline" to="/privacy-policy" target="_blank" rel="noreferrer">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {registerForm.formState.errors.acceptedTerms && (
              <p className="text-xs text-danger">{registerForm.formState.errors.acceptedTerms.message}</p>
            )}
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

        <p className="text-center text-xs text-text-secondary" data-testid="auth-legal-links">
          <Link className="underline" to="/privacy-policy">Privacy Policy</Link>
          <span className="mx-2">·</span>
          <Link className="underline" to="/terms-and-conditions">Terms &amp; Conditions</Link>
        </p>
      </div>
    </div>
  );
}
