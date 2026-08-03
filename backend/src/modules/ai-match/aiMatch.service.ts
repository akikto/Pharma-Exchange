import { BuyRequestStatus, ListingStatus, VerificationStatus } from '@prisma/client';
import prisma from '../../config/database';
import { getPharmacyForUser } from '../../shared/middleware/pharmacy.middleware';
import { isGeminiConfigured } from '../../config/env';
import { enrichMatchesWithGemini } from './geminiMatch.service';
import { type MatchCandidate, rankMatches } from './aiMatch.utils';

const listingInclude = {
  medicine: {
    select: {
      id: true, name: true, company: true, dosageForm: true, packSize: true,
      category: true, composition: true, genericName: true, brandName: true,
    },
  },
  pharmacy: {
    select: {
      id: true, name: true, city: true, district: true, rating: true,
      verificationStatus: true, latitude: true, longitude: true, userId: true,
    },
  },
};

export class AiMatchService {
  async getMatches(userId: string, role: 'buyer' | 'seller' = 'buyer') {
    const candidates = role === 'seller'
      ? await this.buildSellerCandidates(userId)
      : await this.buildBuyerCandidates(userId);

    let scored = rankMatches(candidates, 6);
    let source: 'gemini' | 'rules' = 'rules';

    if (isGeminiConfigured() && scored.length > 0) {
      scored = await enrichMatchesWithGemini(scored);
      source = 'gemini';
    }

    const listingIds = scored.map((m) => m.listingId);
    const listings = await prisma.listing.findMany({
      where: { id: { in: listingIds } },
      include: listingInclude,
    });
    const listingById = new Map(listings.map((l) => [l.id, l]));

    return {
      data: scored.map((match) => ({
        id: match.listingId,
        score: match.score,
        reason: match.reason,
        summary: match.summary,
        contextLabel: match.contextLabel,
        listing: listingById.get(match.listingId) ?? null,
      })),
      source,
      generatedAt: new Date().toISOString(),
    };
  }

  private async buildBuyerCandidates(userId: string): Promise<MatchCandidate[]> {
    const pendingRequests = await prisma.buyRequest.findMany({
      where: { buyerId: userId, status: BuyRequestStatus.PENDING },
      include: {
        items: {
          include: {
            listing: {
              include: { medicine: { select: { id: true, name: true } } },
            },
          },
        },
      },
      take: 10,
    });

    const medicineTargets = new Map<string, { targetPrice?: number; contextLabel: string }>();
    for (const request of pendingRequests) {
      for (const item of request.items) {
        const medicineId = item.listing.medicine.id;
        medicineTargets.set(medicineId, {
          targetPrice: Number(item.unitPrice),
          contextLabel: request.requestNumber,
        });
      }
    }

    if (medicineTargets.size === 0) {
      const watchlist = await prisma.watchlistItem.findMany({
        where: { userId },
        select: { medicineId: true, medicine: { select: { name: true } } },
        take: 10,
      });
      for (const item of watchlist) {
        medicineTargets.set(item.medicineId, {
          contextLabel: item.medicine.name,
        });
      }
    }

    if (medicineTargets.size === 0) {
      return this.buildFallbackCandidates();
    }

    const listings = await prisma.listing.findMany({
      where: {
        status: ListingStatus.ACTIVE,
        availableQty: { gt: 0 },
        medicineId: { in: [...medicineTargets.keys()] },
        pharmacy: { verificationStatus: VerificationStatus.APPROVED, isActive: true },
      },
      include: { medicine: { select: { id: true, name: true } }, pharmacy: { select: { name: true } } },
      orderBy: [{ discountPercent: 'desc' }, { finalPrice: 'asc' }],
      take: 40,
    });

    return listings.map((listing) => {
      const target = medicineTargets.get(listing.medicineId)!;
      return {
        listingId: listing.id,
        medicineId: listing.medicineId,
        medicineName: listing.medicine.name,
        finalPrice: Number(listing.finalPrice),
        discountPercent: listing.discountPercent,
        availableQty: listing.availableQty,
        moq: listing.moq,
        expiryDate: listing.expiryDate.toISOString(),
        pharmacyName: listing.pharmacy.name,
        targetPrice: target.targetPrice,
        contextLabel: target.contextLabel,
      };
    });
  }

  private async buildSellerCandidates(userId: string): Promise<MatchCandidate[]> {
    const pharmacy = await prisma.pharmacy.findUnique({ where: { userId } });
    if (!pharmacy) return this.buildFallbackCandidates();

    const inventory = await prisma.listing.findMany({
      where: { pharmacyId: pharmacy.id, status: ListingStatus.ACTIVE, availableQty: { gt: 0 } },
      include: { medicine: { select: { id: true, name: true } } },
      take: 20,
    });
    if (!inventory.length) return [];

    const medicineIds = inventory.map((l) => l.medicineId);
    const pendingRequests = await prisma.buyRequest.findMany({
      where: {
        status: BuyRequestStatus.PENDING,
        sellerId: { not: pharmacy.id },
        items: { some: { listing: { medicineId: { in: medicineIds } } } },
      },
      include: {
        items: {
          include: {
            listing: {
              include: {
                medicine: { select: { id: true, name: true } },
                pharmacy: { select: { name: true } },
              },
            },
          },
        },
      },
      take: 15,
    });

    const candidates: MatchCandidate[] = [];
    for (const request of pendingRequests) {
      for (const item of request.items) {
        const sellerListing = inventory.find((l) => l.medicineId === item.listing.medicineId);
        if (!sellerListing) continue;
        candidates.push({
          listingId: sellerListing.id,
          medicineId: sellerListing.medicineId,
          medicineName: sellerListing.medicine.name,
          finalPrice: Number(sellerListing.finalPrice),
          discountPercent: sellerListing.discountPercent,
          availableQty: sellerListing.availableQty,
          moq: sellerListing.moq,
          expiryDate: sellerListing.expiryDate.toISOString(),
          pharmacyName: pharmacy.name,
          targetPrice: Number(item.unitPrice),
          contextLabel: request.requestNumber,
        });
      }
    }

    return candidates.length ? candidates : this.buildFallbackCandidates();
  }

  private async buildFallbackCandidates(): Promise<MatchCandidate[]> {
    const listings = await prisma.listing.findMany({
      where: {
        status: ListingStatus.ACTIVE,
        availableQty: { gt: 0 },
        discountPercent: { gte: 10 },
        pharmacy: { verificationStatus: VerificationStatus.APPROVED, isActive: true },
      },
      include: { medicine: { select: { id: true, name: true } }, pharmacy: { select: { name: true } } },
      orderBy: [{ discountPercent: 'desc' }, { pharmacy: { rating: 'desc' } }],
      take: 12,
    });

    return listings.map((listing) => ({
      listingId: listing.id,
      medicineId: listing.medicineId,
      medicineName: listing.medicine.name,
      finalPrice: Number(listing.finalPrice),
      discountPercent: listing.discountPercent,
      availableQty: listing.availableQty,
      moq: listing.moq,
      expiryDate: listing.expiryDate.toISOString(),
      pharmacyName: listing.pharmacy.name,
      contextLabel: 'Marketplace pick',
    }));
  }

  async getMatchesForUser(userId: string, role?: string) {
    if (role === 'seller') {
      try {
        await getPharmacyForUser(userId);
        return this.getMatches(userId, 'seller');
      } catch {
        return this.getMatches(userId, 'buyer');
      }
    }
    return this.getMatches(userId, 'buyer');
  }
}

export const aiMatchService = new AiMatchService();
