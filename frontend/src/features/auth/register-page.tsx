import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLogo } from '@/components/brand/app-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { brand } from '@/config/brand';
import { useAuthStore } from '@/stores/auth-store';

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
  const navigate = useNavigate();
  const { register: registerUser, verifyOtp } = useAuthStore();

  const regForm = useForm({ resolver: zodResolver(registerSchema) });
  const otpForm = useForm({ resolver: zodResolver(otpSchema) });

  const onRegister = async (data: z.infer<typeof registerSchema>) => {
    const result = await registerUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || undefined,
      phone: data.phone || undefined,
      password: data.password,
    });
    setContact({ email: data.email || undefined, phone: data.phone || undefined });
    if (result.devOtp) setDevOtp(result.devOtp);
    setStep('otp');
  };

  const onVerify = async (data: z.infer<typeof otpSchema>) => {
    await verifyOtp({ ...contact, code: data.code, purpose: 'registration' });
    navigate('/');
  };

  if (step === 'otp') {
    return (
      <div className="flex min-h-screen flex-col p-6 max-w-md mx-auto justify-center gap-6">
        <h1 className="text-xl font-bold text-center">Verify OTP</h1>
        <p className="text-text-secondary text-center text-sm">Enter the 6-digit code sent to your {contact.email || contact.phone}</p>
        {devOtp && <p className="text-center text-sm text-warning">Dev OTP: {devOtp}</p>}
        <form onSubmit={otpForm.handleSubmit(onVerify)} className="space-y-4">
          <Input placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest" {...otpForm.register('code')} />
          <Button type="submit" className="w-full" size="lg">Verify</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-6 max-w-md mx-auto">
      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className="text-center mb-2">
          <AppLogo variant="logo" size="md" className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Create Pharmacy Account</h1>
          <p className="text-text-secondary text-sm mt-1">Join {brand.name}</p>
        </div>
        <form onSubmit={regForm.handleSubmit(onRegister)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name</Label><Input {...regForm.register('firstName')} /></div>
            <div><Label>Last Name</Label><Input {...regForm.register('lastName')} /></div>
          </div>
          <div><Label>Email</Label><Input type="email" {...regForm.register('email')} /></div>
          <div><Label>Phone</Label><Input type="tel" {...regForm.register('phone')} /></div>
          <div><Label>Password</Label><Input type="password" {...regForm.register('password')} /></div>
          <Button type="submit" className="w-full" size="lg">Register</Button>
        </form>
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
      <h1 className="text-xl font-bold">OTP Login</h1>
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
