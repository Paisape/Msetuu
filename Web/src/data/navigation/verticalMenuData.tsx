// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

const verticalMenuData = (dictionary: Awaited<ReturnType<typeof getDictionary>>): VerticalMenuDataType[] => [

  {
    label: 'Mandirsetuu',
    isSection: true,
    children: [
      {
        label: 'Dashboard',
        icon: 'tabler-building-temple',
        href: '/apps/mandir-setu'
      },
      {
        label: 'Orders',
        icon: 'tabler-shopping-cart',
        children: [
          { label: 'Chadhava Orders', href: '/apps/mandir-setu/orders/chadhava' },
          { label: 'E-Puja Orders', href: '/apps/mandir-setu/orders/epuja' },
          { label: 'Jyotish Consultations', href: '/apps/mandir-setu/orders/jyotish' },
          { label: 'Kundli Requests', href: '/apps/mandir-setu/orders/kundli' },
          { label: 'Ecommerce Orders', href: '/apps/mandir-setu/orders/ecommerce' },
          { label: 'Yatra Orders', href: '/apps/mandir-setu/orders/yatra' }
        ]
      },
      {
        label: 'Customers',
        icon: 'tabler-users',
        href: '/apps/mandir-setu/customers'
      },
      {
        label: 'Accounts',
        icon: 'tabler-receipt-2',
        children: [
          {
            label: 'Invoice',
            children: [
              { label: 'List', href: '/apps/mandir-setu/accounts/invoices' },
              { label: 'Cancelled', href: '/apps/mandir-setu/accounts/invoices/cancelled' },
              { label: 'Refund List', href: '/apps/mandir-setu/accounts/refunds' }
            ]
          }
        ]
      },
      {
        label: 'Operation',
        icon: 'tabler-video',
        children: [
          { label: 'Video Upload', href: '/apps/mandir-setu/operation/video-upload' },
          { label: 'Mantras', href: '/apps/mandir-setu/operation/mantra' }
        ]
      },
      {
        label: 'Content Management',
        icon: 'tabler-photo-edit',
        children: [
          { label: 'Banners', href: '/apps/mandir-setu/content/banners' },
          { label: 'Shop Purposes', href: '/apps/mandir-setu/content/shop-purposes' },
          { label: 'Chadhava Listings', href: '/apps/mandir-setu/content/chadhava-listings' },
          { label: 'E-Puja Listings', href: '/apps/mandir-setu/content/epuja-listings' },
          { label: 'Products', href: '/apps/mandir-setu/content/products' },
          { label: 'Categories', href: '/apps/mandir-setu/content/categories' },
          { label: 'Kundli Listings', href: '/apps/mandir-setu/content/kundli-listings' },
          { label: 'Astrologers', href: '/apps/mandir-setu/content/astrologers' },
          { label: 'Jyotish Time Slots', href: '/apps/mandir-setu/content/jyotish-time-slots' },
          { label: 'Darshan Temples', href: '/apps/mandir-setu/content/darshan-temples' },
          { label: 'FAQs', href: '/apps/mandir-setu/content/faqs' },
          { label: 'How It Works', href: '/apps/mandir-setu/content/how-it-works' },
          { label: 'Reviews', href: '/apps/mandir-setu/content/reviews' }
        ]
      },
      {
        label: 'Config',
        icon: 'tabler-lock-cog',
        href: '/apps/mandir-setu/config'
      }
    ]
  }
]

export default verticalMenuData
