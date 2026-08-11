import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTabListKeyboard } from '@/hooks/use-tab-list';

describe('useTabListKeyboard', () => {
  it('moves to the next tab on ArrowRight', () => {
    const setTab = vi.fn();
    const { result } = renderHook(() => useTabListKeyboard(['cart', 'orders', 'requests'] as const, 'cart', setTab));

    result.current({
      key: 'ArrowRight',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLElement>);

    expect(setTab).toHaveBeenCalledWith('orders');
  });

  it('moves to the first tab on Home', () => {
    const setTab = vi.fn();
    const { result } = renderHook(() => useTabListKeyboard(['cart', 'orders'] as const, 'orders', setTab));

    result.current({
      key: 'Home',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent<HTMLElement>);

    expect(setTab).toHaveBeenCalledWith('cart');
  });
});
