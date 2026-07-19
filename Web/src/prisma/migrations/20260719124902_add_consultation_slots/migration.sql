-- AlterTable
ALTER TABLE "ChadhavaListing" ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "secondaryTabLabel" TEXT,
ADD COLUMN     "significance" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "secondaryTabLabel" TEXT,
ADD COLUMN     "significance" TEXT,
ADD COLUMN     "sourceLocation" TEXT,
ADD COLUMN     "sourceName" TEXT;

-- AlterTable
ALTER TABLE "PujaListing" ADD COLUMN     "secondaryTabLabel" TEXT;

-- AlterTable
ALTER TABLE "PujaOrder" ADD COLUMN     "devotees" JSONB;

-- CreateTable
CREATE TABLE "ConsultationTimeSlot" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationTimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Category_module_idx" ON "Category"("module");

-- CreateIndex
CREATE UNIQUE INDEX "Category_module_name_key" ON "Category"("module", "name");
