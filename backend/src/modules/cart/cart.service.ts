import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';
import { collectCartIssues, validateCartQuantity } from './cart.validation';

export class CartService {
  async getCart(userId: string) {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            medicine: { select: { id: true, name: true, company: true, packSize: true } },
            pharmacy: { select: { id: true, name: true, city: true, userId: true } },
          },
        },
      },
    });

    const groupedBySeller = items.reduce<Record<string, typeof items>>((acc, item) => {
      const sellerId = item.listing?.pharmacy?.id;
      if (!sellerId) return acc;
      if (!acc[sellerId]) acc[sellerId] = [];
      acc[sellerId].push(item);
      return acc;
    }, {});

    const validItems = items.filter((item) => item.listing?.id && item.listing?.pharmacy?.id);
    const validationIssues = collectCartIssues(validItems);

    return { items: validItems, groupedBySeller, validationIssues };
  }

  async addItem(userId: string, listingId: string, quantity: number) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { medicine: { select: { name: true } } },
    });
    if (!listing) throw AppError.notFound('Listing not available');

    const buyerPharmacy = await prisma.pharmacy.findUnique({ where: { userId } });
    if (buyerPharmacy && listing.pharmacyId === buyerPharmacy.id) {
      throw AppError.badRequest('Cannot add your own listings to cart', { code: 'SELF_PURCHASE' });
    }

    const issue = validateCartQuantity(listing, quantity);
    if (issue) {
      throw AppError.badRequest(issue.message, {
        code: issue.code,
        moq: issue.moq,
        availableQty: issue.availableQty,
      });
    }

    return prisma.cartItem.upsert({
      where: { userId_listingId: { userId, listingId } },
      create: { userId, listingId, quantity },
      update: { quantity },
      include: { listing: { include: { medicine: true, pharmacy: true } } },
    });
  }

  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    const existing = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId },
      include: { listing: { include: { medicine: { select: { name: true } } } } },
    });
    if (!existing) throw AppError.notFound('Cart item not found');

    const issue = validateCartQuantity(existing.listing, quantity);
    if (issue) {
      throw AppError.badRequest(issue.message, {
        code: issue.code,
        moq: issue.moq,
        availableQty: issue.availableQty,
      });
    }

    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
      include: { listing: { include: { medicine: true, pharmacy: true } } },
    });
  }

  async removeItem(userId: string, cartItemId: string) {
    const existing = await prisma.cartItem.findFirst({ where: { id: cartItemId, userId } });
    if (!existing) throw AppError.notFound('Cart item not found');
    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return { message: 'Item removed from cart' };
  }

  async clearCart(userId: string) {
    await prisma.cartItem.deleteMany({ where: { userId } });
    return { message: 'Cart cleared' };
  }
}

export const cartService = new CartService();
