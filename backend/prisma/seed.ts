import { PrismaClient, UserRole, DosageForm, ListingStatus, VerificationStatus, OrderStatus, PaymentStatus, PaymentAttemptStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed database in production. Set NODE_ENV=development to seed.');
    process.exit(1);
  }

  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pharmex.bd' },
    update: {},
    create: {
      email: 'admin@pharmex.bd',
      phone: '+8801700000001',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@pharmex.bd' },
    update: { phone: '+919153014194' },
    create: {
      email: 'seller@pharmex.bd',
      phone: '+919153014194',
      passwordHash,
      firstName: 'Karim',
      lastName: 'Ahmed',
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@pharmex.bd' },
    update: {},
    create: {
      email: 'buyer@pharmex.bd',
      phone: '+8801700000003',
      passwordHash,
      firstName: 'Rahim',
      lastName: 'Hossain',
    },
  });

  const pharmacy = await prisma.pharmacy.upsert({
    where: { userId: seller.id },
    update: { description: 'Trusted wholesale supplier in Dhanmondi with cold-chain storage.' },
    create: {
      userId: seller.id,
      name: 'City Pharmacy',
      licenseNumber: 'DGDA-DHK-2024-001',
      address: '123 Mirpur Road, Dhanmondi',
      city: 'Dhaka',
      district: 'Dhaka',
      postalCode: '1205',
      latitude: 23.7461,
      longitude: 90.3742,
      description: 'Trusted wholesale supplier in Dhanmondi with cold-chain storage.',
      rating: 4.6,
      ratingCount: 128,
      verificationStatus: VerificationStatus.APPROVED,
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@pharmex.bd' },
    update: {},
    create: {
      email: 'seller2@pharmex.bd',
      phone: '+8801700000004',
      passwordHash,
      firstName: 'Fatima',
      lastName: 'Begum',
    },
  });

  const pharmacy2 = await prisma.pharmacy.upsert({
    where: { userId: seller2.id },
    update: { description: 'Green Care Pharmacy — fast delivery across Chattogram metro.' },
    create: {
      userId: seller2.id,
      name: 'Green Care Pharmacy',
      licenseNumber: 'DGDA-CTG-2024-002',
      address: '45 Agrabad Commercial Area',
      city: 'Chattogram',
      district: 'Chattogram',
      postalCode: '4100',
      latitude: 22.3569,
      longitude: 91.7832,
      description: 'Green Care Pharmacy — fast delivery across Chattogram metro.',
      rating: 4.4,
      ratingCount: 86,
      verificationStatus: VerificationStatus.APPROVED,
    },
  });

  const seller3 = await prisma.user.upsert({
    where: { email: 'seller3@pharmex.bd' },
    update: {},
    create: {
      email: 'seller3@pharmex.bd',
      phone: '+8801700000005',
      passwordHash,
      firstName: 'Jamal',
      lastName: 'Uddin',
    },
  });

  const pharmacy3 = await prisma.pharmacy.upsert({
    where: { userId: seller3.id },
    update: { description: 'MediPlus Sylhet — bulk analgesics and syrups for upcountry buyers.' },
    create: {
      userId: seller3.id,
      name: 'MediPlus Sylhet',
      licenseNumber: 'DGDA-SYL-2024-003',
      address: '12 Zindabazar Road',
      city: 'Sylhet',
      district: 'Sylhet',
      postalCode: '3100',
      latitude: 24.8949,
      longitude: 91.8687,
      description: 'MediPlus Sylhet — bulk analgesics and syrups for upcountry buyers.',
      rating: 4.8,
      ratingCount: 54,
      verificationStatus: VerificationStatus.APPROVED,
    },
  });

  const demoPharmacies = [pharmacy, pharmacy2, pharmacy3];

  const medicines = await Promise.all([
    prisma.medicine.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Napa Extra 500mg',
        genericName: 'Paracetamol',
        brandName: 'Napa Extra',
        company: 'Beximco Pharmaceuticals',
        dosageForm: DosageForm.TABLET,
        strength: '500mg',
        packSize: '10x10 Strip',
        category: 'Analgesic',
        scheduleClass: 'OTC',
        composition: 'Paracetamol 500mg',
      },
    }),
    prisma.medicine.upsert({
      where: { id: '00000000-0000-0000-0000-000000000002' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Ace Plus',
        genericName: 'Paracetamol + Caffeine',
        brandName: 'Ace Plus',
        company: 'Square Pharmaceuticals',
        dosageForm: DosageForm.TABLET,
        strength: '500mg+65mg',
        packSize: '10x10 Strip',
        category: 'Analgesic',
        scheduleClass: 'OTC',
      },
    }),
    prisma.medicine.upsert({
      where: { id: '00000000-0000-0000-0000-000000000003' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Napa Syrup',
        genericName: 'Paracetamol',
        brandName: 'Napa',
        company: 'Beximco Pharmaceuticals',
        dosageForm: DosageForm.SYRUP,
        strength: '120mg/5ml',
        packSize: '60ml Bottle',
        category: 'Analgesic',
        scheduleClass: 'OTC',
      },
    }),
  ]);

  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 8);

  const mfgDate = new Date();
  mfgDate.setMonth(mfgDate.getMonth() - 4);

  await Promise.all(
    medicines.map((medicine, i) =>
      prisma.listing.upsert({
        where: { id: `00000000-0000-0000-0001-00000000000${i + 1}` },
        update: { availableQty: 500 - i * 100, status: ListingStatus.ACTIVE },
        create: {
          id: `00000000-0000-0000-0001-00000000000${i + 1}`,
          pharmacyId: pharmacy.id,
          medicineId: medicine.id,
          batchNumber: `BATCH-2026-00${i + 1}`,
          mfgDate,
          expiryDate,
          purchasePrice: 90 + i * 10,
          sellingPrice: 150 + i * 10,
          discountPercent: 20,
          finalPrice: (150 + i * 10) * 0.8,
          availableQty: 500 - i * 100,
          moq: 10,
          status: ListingStatus.ACTIVE,
        },
      })
    )
  );

  await Promise.all(
    demoPharmacies.slice(1).flatMap((ph, pi) =>
      medicines.map((medicine, mi) =>
        prisma.listing.upsert({
          where: { id: `00000000-0000-0000-0002-0000000000${pi}${mi + 1}` },
          update: { availableQty: 300 - mi * 50, status: ListingStatus.ACTIVE },
          create: {
            id: `00000000-0000-0000-0002-0000000000${pi}${mi + 1}`,
            pharmacyId: ph.id,
            medicineId: medicine.id,
            batchNumber: `BATCH-DEMO-${pi + 1}-0${mi + 1}`,
            mfgDate,
            expiryDate,
            purchasePrice: 85 + mi * 8 + pi * 5,
            sellingPrice: 140 + mi * 12 + pi * 5,
            discountPercent: 15 + pi * 3,
            finalPrice: (140 + mi * 12 + pi * 5) * (1 - (15 + pi * 3) / 100),
            availableQty: 300 - mi * 50,
            moq: 10,
            status: ListingStatus.ACTIVE,
          },
        })
      )
    )
  );

  const demoListingId = '00000000-0000-0000-0001-000000000001';
  const demoListing = await prisma.listing.findUniqueOrThrow({
    where: { id: demoListingId },
    include: { medicine: true },
  });
  const unitPrice = Number(demoListing.finalPrice);
  const quantity = demoListing.moq;
  const subtotal = unitPrice * quantity;

  const pendingOrder = await prisma.order.upsert({
    where: { id: '00000000-0000-0000-0003-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0003-000000000001',
      orderNumber: 'ORD-2026-000001',
      buyerId: buyer.id,
      sellerId: pharmacy.id,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PENDING,
      totalAmount: subtotal,
      items: {
        create: {
          listingId: demoListingId,
          medicineName: demoListing.medicine.name,
          batchNumber: demoListing.batchNumber,
          quantity,
          unitPrice,
          subtotal,
        },
      },
      statusHistory: { create: { status: OrderStatus.CONFIRMED, note: 'Demo order for payment E2E' } },
    },
  });

  const paidOrder = await prisma.order.upsert({
    where: { id: '00000000-0000-0000-0003-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0003-000000000002',
      orderNumber: 'ORD-2026-000002',
      buyerId: buyer.id,
      sellerId: pharmacy.id,
      status: OrderStatus.CONFIRMED,
      paymentStatus: PaymentStatus.PAID,
      totalAmount: subtotal,
      items: {
        create: {
          listingId: demoListingId,
          medicineName: demoListing.medicine.name,
          batchNumber: demoListing.batchNumber,
          quantity,
          unitPrice,
          subtotal,
        },
      },
      statusHistory: { create: { status: OrderStatus.CONFIRMED, note: 'Demo paid order for admin reconciliation' } },
    },
  });

  await prisma.payment.upsert({
    where: { id: '00000000-0000-0000-0004-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0004-000000000001',
      orderId: paidOrder.id,
      userId: buyer.id,
      providerOrderId: 'order_seed_demo_paid',
      providerPaymentId: 'pay_seed_demo_paid',
      amount: subtotal,
      currency: 'INR',
      status: PaymentAttemptStatus.CAPTURED,
      receipt: 'rcpt_seed_demo_paid',
      capturedAt: new Date(),
    },
  });

  console.log('Seed complete:');
  console.log(`  Admin:  admin@pharmex.bd / password123`);
  console.log(`  Seller: seller@pharmex.bd / password123 (${pharmacy.name})`);
  console.log(`  Seller: seller2@pharmex.bd / password123 (${pharmacy2.name})`);
  console.log(`  Seller: seller3@pharmex.bd / password123 (${pharmacy3.name})`);
  console.log(`  Buyer:  buyer@pharmex.bd / password123`);
  console.log(`  Demo orders: ${pendingOrder.orderNumber} (pending), ${paidOrder.orderNumber} (paid)`);
  console.log(`  Medicines: ${medicines.length}, Demo pharmacies: ${demoPharmacies.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
