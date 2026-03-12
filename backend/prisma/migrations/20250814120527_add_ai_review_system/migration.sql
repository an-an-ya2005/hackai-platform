-- CreateEnum
CREATE TYPE "public"."ReviewType" AS ENUM ('EXTERNAL_IDEA', 'INTERNAL_IDEA', 'CATEGORIZATION', 'IMPLEMENTATION_FEASIBILITY', 'COST_ANALYSIS', 'CUSTOMER_IMPACT', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "public"."ReviewResult" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."ApplicationStatus" ADD VALUE 'EXTERNAL_IDEA_REVIEW';
ALTER TYPE "public"."ApplicationStatus" ADD VALUE 'INTERNAL_IDEA_REVIEW';
ALTER TYPE "public"."ApplicationStatus" ADD VALUE 'CATEGORIZATION';
ALTER TYPE "public"."ApplicationStatus" ADD VALUE 'IMPLEMENTATION_REVIEW';
ALTER TYPE "public"."ApplicationStatus" ADD VALUE 'COST_REVIEW';
ALTER TYPE "public"."ApplicationStatus" ADD VALUE 'IMPACT_REVIEW';

-- AlterTable
ALTER TABLE "public"."applications" ADD COLUMN     "category" TEXT,
ADD COLUMN     "estimatedCost" DOUBLE PRECISION,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rejectionReason" TEXT;

-- CreateTable
CREATE TABLE "public"."ai_reviews" (
    "id" TEXT NOT NULL,
    "type" "public"."ReviewType" NOT NULL,
    "result" "public"."ReviewResult" NOT NULL DEFAULT 'PENDING',
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "ai_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_reviews_applicationId_type_key" ON "public"."ai_reviews"("applicationId", "type");

-- AddForeignKey
ALTER TABLE "public"."ai_reviews" ADD CONSTRAINT "ai_reviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
