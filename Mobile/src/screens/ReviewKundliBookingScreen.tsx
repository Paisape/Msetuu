import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Text } from 'react-native'

import { createKundliOrder } from '../api/bookings'
import { Card, PrimaryButton, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'ReviewKundliBooking'>

export default function ReviewKundliBookingScreen({ route, navigation }: Props) {
  const { listingId, name, gender, dob, timeOfBirth, birthPlace, comment } = route.params
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      const { order, razorpayOrder } = await createKundliOrder({ name, gender, dob, timeOfBirth, birthPlace, comment, kundliListingId: listingId })

      if (razorpayOrder) {
        navigation.navigate('PaymentGateway', { razorpayOrder, orderType: 'KUNDLI', orderId: order.id })
      } else {
        navigation.navigate('BookingResult', { success: true, message: 'Your Kundali request has been submitted.' })
      }
    } catch (err) {
      Alert.alert('Request failed', err instanceof Error ? err.message : 'Please try again.')
      navigation.navigate('BookingResult', { success: false, message: err instanceof Error ? err.message : undefined })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <ScreenTitle>Review Kundali Request</ScreenTitle>
      <Card>
        <Text>{name}</Text>
        <Text style={{ color: '#6b6b6b' }}>{birthPlace}</Text>
        <Text style={{ color: '#6b6b6b' }}>{dob}{timeOfBirth ? `, ${timeOfBirth}` : ''}</Text>
        <Text style={{ color: '#6b6b6b' }}>{gender}</Text>
      </Card>
      <PrimaryButton label='Request Kundali' onPress={handleSubmit} loading={submitting} />
      <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>It may take up to 48 hours to prepare the best Kundali.</Text>
    </Screen>
  )
}
