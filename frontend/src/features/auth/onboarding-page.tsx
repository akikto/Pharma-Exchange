import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { Logo } from '@/components/brand/logo';

export function OnboardingPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const setOnboardingSeen = useAuthStore((s) => s.setOnboardingSeen);

  const slides = [
    { title: t('auth.onboardingSlide1Title'), desc: t('auth.onboardingSlide1Desc') },
    { title: t('auth.onboardingSlide2Title'), desc: t('auth.onboardingSlide2Desc') },
    { title: t('auth.onboardingSlide3Title'), desc: t('auth.onboardingSlide3Desc') },
  ];

  const finish = () => {
    setOnboardingSeen();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col p-6 edge-to-edge">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <Logo size="xl" className="justify-center" />
        <h1 className="text-2xl font-bold">{slides[step].title}</h1>
        <p className="text-text-secondary max-w-sm">{slides[step].desc}</p>
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-2 bg-border-subtle'}`} />
          ))}
        </div>
      </div>
      <div className="flex gap-3 safe-bottom">
        <Button variant="tertiary" className="flex-1" onClick={finish}>{t('auth.skip')}</Button>
        {step < slides.length - 1 ? (
          <Button className="flex-1" onClick={() => setStep(step + 1)}>{t('auth.next')}</Button>
        ) : (
          <Button className="flex-1" onClick={finish}>{t('auth.getStarted')}</Button>
        )}
      </div>
    </div>
  );
}
