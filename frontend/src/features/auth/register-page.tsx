import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { Logo } from '@/components/brand/logo';
import { getPostLoginRoute } from '@/lib/auth-utils';

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
      const { user, mode } = useAuthStore.getState();
      navigate(getPostLoginRoute(user, mode));
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
