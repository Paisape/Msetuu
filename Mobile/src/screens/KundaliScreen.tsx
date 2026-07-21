import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Text } from 'react-native'

import { getMyKundliOrders } from '../api/bookings'
import type { KundliOrder } from '../api/types'
import { Card, Field, PrimaryButton, Screen, ScreenTitle, SectionTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Kundali'>

export default function KundaliScreen({ route, navigation }: Props) {
  const { listingId, listingTitle } = route.params
  const [orders, setOrders] = useState<KundliOrder[]>([])
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [timeOfBirth, setTimeOfBirth] = useState('')
  const [birthPlace, setBirthPlace] = useState('')

  useFocusEffect(
    useCallback(() => {
      getMyKundliOrders()
        .then(setOrders)
        .catch(() => setOrders([]))
    }, [])
  )

  const handleRequest = () => {
    if (!listingId) {
      Alert.alert('Pick a Kundali type first', 'Go back and choose a Kundali package.')

      return
    }

    if (!name || !gender || !dob || !birthPlace) {
      Alert.alert('Missing details', 'Please fill in name, gender, date of birth and birth place.')

      return
    }

    navigation.navigate('ReviewKundliBooking', { listingId, name, gender, dob, timeOfBirth: timeOfBirth || undefined, birthPlace })
  }

  return (
    <Screen>
      <ScreenTitle>Kundali</ScreenTitle>

      {orders.length > 0 && (
        <>
          <SectionTitle>Your Kundalis</SectionTitle>
          {orders.map(order => (
            <Card key={order.id}>
              <Text style={{ fontWeight: '700' }}>{order.kundliListing?.title ?? 'Kundali request'}</Text>
              <Text style={{ color: '#6b6b6b', marginTop: 4 }}>Status: {order.status}</Text>
            </Card>
          ))}
        </>
      )}

      <SectionTitle>Request New Kundali{listingTitle ? ` — ${listingTitle}` : ''}</SectionTitle>
      <Field label='Name' value={name} onChangeText={setName} placeholder='Abhijeet Patil' />
      <Field label='Gender' value={gender} onChangeText={setGender} placeholder='Male / Female / Other' />
      <Field label='Date of birth' value={dob} onChangeText={setDob} placeholder='YYYY-MM-DD' />
      <Field label='Time of birth (optional)' value={timeOfBirth} onChangeText={setTimeOfBirth} placeholder='04:00 AM' />
      <Field label='Birth place' value={birthPlace} onChangeText={setBirthPlace} placeholder='Pune, Maharashtra' />
      <PrimaryButton label='Request New Kundali' onPress={handleRequest} />
      <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>Kundali generation may take up to 48 hours.</Text>
    </Screen>
  )
}
