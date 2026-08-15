import { notFound } from 'next/navigation'
import prisma from '@/libs/prisma'
import OfferCheckoutModal from '@/components/OfferCheckoutModal'

type Props = {
  params: Promise<{ slug: string }>
}

// Disable global header/footer layout styling for this route (chrome-free page)
export const metadata = {
  title: 'Special Offering - Mandir Setuu',
  description: 'Book your devotional offerings and pujas'
}

export default async function OfferPage({ params }: Props) {
  const { slug } = await params

  // Fetch the offer link configuration from DB
  const offer = await prisma.offerLink.findUnique({
    where: { slug: slug.toLowerCase() }
  })

  if (!offer || !offer.isActive) {
    return notFound()
  }

  // Register analytic page view visit asynchronously (non-blocking)
  // Since we don't have request headers directly in Server Component context for IP address,
  // we record it as static visit or can pass client info if done on client,
  // but registering here gives database analytics tracking instantly.
  try {
    await prisma.offerLinkAnalytics.create({
      data: {
        offerLinkId: offer.id,
        ipAddress: 'Server-Side Render',
        userAgent: 'SSR Visitor'
      }
    })
  } catch {
    // Fail silently so it doesn't block page load
  }

  // Convert Decimal fields to strings for serialization across client boundaries
  const serializedOffer = {
    id: offer.id,
    title: offer.title,
    offerPrice: offer.offerPrice.toString(),
    salePrice: offer.salePrice.toString(),
    gstIncluded: offer.gstIncluded,
    gstRate: offer.gstRate.toString()
  }

  // Clean raw HTML content from structural wrappers (DOCTYPE, html, body) to match browser parse behavior
  const cleanedHtmlContent = offer.htmlContent
    .replace(/<!DOCTYPE html>/gi, '')
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '')
    .trim()

  return (
    <div className="relative min-h-screen bg-[#FAF8EB] flex flex-col items-center justify-start">
      {/* 1. Paste raw HTML design content dynamically, centralized with max-width and shadow */}
      <div 
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: cleanedHtmlContent }} 
        className="w-full max-w-[1200px] min-h-screen shadow-2xl bg-white flex-grow"
      />

      {/* 2. Mount the floating modal checkout form */}
      <OfferCheckoutModal offerLink={serializedOffer} />
    </div>
  )
}
