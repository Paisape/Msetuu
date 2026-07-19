-- AlterTable
ALTER TABLE "ChadhavaListing" ADD COLUMN     "gstInclusive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "gstPercentage" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "offerPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "KundliOrder" ADD COLUMN     "kundliListingId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "gstInclusive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "gstPercentage" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "offerPrice" DOUBLE PRECISION,
ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 5.0,
ADD COLUMN     "reviewsCount" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "PujaPackage" ADD COLUMN     "gstInclusive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "gstPercentage" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "offerPrice" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "KundliListing" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "delivery" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "offerPrice" DOUBLE PRECISION,
    "gstPercentage" DOUBLE PRECISION DEFAULT 0,
    "gstInclusive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KundliListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopPurpose" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopPurpose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image" TEXT NOT NULL,
    "buttonText" TEXT,
    "buttonLink" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "KundliOrder" ADD CONSTRAINT "KundliOrder_kundliListingId_fkey" FOREIGN KEY ("kundliListingId") REFERENCES "KundliListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
