import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth-store';
import { Logo } from '@/components/brand/logo';
import { ApiError } from '@/lib/api';

const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(10).optional().or(z.literal('')),
  password: z.string().min(8),
}).refine((d) => d.email || d.phone, { message: 'Email or phone required' });

const otpSchema = z.object({ code: z.string().length(6) });

export function RegisterPage() {
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [contact, setContact] = useState<{ email?: string; phone?: string }>({});
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser, verifyOtp } = useAuthStore();

  const regForm = useForm({ resolver: zodResolver(registerSchema) });
  const otpForm = useForm({ resolver: zodResolver(otpSchema) });

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
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
      if (result.devOtp) {
        setContact({ email: data.email || undefined, phone: data.phone || undefined });
        setDevOtp(result.devOtp);
        setStep('otp');
        return;
      }
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CONFLICT') {
        setError('এই ইমেইল বা ফোন নম্বর ইতিমধ্যে রেজিস্টার করা। পাসওয়ার্ড রিসেট করুন বা লগইন করুন।');
      } else {
        setError(err instanceof Error ? err.message : 'রেজিস্ট্রেশন ব্যর্থ হয়েছে');
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async (data: z.infer<typeof otpSchema>) => {
    setLoading(true);
    setError('');
    try {
      await verifyOtp({ ...contact, code: data.code, purpose: 'registration' });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP যাচাই ব্যর্থ');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="flex min-h-screen flex-col p-6 max-w-md mx-auto justify-center gap-6">
        <Logo size="lg" className="justify-center" />
        <h1 className="text-xl font-bold text-center">Verify OTP</h1>
        <p className="text-text-secondary text-center text-sm">Enter the 6-digit code sent to your {contact.email || contact.phone}</p>
        {devOtp && <p className="text-center text-sm text-warning">Dev OTP: {devOtp}</p>}
        <form onSubmit={otpForm.handleSubmit(onVerify)} className="space-y-4">
          <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest" {...otpForm.register('code')} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>Verify</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-6 max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center gap-4">
        <Logo size="lg" className="justify-center mb-2" />
        <h1 className="text-2xl font-bold text-center">Create Pharmacy Account</h1>
        <form onSubmit={regForm.handleSubmit(onRegister)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name</Label><Input {...regForm.register('firstName')} /></div>
            <div><Label>Last Name</Label><Input {...regForm.register('lastName')} /></div>
          </div>
          <div><Label>Email</Label><Input type="email" {...regForm.register('email')} /></div>
          <div><Label>Phone</Label><Input type="tel" {...regForm.register('phone')} /></div>
          <div><Label>Password</Label><Input type="password" minLength={8} autoComplete="new-password" {...regForm.register('password')} /></div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>Register</Button>
        </form>
        <p className="text-center text-sm text-text-secondary">
          Already have an account? <Link to="/login" className="text-primary font-medium">Log in</Link>
          {' · '}
          <Link to="/forgot-password" className="text-primary font-medium">পাসওয়ার্ড রিসেট</Link>
        </p>
      </div>
    </div>
  );
}

export function OtpLoginPage() {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { sendOtp, verifyOtp } = useAuthStore();

  const handleSend = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await sendOtp({ phone });
      if (result.devOtp) setDevOtp(result.devOtp);
      setStep('code');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      await verifyOtp({ phone, code, purpose: 'login' });
      navigate('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col p-6 max-w-md mx-auto justify-center gap-6">
      <Logo size="lg" className="justify-center" />
      <h1 className="text-xl font-bold text-center">OTP Login</h1>
      {step === 'phone' ? (
        <>
          <Input type="tel" placeholder="+8801XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" loading={loading} onClick={handleSend}>Send OTP</Button>
        </>
      ) : (
        <>
          {devOtp && <p className="text-center text-sm text-warning">Dev OTP: {devOtp}</p>}
          <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest" value={code} onChange={(e) => setCode(e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" loading={loading} onClick={handleVerify}>Verify & Login</Button>
        </>
      )}
    </div>
  );
}
