import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaymentUnavailableNotice } from '@/components/payments/payment-unavailable-notice';
import { PaymentStatusChip } from '@/components/payments/payment-status-chip';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
    i18n: { language: 'en' },
  }),
}));

describe('payment components', () => {
  it('renders payment unavailable notice', () => {
    render(<PaymentUnavailableNotice />);
    expect(screen.getByTestId('payment-unavailable-notice')).toBeInTheDocument();
  });

  it('renders payment status chip', () => {
    render(<PaymentStatusChip status="PAID" />);
    expect(screen.getByTestId('payment-status-paid')).toBeInTheDocument();
  });
});
