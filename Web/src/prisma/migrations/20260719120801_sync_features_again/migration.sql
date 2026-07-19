-- AlterTable
ALTER TABLE "PujaListing" ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "significance" TEXT,
ADD COLUMN     "templeLocation" TEXT,
ADD COLUMN     "templeName" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "media" JSONB;

-- CreateTable
CREATE TABLE "HowItWorksStep" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HowItWorksStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HowItWorksStep_page_idx" ON "HowItWorksStep"("page");
