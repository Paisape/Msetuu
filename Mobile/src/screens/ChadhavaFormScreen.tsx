import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Text, View } from 'react-native'

import { Field, PrimaryButton, Screen, ScreenTitle, SecondaryButton, SectionTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'
import type { PersonDetail } from '../api/types'

type Props = NativeStackScreenProps<RootStackParamList, 'ChadhavaForm'>

export default function ChadhavaFormScreen({ route, navigation }: Props) {
  const { listingId } = route.params
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [comment, setComment] = useState('')
  const [persons, setPersons] = useState<PersonDetail[]>([{ name: '', gotra: '' }])

  const updatePerson = (index: number, field: keyof PersonDetail, value: string) => {
    setPersons(prev => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  const handleContinue = () => {
    if (!name || !gender || !dob || !birthPlace) {
      Alert.alert('Missing details', 'Please fill in name, gender, date of birth and birth place.')

      return
    }

    const validPersons = persons.filter(p => p.name.trim())

    if (validPersons.length === 0) {
      Alert.alert('Add a person', 'Please add at least one person for the chadhava.')

      return
    }

    navigation.navigate('ReviewChadhavaBooking', {
      listingId,
      name,
      gender,
      dob,
      birthPlace,
      comment: comment || undefined,
      personsJson: JSON.stringify(validPersons)
    })
  }

  return (
    <Screen>
      <ScreenTitle>Chadhava Details</ScreenTitle>
      <Field label='Your name' value={name} onChangeText={setName} placeholder='Abhijeet Patil' />
      <Field label='Gender' value={gender} onChangeText={setGender} placeholder='Male / Female / Other' />
      <Field label='Date of birth' value={dob} onChangeText={setDob} placeholder='YYYY-MM-DD' />
      <Field label='Birth place' value={birthPlace} onChangeText={setBirthPlace} placeholder='Pune, Maharashtra' />
      <Field label='Note (optional)' value={comment} onChangeText={setComment} placeholder='Anything the temple should know' multiline />

      <SectionTitle>Persons</SectionTitle>
      {persons.map((person, index) => (
        <View key={index}>
          <Field label={`Person ${index + 1} name`} value={person.name} onChangeText={v => updatePerson(index, 'name', v)} placeholder='Name' />
          <Field label='Gotra' value={person.gotra} onChangeText={v => updatePerson(index, 'gotra', v)} placeholder='Gotra' />
        </View>
      ))}
      <SecondaryButton label='+ Add another person' onPress={() => setPersons(prev => [...prev, { name: '', gotra: '' }])} />

      <PrimaryButton label='Continue' onPress={handleContinue} />
      <Text style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
        Pricing (including GST) is calculated by the server from the chadhava listing — no total is computed on-device.
      </Text>
    </Screen>
  )
}
