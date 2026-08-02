import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { ApiError } from '@/lib/api';
import { Logo } from '@/components/brand/logo';

const schema = z.object({
  identifier: z.string().min(1, 'Required'),
  password: z.string().min(8, 'Min 8 characters'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const [isEmail, setIsEmail] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const useEmail = isEmail || data.identifier.includes('@');
      await login(data.identifier.trim(), data.password, useEmail);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RATE_LIMIT_EXCEEDED') {
        setError(err.message);
      } else if (err instanceof ApiError && err.message === 'Invalid credentials') {
        setError('ইমেইল/ফোন বা পাসওয়ার্ড ভুল। পাসওয়ার্ড ভুলে গেলে রিসেট করুন।');
      } else {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col p-6 max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center gap-6">
        <div className="text-center flex flex-col items-center gap-3">
          <Logo size="xl" className="justify-center" />
          <p className="text-text-secondary">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-2 p-1 bg-surface-sunken rounded-[var(--radius-md)]">
            <button type="button" className={`flex-1 py-2 text-sm rounded-[var(--radius-sm)] ${isEmail ? 'bg-surface-base shadow-sm font-medium' : ''}`} onClick={() => setIsEmail(true)}>Email</button>
            <button type="button" className={`flex-1 py-2 text-sm rounded-[var(--radius-sm)] ${!isEmail ? 'bg-surface-base shadow-sm font-medium' : ''}`} onClick={() => setIsEmail(false)}>Phone</button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifier">{isEmail ? 'Email' : 'Phone'}</Label>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              placeholder="কমপক্ষে ৮ অক্ষর"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-danger">পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে</p>}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <p className="text-right text-sm">
            <Link to="/forgot-password" className="text-primary font-medium">পাসওয়ার্ড ভুলে গেছেন?</Link>
          </p>

          <Button type="submit" className="w-full" size="lg" loading={loading}>Log In</Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-surface-base px-2 text-text-secondary">or</span></div>
        </div>

        <Button variant="secondary" className="w-full" onClick={() => navigate('/otp')}>
          Continue with OTP
        </Button>

        <p className="text-center text-xs text-text-secondary">
          সঠিক সাইট: pharma-exchange-frontend.vercel.app
        </p>

        <p className="text-center text-sm text-text-secondary">
          New pharmacy? <Link to="/register" className="text-primary font-medium">Create account</Link>
        </p>
      </div>
    </div>
  );
}
