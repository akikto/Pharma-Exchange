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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { sendOtp, resendOtp, verifyOtp } = useAuthStore();

  const handleSend = async () => {
    setLoading(true);
    setError('');
    try {
      await sendOtp({ phone });
      setStep('code');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    try {
      await resendOtp({ phone });
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
          <Input
            type="tel"
            placeholder="+8801XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            data-testid="otp-phone-input"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" loading={loading} onClick={handleSend} data-testid="otp-send-button">
            Send OTP
          </Button>
        </>
      ) : (
        <>
          <p className="text-center text-sm text-text-secondary">
            Enter the code we sent to <span dir="ltr">{phone}</span>
          </p>
          <Input
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            className="text-center text-2xl tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            data-testid="otp-code-input"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" loading={loading} onClick={handleVerify} data-testid="otp-verify-button">
            Verify & Login
          </Button>
          <Button variant="ghost" className="w-full" loading={loading} onClick={handleResend} data-testid="otp-resend-button">
            Resend OTP
          </Button>
        </>
      )}
    </div>
  );
}
