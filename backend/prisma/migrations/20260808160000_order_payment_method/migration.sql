-- CreateEnum
CREATE TYPE "OrderPaymentMethod" AS ENUM ('COD', 'RAZORPAY');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentMethod" "OrderPaymentMethod";
