-- AlterTable
ALTER TABLE "AiModel" ADD COLUMN     "bodyType" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN     "gender" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
