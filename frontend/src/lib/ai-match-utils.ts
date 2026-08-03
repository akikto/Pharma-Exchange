export function formatMatchScore(score: number): string {
  return `${Math.round(score)}%`;
}

export function matchScoreVariant(score: number): 'success' | 'warning' | 'default' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'default';
}
