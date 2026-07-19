import type { OrderColumn } from '@/components/admin/OrderTable'

export type OrderModuleConfig = {
  title: string
  listUrl: string
  patchUrl: (id: string) => string
  statusOptions: string[]
  columns: OrderColumn[]
  searchPlaceholder: string
  searchFields: string[]
}

const money = (v: unknown) => (v || v === 0 ? `₹${v}` : '—')
const date = (v: unknown) => (v ? new Date(v as string).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export const ORDER_MODULES: Record<string, OrderModuleConfig> = {
  chadhava: {
    title: 'Chadhava Orders',
    listUrl: '/api/chadhava',
    patchUrl: id => `/api/chadhava/${id}`,
    statusOptions: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
    searchPlaceholder: 'Search by devotee or temple...',
    searchFields: ['name', 'chadhavaListing.title'],
    columns: [
      { key: 'name', label: 'Devotee' },
      { key: 'chadhavaListing.title', label: 'Chadhava' },
      { key: 'personCount', label: 'Persons', render: item => item.personCount ?? 1 },
      { key: 'amountPaid', label: 'Amount', render: item => money(item.amountPaid ?? item.chadhavaListing?.price) },
      { key: 'paymentStatus', label: 'Payment' },
      { key: 'createdAt', label: 'Date', render: item => date(item.createdAt) }
    ]
  },
  epuja: {
    title: 'E-Puja Orders',
    listUrl: '/api/epuja',
    patchUrl: id => `/api/epuja/${id}`,
    statusOptions: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
    searchPlaceholder: 'Search by devotee or puja...',
    searchFields: ['name', 'pujaListing.title'],
    columns: [
      { key: 'name', label: 'Devotee' },
      { key: 'pujaListing.title', label: 'Puja' },
      { key: 'pujaPackage.type', label: 'Package' },
      { key: 'amountPaid', label: 'Amount', render: item => money(item.amountPaid ?? item.pujaPackage?.price) },
      { key: 'paymentStatus', label: 'Payment' },
      { key: 'createdAt', label: 'Date', render: item => date(item.createdAt) }
    ]
  },
  jyotish: {
    title: 'Jyotish Consultations',
    listUrl: '/api/jyotish',
    patchUrl: id => `/api/jyotish/${id}`,
    statusOptions: ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
    searchPlaceholder: 'Search by customer or category...',
    searchFields: ['user.name', 'category'],
    columns: [
      { key: 'user.name', label: 'Customer' },
      { key: 'category', label: 'Category' },
      { key: 'durationMins', label: 'Duration', render: item => `${item.durationMins} min` },
      { key: 'astrologer.name', label: 'Astrologer', render: item => item.astrologer?.name || 'Unassigned' },
      { key: 'amountPaid', label: 'Amount', render: item => money(item.amountPaid) },
      { key: 'paymentStatus', label: 'Payment' },
      { key: 'slotTime', label: 'Slot', render: item => date(item.slotTime) }
    ]
  },
  kundli: {
    title: 'Kundli Requests',
    listUrl: '/api/kundli',
    patchUrl: id => `/api/kundli/${id}`,
    statusOptions: ['PENDING', 'SHARED_WITH_PANDIT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'],
    searchPlaceholder: 'Search by name or Kundli type...',
    searchFields: ['name', 'kundliType'],
    columns: [
      { key: 'name', label: 'Customer' },
      { key: 'kundliType', label: 'Kundli Type' },
      { key: 'amountPaid', label: 'Amount', render: item => money(item.amountPaid) },
      { key: 'paymentStatus', label: 'Payment' },
      { key: 'createdAt', label: 'Date', render: item => date(item.createdAt) }
    ]
  },
  ecommerce: {
    title: 'Ecommerce Orders',
    listUrl: '/api/ecommerce',
    patchUrl: id => `/api/ecommerce/${id}`,
    statusOptions: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    searchPlaceholder: 'Search by product...',
    searchFields: ['product.name'],
    columns: [
      { key: 'product.name', label: 'Product' },
      { key: 'quantity', label: 'Qty' },
      { key: 'totalAmount', label: 'Amount', render: item => money(item.totalAmount) },
      { key: 'paymentStatus', label: 'Payment' },
      { key: 'createdAt', label: 'Date', render: item => date(item.createdAt) }
    ]
  },
  yatra: {
    title: 'Yatra Orders',
    listUrl: '/api/yatra',
    patchUrl: id => `/api/yatra/${id}`,
    statusOptions: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    searchPlaceholder: 'Search by name or destination...',
    searchFields: ['name', 'yatraDestination'],
    columns: [
      { key: 'name', label: 'Traveler' },
      { key: 'yatraDestination', label: 'Destination' },
      { key: 'totalTravelers', label: 'Travelers' },
      { key: 'travelDate', label: 'Travel Date', render: item => date(item.travelDate) },
      { key: 'contactNumber', label: 'Contact' }
    ]
  },
  offer: {
    title: 'Offer Orders',
    listUrl: '/api/offer/orders',
    patchUrl: id => `/api/offer/orders/${id}`,
    statusOptions: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
    searchPlaceholder: 'Search by devotee or offer title...',
    searchFields: ['name', 'offer.title'],
    columns: [
      { key: 'name', label: 'Devotee' },
      { key: 'offer.title', label: 'Offer' },
      { key: 'packageName', label: 'Type / Tier', render: item => item.packageName ? item.packageName : item.personCount > 1 ? `${item.personCount} Devotees` : 'Standard' },
      { key: 'amountPaid', label: 'Amount Paid', render: item => money(item.amountPaid) },
      { key: 'paymentStatus', label: 'Payment' },
      { key: 'createdAt', label: 'Date', render: item => date(item.createdAt) }
    ]
  }
}

export const ORDER_TYPE_MAP: Record<string, string> = {
  chadhava: 'CHADHAVA',
  epuja: 'EPUJA',
  jyotish: 'JYOTISH',
  kundli: 'KUNDLI',
  ecommerce: 'ECOMMERCE',
  yatra: 'YATRA',
  offer: 'OFFER'
}
