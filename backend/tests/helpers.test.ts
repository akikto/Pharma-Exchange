import { describe, it, expect } from 'vitest';
import { computeFinalPrice, generateOrderNumber, generateRequestNumber } from '../src/shared/utils/helpers';

describe('helpers', () => {
  it('computeFinalPrice applies discount correctly', () => {
    expect(computeFinalPrice(150, 20)).toBe(120);
    expect(computeFinalPrice(100, 0)).toBe(100);
    expect(computeFinalPrice(99.99, 10)).toBe(89.99);
  });

  it('generateOrderNumber has correct format', () => {
    const num = generateOrderNumber();
    expect(num).toMatch(/^ORD-\d{4}-\d{6}$/);
  });

  it('generateRequestNumber has correct format', () => {
    const num = generateRequestNumber();
    expect(num).toMatch(/^BR-\d{4}-\d{6}$/);
  });
});
