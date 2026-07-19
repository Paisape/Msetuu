-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "buttonLink2" TEXT,
ADD COLUMN     "buttonText2" TEXT;

-- AlterTable
ALTER TABLE "DarshanTemple" ADD COLUMN     "description" TEXT,
ADD COLUMN     "location" TEXT;

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);
