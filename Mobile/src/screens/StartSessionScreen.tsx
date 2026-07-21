import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Text, View } from 'react-native'

import { createConsultationBooking } from '../api/jyotish'
import { Card, Field, PrimaryButton, Screen, ScreenTitle, SectionTitle } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'StartSession'>

const DURATIONS: (30 | 60)[] = [30, 60]

export default function StartSessionScreen({ route, navigation }: Props) {
  const { astrologerId, mode } = route.params
  const { user } = useAuth()
  const [duration, setDuration] = useState<30 | 60>(30)
  const [category, setCategory] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [timeOfBirth, setTimeOfBirth] = useState('')
  const [placeOfBirth, setPlaceOfBirth] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleContinue = async () => {
    if (!category || !phone || !dob || !timeOfBirth || !placeOfBirth || comment.trim().split(/\s+/).length < 10) {
      Alert.alert('Missing details', 'Please fill in every field. Your question needs to be at least 10 words so the astrologer has context.')

      return
    }

    if (!user?.name || !user?.email) {
      Alert.alert('Sign in required', 'Please sign in again.')

      return
    }

    setSubmitting(true)

    try {
      const { booking, razorpayOrder } = await createConsultationBooking({
        category,
        slotTime: new Date().toISOString(),
        name: user.name,
        email: user.email,
        phone,
        dob,
        timeOfBirth,
        placeOfBirth,
        duration,
        comment,
        astrologerId
      })

      if (razorpayOrder) {
        navigation.navigate('PaymentGateway', { razorpayOrder, orderType: 'JYOTISH', orderId: booking.id })
      } else {
        navigation.navigate('SessionGap', { astrologerId, mode })
      }
    } catch (err) {
      Alert.alert('Booking failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <ScreenTitle>{mode === 'chat' ? 'Start Chat' : 'Start Call'}</ScreenTitle>

      <SectionTitle>Duration</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {DURATIONS.map(d => (
          <View key={d} style={{ flex: 1 }}>
            <Card onPress={() => setDuration(d)}>
              <Text style={{ fontWeight: duration === d ? '700' : '500', textAlign: 'center' }}>{d} min</Text>
            </Card>
          </View>
        ))}
      </View>

      <SectionTitle>Your Details</SectionTitle>
      <Field label='Topic / category' value={category} onChangeText={setCategory} placeholder='Career, Marriage, Health…' />
      <Field label='Phone' value={phone} onChangeText={setPhone} placeholder='98765 43210' keyboardType='phone-pad' />
      <Field label='Date of birth' value={dob} onChangeText={setDob} placeholder='YYYY-MM-DD' />
      <Field label='Time of birth' value={timeOfBirth} onChangeText={setTimeOfBirth} placeholder='04:00 AM' />
      <Field label='Place of birth' value={placeOfBirth} onChangeText={setPlaceOfBirth} placeholder='Pune, Maharashtra' />
      <Field label='Your question (10+ words)' value={comment} onChangeText={setComment} placeholder='Share context for the astrologer' multiline />

      <PrimaryButton label='Continue' onPress={handleContinue} loading={submitting} />
    </Screen>
  )
}
