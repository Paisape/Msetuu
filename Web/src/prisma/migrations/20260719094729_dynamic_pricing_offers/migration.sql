-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "packages" JSONB,
ADD COLUMN     "pricingType" TEXT NOT NULL DEFAULT 'FLAT';

-- AlterTable
ALTER TABLE "OfferOrder" ADD COLUMN     "devotees" JSONB,
ADD COLUMN     "packageName" TEXT,
ADD COLUMN     "personCount" INTEGER NOT NULL DEFAULT 1;
