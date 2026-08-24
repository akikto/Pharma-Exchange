import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { SellerCartGroup } from '@/components/cart/seller-cart-group';
import type { CartItem } from '@/types';

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

const item: CartItem = {
  id: 'ci-1',
  quantity: 1,
  listing: {
    id: 'l-1',
    finalPrice: '19.2',
    moq: 1,
    availableQty: 99,
    medicine: { id: 'm-1', name: 'LIMCEE 500 mg Tablet', company: 'X', packSize: '10', dosageForm: 'Tab' },
    pharmacy: { id: 'p-1', name: 'Taman', city: 'Reji', userId: 'u-1', verificationStatus: 'APPROVED' },
  },
} as CartItem;

describe('SellerCartGroup line item', () => {
  it('shows the full medicine name (not a single-letter truncate)', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SellerCartGroup
          sellerId="s-1"
          items={[item]}
          note=""
          onNoteChange={vi.fn()}
          onQuantityChange={vi.fn()}
          onRemove={vi.fn()}
          onChat={vi.fn()}
          onSendBuyRequest={vi.fn()}
        />
      </I18nextProvider>,
    );

    const name = screen.getByTestId('cart-item-medicine-name');
    expect(name).toHaveTextContent('LIMCEE 500 mg Tablet');
    expect(name.className).toContain('line-clamp-2');
    expect(name.className).not.toContain('truncate');

    const price = screen.getByTestId('cart-item-price-line');
    expect(price.className).toContain('whitespace-nowrap');
    expect(price.className).toContain('truncate');
  });
});
