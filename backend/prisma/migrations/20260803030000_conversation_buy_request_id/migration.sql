-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "buyRequestId" TEXT;

-- CreateIndex
CREATE INDEX "Conversation_orderId_idx" ON "Conversation"("orderId");
CREATE INDEX "Conversation_buyRequestId_idx" ON "Conversation"("buyRequestId");
