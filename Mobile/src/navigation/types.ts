import type { MyOrder, PaymentOrderType, RazorpayOrder } from '../api/types'

export type RootStackParamList = {
  Splash: undefined
  SignIn: undefined
  Register: undefined
  OTPVerification: { email: string }

  Home: undefined
  PilgrimServices: undefined
  GodGoddesses: undefined
  CitySearch: undefined

  ChadhavaList: undefined

  PujaList: { category?: string }
  PujaDetails: { id: string }
  PujaForm: { listingId: string; packageId: string }
  ReviewPujaBooking: {
    listingId: string
    packageId: string
    name: string
    gender: string
    dob: string
    birthPlace: string
    comment?: string
    devoteesJson: string // PersonDetail[] serialized — keeps nav params plain/serializable
  }

  ChadhavaForm: { listingId: string }
  ReviewChadhavaBooking: {
    listingId: string
    name: string
    gender: string
    dob: string
    birthPlace: string
    comment?: string
    personsJson: string // PersonDetail[] serialized
  }

  BookingResult: { success: boolean; message?: string }
  PaymentGateway: { razorpayOrder: RazorpayOrder; orderType: PaymentOrderType; orderId: string }

  DarshanList: undefined

  MyBookings: undefined
  BookingDetail: { type: MyOrder['type']; id: string; label: string }

  Horoscope: undefined
  Kundali: { listingId?: string; listingTitle?: string }
  ReviewKundliBooking: {
    listingId: string
    name: string
    gender: string
    dob: string
    timeOfBirth?: string
    birthPlace: string
    comment?: string
  }

  Aartis: undefined
  AartiLyrics: { mantraId: string }

  FAQs: { page: string }
  JoinWaitlist: undefined

  SearchPujaExpertise: undefined
  Yatra: undefined
  Notifications: undefined

  AstrologerList: undefined
  AstrologerProfile: { id: string }
  StartSession: { astrologerId: string; mode: 'chat' | 'call' }
  SessionGap: { astrologerId: string; mode: 'chat' | 'call' }
  SpecializationFilter: { kind: 'specialization' | 'language' }

  EditProfile: undefined
  CameraGeotag: undefined
  TaggedSuccessfully: undefined
}
