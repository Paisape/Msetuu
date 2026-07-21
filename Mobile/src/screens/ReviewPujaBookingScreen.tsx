import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Text } from 'react-native'

import { createPujaOrder, getPujaListing } from '../api/bookings'
import type { PersonDetail, PujaListing } from '../api/types'
import { Card, LoadingView, PrimaryButton, Screen, ScreenTitle, SectionTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewPujaBooking'>

export default function ReviewPujaBookingScreen({ route, navigation }: Props) {
  const { listingId, packageId, name, gender, dob, birthPlace, comment, devoteesJson } = route.params
  const devotees: PersonDetail[] = JSON.parse(devoteesJson)
  const [listing, setListing] = useState<PujaListing | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getPujaListing(listingId)
      .then(setListing)
      .catch(() => setListing(null))
  }, [listingId])

  const handlePay = async () => {
    setSubmitting(true)

    try {
      const { order, razorpayOrder } = await createPujaOrder({
        name,
        gender,
        dob,
        birthPlace,
        comment,
        pujaListingId: listingId,
        pujaPackageId: packageId,
        devotees
      })

      navigation.navigate('PaymentGateway', { razorpayOrder, orderType: 'EPUJA', orderId: order.id })
    } catch (err) {
      Alert.alert('Booking failed', err instanceof Error ? err.message : 'Please try again.')
      navigation.navigate('BookingResult', { success: false, message: err instanceof Error ? err.message : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  if (!listing) return <LoadingView />

  const pkg = listing.packages.find(p => p.id === packageId)

  return (
    <Screen>
      <ScreenTitle>Review Puja Booking</ScreenTitle>
      <Card>
        <Text style={{ fontWeight: '700' }}>{listing.title}</Text>
        {pkg && <Text style={{ color: '#ff6b35', fontWeight: '700', marginTop: 8 }}>{pkg.type} — ₹{pkg.offerPrice ?? pkg.price}</Text>}
      </Card>

      <SectionTitle>Booked By</SectionTitle>
      <Card>
        <Text>{name}</Text>
        <Text style={{ color: '#6b6b6b' }}>{birthPlace}</Text>
      </Card>

      {devotees.length > 0 && (
        <>
          <SectionTitle>Devotees</SectionTitle>
          {devotees.map((d, i) => (
            <Card key={i}>
              <Text>{d.name}{d.gotra ? ` — ${d.gotra} gotra` : ''}</Text>
            </Card>
          ))}
        </>
      )}

      <Text style={{ fontSize: 12, color: '#999', marginVertical: 8 }}>
        All bookings are FINAL: postponement/advancement/cancellation/refund is not allowed.
      </Text>
      <PrimaryButton label='Submit' onPress={handlePay} loading={submitting} />
    </Screen>
  )
}
