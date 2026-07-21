import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Text, View } from 'react-native'

import { Field, PrimaryButton, Screen, ScreenTitle, SecondaryButton, SectionTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'
import type { PersonDetail } from '../api/types'

type Props = NativeStackScreenProps<RootStackParamList, 'PujaForm'>

export default function PujaFormScreen({ route, navigation }: Props) {
  const { listingId, packageId } = route.params
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [comment, setComment] = useState('')
  const [devotees, setDevotees] = useState<PersonDetail[]>([{ name: '', gotra: '' }])

  const updateDevotee = (index: number, field: keyof PersonDetail, value: string) => {
    setDevotees(prev => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)))
  }

  const handleContinue = () => {
    if (!name || !gender || !dob || !birthPlace) {
      Alert.alert('Missing details', 'Please fill in name, gender, date of birth and birth place.')

      return
    }

    navigation.navigate('ReviewPujaBooking', {
      listingId,
      packageId,
      name,
      gender,
      dob,
      birthPlace,
      comment: comment || undefined,
      devoteesJson: JSON.stringify(devotees.filter(d => d.name.trim()))
    })
  }

  return (
    <Screen>
      <ScreenTitle>Puja Details</ScreenTitle>
      <Field label='Your name' value={name} onChangeText={setName} placeholder='Abhijeet Patil' />
      <Field label='Gender' value={gender} onChangeText={setGender} placeholder='Male / Female / Other' />
      <Field label='Date of birth' value={dob} onChangeText={setDob} placeholder='YYYY-MM-DD' />
      <Field label='Birth place' value={birthPlace} onChangeText={setBirthPlace} placeholder='Pune, Maharashtra' />
      <Field label='Note (optional)' value={comment} onChangeText={setComment} placeholder='Special request' multiline />

      <SectionTitle>Devotees</SectionTitle>
      {devotees.map((d, index) => (
        <View key={index}>
          <Field label={`Devotee ${index + 1} name`} value={d.name} onChangeText={v => updateDevotee(index, 'name', v)} placeholder='Name' />
          <Field label='Gotra' value={d.gotra} onChangeText={v => updateDevotee(index, 'gotra', v)} placeholder='Gotra' />
        </View>
      ))}
      <SecondaryButton label='+ Add another devotee' onPress={() => setDevotees(prev => [...prev, { name: '', gotra: '' }])} />

      <PrimaryButton label='Continue' onPress={handleContinue} />
      <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
        Total (including GST) is calculated by the server from the package price.
      </Text>
    </Screen>
  )
}
