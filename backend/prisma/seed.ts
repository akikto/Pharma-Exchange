import { PrismaClient, UserRole, DosageForm, ListingStatus, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
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
    update: {},
    create: {
      email: 'seller@pharmex.bd',
      phone: '+8801700000002',
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
    update: {},
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
      rating: 4.6,
      ratingCount: 128,
      verificationStatus: VerificationStatus.APPROVED,
    },
  });

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
        update: {},
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

  console.log('Seed complete:');
  console.log(`  Admin:  admin@pharmex.bd / password123`);
  console.log(`  Seller: seller@pharmex.bd / password123 (${pharmacy.name})`);
  console.log(`  Buyer:  buyer@pharmex.bd / password123`);
  console.log(`  Medicines: ${medicines.length}, Listings: ${medicines.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
