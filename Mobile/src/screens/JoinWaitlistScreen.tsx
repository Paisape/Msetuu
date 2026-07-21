import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Text } from 'react-native'

import { submitContact } from '../api/content'
import { Field, GapNotice, PrimaryButton, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'JoinWaitlist'>

export default function JoinWaitlistScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!firstName || !email) {
      Alert.alert('Missing details', 'Please share your name and email.')

      return
    }

    setSubmitting(true)

    try {
      await submitContact(`${firstName} ${lastName}`.trim(), email, note || 'Waitlist signup')
      navigation.navigate('BookingResult', { success: true, message: 'Thank you for joining our Waitlist!' })
    } catch (err) {
      Alert.alert('Submission failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <ScreenTitle>Join Waitlist</ScreenTitle>
      <Text style={{ color: '#6b6b6b', marginBottom: 12 }}>
        We are humbled by your interest in Mandir Setu. Join our Waitlist for early access.
      </Text>
      <Field label='First Name' value={firstName} onChangeText={setFirstName} placeholder='Abhijeet' />
      <Field label='Last Name' value={lastName} onChangeText={setLastName} placeholder='Sawant' />
      <Field label='Email Address' value={email} onChangeText={setEmail} placeholder='you@example.com' keyboardType='email-address' />
      <Field label='Your Query (optional)' value={note} onChangeText={setNote} placeholder='Write here' multiline />
      <PrimaryButton label='Submit' onPress={handleSubmit} loading={submitting} />
      <GapNotice>
        There&apos;s no dedicated Waitlist model on the backend — this submits through the generic
        /api/contact endpoint. See docs/MOBILE_API_MAPPING.md, &quot;Join Waitlist&quot; row.
      </GapNotice>
    </Screen>
  )
}
