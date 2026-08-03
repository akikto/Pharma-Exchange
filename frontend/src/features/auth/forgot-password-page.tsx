import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/logo';
import { useAuthStore } from '@/stores/auth-store';
import { ApiError } from '@/lib/api';

const emailSchema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন'),
});

const otpSchema = z.object({
  code: z.string().length(6, '৬ অঙ্কের কোড দিন').regex(/^\d{6}$/, 'শুধু সংখ্যা দিন'),
});

const passwordSchema = z.object({
  newPassword: z.string()
    .min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর')
    .regex(/[A-Za-z]/, 'কমপক্ষে একটি অক্ষর দিন')
    .regex(/[0-9]/, 'কমপক্ষে একটি সংখ্যা দিন'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'পাসওয়ার্ড মিলছে না',
  path: ['confirmPassword'],
});

type Step = 'email' | 'otp' | 'password';

const RESEND_COOLDOWN = 60;

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const navigate = useNavigate();

  const requestOtp = useAuthStore((s) => s.requestPasswordResetOtp);
  const verifyOtp = useAuthStore((s) => s.verifyPasswordResetOtp);
  const resetPassword = useAuthStore((s) => s.resetPasswordWithToken);

  const emailForm = useForm({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm({ resolver: zodResolver(otpSchema) });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const startResendCooldown = useCallback(() => setResendSeconds(RESEND_COOLDOWN), []);

  const onRequestOtp = async (data: z.infer<typeof emailSchema>) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const trimmed = data.email.trim();
      const result = await requestOtp(trimmed);
      setEmail(trimmed);
      setStep('otp');
      startResendCooldown();
      setSuccess(result.message || 'যদি অ্যাকাউন্ট থাকে, একটি কোড পাঠানো হয়েছে।');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'কোড পাঠানো ব্যর্থ');
    } finally {
      setLoading(false);
    }
  };

  const onResendOtp = async () => {
    if (resendSeconds > 0 || loading) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await requestOtp(email);
      startResendCooldown();
      setSuccess('নতুন কোড পাঠানো হয়েছে।');
      otpForm.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'কোড পাঠানো ব্যর্থ');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async (data: z.infer<typeof otpSchema>) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await verifyOtp(email, data.code);
      setResetToken(result.resetToken);
      setStep('password');
      setSuccess('কোড যাচাই হয়েছে। নতুন পাসওয়ার্ড সেট করুন।');
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError(err.message);
      } else if (err instanceof ApiError && err.status === 429) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : 'কোড যাচাই ব্যর্থ');
      }
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data: z.infer<typeof passwordSchema>) => {
    if (!resetToken) {
      setError('সেশন মেয়াদ শেষ। আবার শুরু করুন।');
      setStep('email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(resetToken, data.newPassword);
      navigate('/login', { state: { message: 'পাসওয়ার্ড আপডেট হয়েছে। লগইন করুন।' } });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('রিসেট লিংকের মেয়াদ শেষ। আবার OTP চেয়ে নিন।');
        setStep('email');
        setResetToken('');
      } else {
        setError(err instanceof Error ? err.message : 'পাসওয়ার্ড আপডেট ব্যর্থ');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col p-6 max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center gap-6">
        <Logo size="xl" className="justify-center" />

        {step === 'email' && (
          <>
            <div className="text-center">
              <h1 className="text-xl font-bold">পাসওয়ার্ড ভুলে গেছেন?</h1>
              <p className="text-sm text-text-secondary mt-1">ইমেইল দিন — আমরা একটি যাচাইকরণ কোড পাঠাব</p>
            </div>
            <form onSubmit={emailForm.handleSubmit(onRequestOtp)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...emailForm.register('email')} />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-danger">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              {success && <p className="text-sm text-success">{success}</p>}
              <Button type="submit" className="w-full" size="lg" loading={loading} disabled={loading}>
                কোড পাঠান
              </Button>
            </form>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="text-center">
              <h1 className="text-xl font-bold">ইমেইল যাচাই করুন</h1>
              <p className="text-sm text-text-secondary mt-1">
                <span className="font-medium text-text-primary">{email}</span> এ ৬ অঙ্কের কোড পাঠানো হয়েছে
              </p>
              <p className="text-xs text-text-disabled mt-1">কোড ৫ মিনিটের মধ্যে মেয়াদ শেষ হবে</p>
            </div>
            <form onSubmit={otpForm.handleSubmit(onVerifyOtp)} className="space-y-4">
              <Input
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="text-center text-2xl tracking-widest"
                {...otpForm.register('code')}
              />
              {otpForm.formState.errors.code && (
                <p className="text-xs text-danger text-center">{otpForm.formState.errors.code.message}</p>
              )}
              {error && <p className="text-sm text-danger text-center">{error}</p>}
              {success && <p className="text-sm text-success text-center">{success}</p>}
              <Button type="submit" className="w-full" size="lg" loading={loading} disabled={loading}>
                কোড যাচাই করুন
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={resendSeconds > 0 || loading}
                onClick={onResendOtp}
              >
                {resendSeconds > 0 ? `আবার পাঠান (${resendSeconds}s)` : 'কোড আবার পাঠান'}
              </Button>
              <button
                type="button"
                className="w-full text-sm text-text-secondary hover:text-primary"
                onClick={() => { setStep('email'); setError(''); setSuccess(''); }}
              >
                ইমেইল পরিবর্তন করুন
              </button>
            </form>
          </>
        )}

        {step === 'password' && (
          <>
            <div className="text-center">
              <h1 className="text-xl font-bold">নতুন পাসওয়ার্ড</h1>
              <p className="text-sm text-text-secondary mt-1">কমপক্ষে ৮ অক্ষর, একটি অক্ষর ও একটি সংখ্যা দিন</p>
            </div>
            <form onSubmit={passwordForm.handleSubmit(onResetPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">নতুন পাসওয়ার্ড</Label>
                <Input id="newPassword" type="password" autoComplete="new-password" {...passwordForm.register('newPassword')} />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-danger">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">পাসওয়ার্ড নিশ্চিত করুন</Label>
                <Input id="confirmPassword" type="password" autoComplete="new-password" {...passwordForm.register('confirmPassword')} />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-danger">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              {success && <p className="text-sm text-success">{success}</p>}
              <Button type="submit" className="w-full" size="lg" loading={loading} disabled={loading}>
                পাসওয়ার্ড আপডেট করুন
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-text-secondary">
          <Link to="/login" className="text-primary font-medium">লগইনে ফিরে যান</Link>
        </p>
      </div>
    </div>
  );
}

export function VerifyEmailOtpPage() {
  return <ForgotPasswordPage />;
}
