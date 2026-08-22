import { describe, expect, it } from 'vitest';
import {
  HOME_CARD_SHELL_CLASS,
  HOME_GUTTER_CLASS,
  HOME_HERO_STACK_CLASS,
} from '@/components/home/home-layout';

describe('home layout tokens', () => {
  it('uses the same horizontal gutter as the app bar (px-3)', () => {
    expect(HOME_GUTTER_CLASS).toBe('px-3');
  });

  it('uses a 10px hero grid gap', () => {
    expect(HOME_HERO_STACK_CLASS).toContain('gap-[10px]');
  });

  it('defines a shared card shell for banner and shop', () => {
    expect(HOME_CARD_SHELL_CLASS).toContain('border');
    expect(HOME_CARD_SHELL_CLASS).toContain('w-full');
  });
});
