import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, isGeminiConfigured } from '../../config/env';
import { logger } from '../../shared/utils/logger';
import type { ScoredMatch } from './aiMatch.utils';

export async function enrichMatchesWithGemini(matches: ScoredMatch[]): Promise<ScoredMatch[]> {
  if (!isGeminiConfigured() || matches.length === 0) return matches;

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
    const prompt = [
      'You are a B2B pharmacy marketplace assistant for Bangladesh.',
      'Return ONLY valid JSON: an array of objects with keys "listingId" and "summary".',
      'Each summary must be under 90 characters, buyer-friendly, and mention why the offer fits.',
      JSON.stringify(
        matches.map((m) => ({
          listingId: m.listingId,
          medicineName: m.medicineName,
          pharmacyName: m.pharmacyName,
          score: m.score,
          reason: m.reason,
          context: m.contextLabel,
        })),
      ),
    ].join('\n');

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text) as { listingId: string; summary: string }[];

    const summaryById = new Map(parsed.map((row) => [row.listingId, row.summary]));
    return matches.map((match) => ({
      ...match,
      summary: summaryById.get(match.listingId) ?? match.summary,
    }));
  } catch (err) {
    logger.warn(`Gemini match enrichment failed: ${(err as Error).message}`);
    return matches;
  }
}
