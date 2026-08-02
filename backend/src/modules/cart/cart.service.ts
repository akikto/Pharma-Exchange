import prisma from '../../config/database';
import { AppError } from '../../shared/errors/AppError';

export class CartService {
  async getCart(userId: string) {
    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            medicine: { select: { id: true, name: true, company: true, packSize: true } },
            pharmacy: { select: { id: true, name: true, city: true } },
          },
        },
      },
    });

    const groupedBySeller = items.reduce<Record<string, typeof items>>((acc, item) => {
      const sellerId = item.listing.pharmacy.id;
      if (!acc[sellerId]) acc[sellerId] = [];
      acc[sellerId].push(item);
      return acc;
    }, {});

    return { items, groupedBySeller };
  }

  async addItem(userId: string, listingId: string, quantity: number) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== 'ACTIVE') throw AppError.notFound('Listing not available');
    if (quantity < listing.moq) throw AppError.badRequest(`Minimum order quantity is ${listing.moq}`);
    if (quantity > listing.availableQty) throw AppError.badRequest('Insufficient stock');

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
      include: { listing: true },
    });
    if (!existing) throw AppError.notFound('Cart item not found');
    if (quantity < existing.listing.moq) throw AppError.badRequest(`Minimum order quantity is ${existing.listing.moq}`);

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
