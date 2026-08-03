export type PriceTrend = 'UP' | 'DOWN' | 'STABLE';

export function trendLabel(trend: PriceTrend): string {
  if (trend === 'DOWN') return 'down';
  if (trend === 'UP') return 'up';
  return 'stable';
}

export function formatMaxPrice(value: number): string {
  return value.toFixed(2);
}
