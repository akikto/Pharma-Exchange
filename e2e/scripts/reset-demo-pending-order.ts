import prisma from '../../backend/src/config/database';

const DEMO_PENDING_ORDER_ID = '00000000-0000-0000-0003-000000000001';

async function main() {
  await prisma.order.updateMany({
    where: { id: DEMO_PENDING_ORDER_ID },
    data: {
      paymentMethod: null,
      paymentStatus: 'PENDING',
      status: 'CONFIRMED',
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
