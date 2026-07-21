export type AuthUser = {
  id: string
  name: string | null
  email: string | null
  role: 'USER' | 'ADMIN' | 'ASTROLOGER'
  image?: string | null
}

export type Banner = {
  id: string
  page: string
  title: string
  subtitle?: string | null
  image: string
  buttonText?: string | null
  buttonLink?: string | null
  order: number
  active: boolean
}

export type Category = {
  id: string
  module: 'epuja' | 'ecommerce'
  name: string
  order: number
  active: boolean
}

export type Faq = {
  id: string
  page: string
  question: string
  answer: string
  order: number
  active: boolean
}

export type Mantra = {
  id: string
  title: string
  subtitle: string
  fileUrl: string
  duration: string
  deity: string
}

export type DarshanTemple = {
  id: string
  name: string
  location?: string | null
  description?: string | null
  image: string
  qrCodeUrl: string
  model3dUrl: string
}

export type PujaPackage = {
  id: string
  pujaListingId: string
  type: 'SINGLE' | 'COUPLE' | 'FAMILY'
  price: number
  offerPrice?: number | null
  gstPercentage: number
  gstInclusive: boolean
}

export type PujaListing = {
  id: string
  title: string
  description: string
  image: string
  price: number
  category: string
  templeName?: string | null
  templeLocation?: string | null
  significance?: string | null
  benefits?: string | null
  packages: PujaPackage[]
}

export type PujaOrder = {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  amountPaid?: number | null
  createdAt: string
  pujaListing?: PujaListing
  pujaPackage?: PujaPackage
}

export type ChadhavaListing = {
  id: string
  title: string
  description: string
  location?: string | null
  image: string
  price: number
  offerPrice?: number | null
  gstPercentage: number
  gstInclusive: boolean
}

export type ChadhavaOrder = {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  amountPaid?: number | null
  createdAt: string
  chadhavaListing?: ChadhavaListing
}

export type KundliListing = {
  id: string
  title: string
  description: string
  delivery: string
  image: string
  price: number
  offerPrice?: number | null
}

export type KundliOrder = {
  id: string
  status: 'PENDING' | 'SHARED_WITH_PANDIT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  createdAt: string
  kundliListing?: KundliListing
}

export type Astrologer = {
  id: string
  name: string
  bio: string
  image: string
  rating: number
  specialties: string
  price30: number
  offerPrice30?: number | null
  price60: number
  offerPrice60?: number | null
}

export type ConsultationBooking = {
  id: string
  category: string
  durationMins: number
  slotTime: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  createdAt: string
  astrologer?: Astrologer
}

export type RazorpayOrder = {
  id: string
  amount: number
  currency: string
  key: string
} | null

export type MyOrder = {
  type: 'CHADHAVA' | 'EPUJA' | 'JYOTISH' | 'KUNDLI' | 'ECOMMERCE' | 'YATRA'
  id: string
  label: string
  amount: number
  status: string
  paymentStatus: string
  createdAt: string
}

export type Product = {
  id: string
  name: string
  category: string
  price: number
  offerPrice?: number | null
  image: string
  description: string
  isBestSeller: boolean
}

export type GeoTagPhoto = {
  id: string
  imageUrl: string
  latitude?: number | null
  longitude?: number | null
  createdAt: string
}

export type YatraBooking = {
  id: string
  name: string
  contactNumber: string
  cityOfDeparture: string
  yatraDestination: string
  totalTravelers: number
  travelDate: string
  comment?: string | null
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'
  createdAt: string
}

export type PersonDetail = { name: string; gotra: string }

export type PaymentOrderType = 'CHADHAVA' | 'EPUJA' | 'JYOTISH' | 'KUNDLI' | 'ECOMMERCE' | 'OFFER'
