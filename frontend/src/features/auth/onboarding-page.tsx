import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

const slides = [
  { title: 'Trade medicines with trusted pharmacies', desc: 'Connect with verified pharmacies across Bangladesh for bulk medicine trading.' },
  { title: 'Negotiate buy requests', desc: 'Send buy requests per seller and negotiate prices directly through chat.' },
  { title: 'Track orders in real-time', desc: 'From confirmation to delivery — stay updated on every order status.' },
];

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const setOnboardingSeen = useAuthStore((s) => s.setOnboardingSeen);

  const finish = () => {
    setOnboardingSeen();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className="h-48 w-48 rounded-full bg-primary-subtle flex items-center justify-center text-6xl">💊</div>
        <h1 className="text-2xl font-bold">{slides[step].title}</h1>
        <p className="text-text-secondary max-w-sm">{slides[step].desc}</p>
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-2 bg-border-subtle'}`} />
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Button variant="tertiary" className="flex-1" onClick={finish}>Skip</Button>
        {step < slides.length - 1 ? (
          <Button className="flex-1" onClick={() => setStep(step + 1)}>Next</Button>
        ) : (
          <Button className="flex-1" onClick={finish}>Get Started</Button>
        )}
      </div>
    </div>
  );
}
