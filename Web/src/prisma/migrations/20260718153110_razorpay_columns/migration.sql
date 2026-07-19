-- AlterTable
ALTER TABLE "Astrologer" ADD COLUMN     "gstInclusive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "gstPercentage" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "offerPrice30" DOUBLE PRECISION,
ADD COLUMN     "offerPrice60" DOUBLE PRECISION,
ADD COLUMN     "price30" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "price60" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ChadhavaOrder" ADD COLUMN     "personCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "persons" JSONB,
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySignature" TEXT,
ADD COLUMN     "videoExpired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoUploadedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ConsultationBooking" ADD COLUMN     "amountPaid" DOUBLE PRECISION,
ADD COLUMN     "gstInclusive" BOOLEAN DEFAULT true,
ADD COLUMN     "gstPercentage" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySignature" TEXT;

-- AlterTable
ALTER TABLE "KundliOrder" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySignature" TEXT;

-- AlterTable
ALTER TABLE "ProductOrder" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySignature" TEXT;

-- AlterTable
ALTER TABLE "PujaOrder" ADD COLUMN     "razorpayOrderId" TEXT,
ADD COLUMN     "razorpayPaymentId" TEXT,
ADD COLUMN     "razorpaySignature" TEXT,
ADD COLUMN     "videoExpired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoUploadedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VideoUploadBatch" (
    "id" TEXT NOT NULL,
    "createdById" TEXT,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoUploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoUploadItem" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "driveLink" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoUploadItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoUploadItem_orderType_orderId_idx" ON "VideoUploadItem"("orderType", "orderId");

-- AddForeignKey
ALTER TABLE "VideoUploadBatch" ADD CONSTRAINT "VideoUploadBatch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoUploadItem" ADD CONSTRAINT "VideoUploadItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "VideoUploadBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
