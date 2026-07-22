import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Text } from 'react-native'

import { createChadhavaOrder, getChadhavaListing } from '../api/bookings'
import type { ChadhavaListing, PersonDetail } from '../api/types'
import { Card, LoadingView, PrimaryButton, Screen, ScreenTitle, SectionTitle } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewChadhavaBooking'>

export default function ReviewChadhavaBookingScreen({ route, navigation }: Props) {
  const { listingId, name, gender, dob, birthPlace, comment, personsJson } = route.params
  const persons: PersonDetail[] = JSON.parse(personsJson)
  const { user } = useAuth()
  const [listing, setListing] = useState<ChadhavaListing | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getChadhavaListing(listingId)
      .then(setListing)
      .catch(() => setListing(null))
  }, [listingId])

  const handlePay = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in or create an account to complete your chadhava booking.', [
        { text: 'Sign In', onPress: () => navigation.navigate('SignIn') },
        { text: 'Cancel', style: 'cancel' }
      ])

      return
    }

    setSubmitting(true)

    try {
      const { order, razorpayOrder } = await createChadhavaOrder({ name, gender, dob, birthPlace, comment, chadhavaListingId: listingId, persons })

      navigation.navigate('PaymentGateway', { razorpayOrder, orderType: 'CHADHAVA', orderId: order.id })
    } catch (err) {
      Alert.alert('Booking failed', err instanceof Error ? err.message : 'Please try again.')
      navigation.navigate('BookingResult', { success: false, message: err instanceof Error ? err.message : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  if (!listing) return <LoadingView />

  return (
    <Screen>
      <ScreenTitle>Chadhava Details</ScreenTitle>
      <Card>
        <Text style={{ fontWeight: '700' }}>{listing.title}</Text>
        <Text style={{ color: '#6b6b6b', marginTop: 4 }}>{listing.location}</Text>
        <Text style={{ color: '#ff6b35', fontWeight: '700', marginTop: 8 }}>
          ₹{(listing.offerPrice ?? listing.price) * persons.length} for {persons.length} {persons.length === 1 ? 'person' : 'people'}
        </Text>
      </Card>

      <SectionTitle>Chadhava From</SectionTitle>
      <Card>
        <Text>{name}</Text>
        <Text style={{ color: '#6b6b6b' }}>{birthPlace}</Text>
      </Card>

      <SectionTitle>Persons</SectionTitle>
      {persons.map((p, i) => (
        <Card key={i}>
          <Text>{p.name}{p.gotra ? ` — ${p.gotra} gotra` : ''}</Text>
        </Card>
      ))}

      <Text style={{ fontSize: 12, color: '#999', marginVertical: 8 }}>
        All bookings are FINAL: postponement/cancellation/refund policies apply as shown on the temple listing.
      </Text>
      <PrimaryButton label='Proceed to Pay' onPress={handlePay} loading={submitting} />
    </Screen>
  )
}
