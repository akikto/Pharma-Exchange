import { useState } from 'react';
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

const schema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন'),
  newPassword: z.string().min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষর'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await resetPassword(data.email.trim(), data.newPassword);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('এই ইমেইলে কোনো অ্যাকাউন্ট নেই।');
      } else {
        setError(err instanceof Error ? err.message : 'পাসওয়ার্ড রিসেট ব্যর্থ');
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
          <h1 className="text-xl font-bold">পাসওয়ার্ড রিসেট</h1>
          <p className="text-sm text-text-secondary mt-1">ইমেইল দিন এবং নতুন পাসওয়ার্ড সেট করুন</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">নতুন পাসওয়ার্ড</Label>
            <Input id="newPassword" type="password" minLength={8} autoComplete="new-password" {...register('newPassword')} />
            {errors.newPassword && <p className="text-xs text-danger">{errors.newPassword.message}</p>}
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>পাসওয়ার্ড আপডেট করুন</Button>
        </form>
        <p className="text-center text-sm text-text-secondary">
          <Link to="/login" className="text-primary font-medium">লগইনে ফিরে যান</Link>
        </p>
      </div>
    </div>
  );
}
