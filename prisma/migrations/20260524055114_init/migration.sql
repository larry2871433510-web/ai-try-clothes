-- CreateEnum
CREATE TYPE "GarmentType" AS ENUM ('T_SHIRT', 'SHIRT', 'HOODIE', 'COAT', 'PANTS', 'SKIRT', 'DRESS');

-- CreateEnum
CREATE TYPE "AspectRatio" AS ENUM ('RATIO_1_1', 'RATIO_3_4', 'RATIO_4_5', 'RATIO_9_16');

-- CreateEnum
CREATE TYPE "TryOnTaskStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Garment" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "type" "GarmentType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Garment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "style" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryOnTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "garmentImageUrl" TEXT NOT NULL,
    "personImageUrl" TEXT,
    "aiModelId" TEXT,
    "garmentType" "GarmentType" NOT NULL,
    "aspectRatio" "AspectRatio" NOT NULL,
    "status" "TryOnTaskStatus" NOT NULL DEFAULT 'PENDING',
    "resultImageUrl" TEXT,
    "errorMessage" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "TryOnTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TryOnTask_createdAt_idx" ON "TryOnTask"("createdAt");

-- CreateIndex
CREATE INDEX "TryOnTask_status_idx" ON "TryOnTask"("status");

-- CreateIndex
CREATE INDEX "TryOnTask_aiModelId_idx" ON "TryOnTask"("aiModelId");

-- AddForeignKey
ALTER TABLE "Garment" ADD CONSTRAINT "Garment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnTask" ADD CONSTRAINT "TryOnTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnTask" ADD CONSTRAINT "TryOnTask_aiModelId_fkey" FOREIGN KEY ("aiModelId") REFERENCES "AiModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
