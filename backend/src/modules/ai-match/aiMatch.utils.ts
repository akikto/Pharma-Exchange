export interface MatchCandidate {
  listingId: string;
  medicineId: string;
  medicineName: string;
  finalPrice: number;
  discountPercent: number;
  availableQty: number;
  moq: number;
  expiryDate: string;
  pharmacyName: string;
  targetPrice?: number;
  contextLabel?: string;
}

export interface ScoredMatch extends MatchCandidate {
  score: number;
  reason: string;
  summary: string;
}

export function scoreListingMatch(candidate: MatchCandidate): ScoredMatch {
  let score = 50;
  const reasons: string[] = [];

  if (candidate.targetPrice != null && candidate.finalPrice <= candidate.targetPrice) {
    score += 20;
    reasons.push('At or below your request price');
  }
  if (candidate.discountPercent >= 15) {
    score += 15;
    reasons.push(`${Math.round(candidate.discountPercent)}% discount`);
  }

  const monthsToExpiry =
    (new Date(candidate.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsToExpiry >= 6) {
    score += 10;
    reasons.push('Healthy expiry window');
  }
  if (candidate.availableQty >= candidate.moq * 5) {
    score += 5;
    reasons.push('Strong stock availability');
  }

  const reason = reasons.length ? reasons.join(' · ') : 'Good market fit for your needs';
  return {
    ...candidate,
    score: Math.min(100, score),
    reason,
    summary: reason,
  };
}

export function rankMatches(candidates: MatchCandidate[], limit = 6): ScoredMatch[] {
  const seen = new Set<string>();
  return candidates
    .map(scoreListingMatch)
    .filter((m) => {
      if (seen.has(m.listingId)) return false;
      seen.add(m.listingId);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
