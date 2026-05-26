-- AlterTable
ALTER TABLE "TryOnTask" ADD COLUMN     "externalPredictionId" TEXT,
ADD COLUMN     "rawResponse" JSONB,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TryOnTask_provider_idx" ON "TryOnTask"("provider");

-- CreateIndex
CREATE INDEX "TryOnTask_externalPredictionId_idx" ON "TryOnTask"("externalPredictionId");
