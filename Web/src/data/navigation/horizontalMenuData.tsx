// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'
import type { getDictionary } from '@/utils/getDictionary'

const horizontalMenuData = (dictionary: Awaited<ReturnType<typeof getDictionary>>): HorizontalMenuDataType[] => [
  {
    label: 'Mandirsetuu',
    icon: 'tabler-building-temple',
    children: [
      { label: 'Dashboard', href: '/apps/mandir-setu' },
      {
        label: 'Orders',
        children: [
          { label: 'Chadhava Orders', href: '/apps/mandir-setu/orders/chadhava' },
          { label: 'E-Puja Orders', href: '/apps/mandir-setu/orders/epuja' },
          { label: 'Jyotish Consultations', href: '/apps/mandir-setu/orders/jyotish' },
          { label: 'Kundli Requests', href: '/apps/mandir-setu/orders/kundli' },
          { label: 'Ecommerce Orders', href: '/apps/mandir-setu/orders/ecommerce' },
          { label: 'Yatra Orders', href: '/apps/mandir-setu/orders/yatra' }
        ]
      },
      { label: 'Customers', href: '/apps/mandir-setu/customers' },
      {
        label: 'Accounts',
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
        children: [
          { label: 'Video Upload', href: '/apps/mandir-setu/operation/video-upload' },
          { label: 'Mantras', href: '/apps/mandir-setu/operation/mantra' }
        ]
      },
      {
        label: 'Content Management',
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
      }
    ]
  },

]

export default horizontalMenuData
