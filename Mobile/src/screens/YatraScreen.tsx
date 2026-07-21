import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { Alert, Text } from 'react-native'

import { createYatraBooking, getMyYatraBookings } from '../api/yatra'
import type { YatraBooking } from '../api/types'
import { Card, Field, PrimaryButton, Screen, ScreenTitle, SectionTitle } from '../components/ui'

export default function YatraScreen() {
  const [bookings, setBookings] = useState<YatraBooking[]>([])
  const [name, setName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [cityOfDeparture, setCityOfDeparture] = useState('')
  const [destination, setDestination] = useState('')
  const [totalTravelers, setTotalTravelers] = useState('1')
  const [travelDate, setTravelDate] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useFocusEffect(
    useCallback(() => {
      getMyYatraBookings()
        .then(setBookings)
        .catch(() => setBookings([]))
    }, [])
  )

  const handleSubmit = async () => {
    if (!name || !contactNumber || !cityOfDeparture || !destination || !travelDate) {
      Alert.alert('Missing details', 'Please fill in every field.')

      return
    }

    setSubmitting(true)

    try {
      await createYatraBooking({
        name,
        contactNumber,
        cityOfDeparture,
        destination,
        totalTravelers: Number(totalTravelers) || 1,
        travelDate,
        comment: comment || undefined
      })
      Alert.alert('Request submitted', 'We will reach out to confirm your Yatra booking.')
      setName('')
      setContactNumber('')
      setCityOfDeparture('')
      setDestination('')
      setTotalTravelers('1')
      setTravelDate('')
      setComment('')
      getMyYatraBookings()
        .then(setBookings)
        .catch(() => {})
    } catch (err) {
      Alert.alert('Request failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <ScreenTitle>Yatra</ScreenTitle>

      {bookings.length > 0 && (
        <>
          <SectionTitle>Your Yatra Requests</SectionTitle>
          {bookings.map(b => (
            <Card key={b.id}>
              <Text style={{ fontWeight: '700' }}>{b.yatraDestination}</Text>
              <Text style={{ color: '#6b6b6b', marginTop: 2 }}>From {b.cityOfDeparture} · {b.travelDate}</Text>
              <Text style={{ color: '#ff6b35', fontWeight: '700', marginTop: 4 }}>{b.status}</Text>
            </Card>
          ))}
        </>
      )}

      <SectionTitle>Plan a Pilgrimage Tour</SectionTitle>
      <Field label='Your name' value={name} onChangeText={setName} placeholder='Abhijeet Patil' />
      <Field label='Contact number' value={contactNumber} onChangeText={setContactNumber} placeholder='98765 43210' keyboardType='phone-pad' />
      <Field label='City of departure' value={cityOfDeparture} onChangeText={setCityOfDeparture} placeholder='Pune' />
      <Field label='Yatra destination' value={destination} onChangeText={setDestination} placeholder='Kedarnath, Uttarakhand' />
      <Field label='Total travelers' value={totalTravelers} onChangeText={setTotalTravelers} keyboardType='numeric' />
      <Field label='Travel date' value={travelDate} onChangeText={setTravelDate} placeholder='YYYY-MM-DD' />
      <Field label='Note (optional)' value={comment} onChangeText={setComment} placeholder='Anything else we should know' multiline />
      <PrimaryButton label='Submit Request' onPress={handleSubmit} loading={submitting} />
    </Screen>
  )
}
