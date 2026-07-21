import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Text } from 'react-native'

import { getFaqs, submitContact } from '../api/content'
import type { Faq } from '../api/types'
import { Card, EmptyView, Field, LoadingView, PrimaryButton, Screen, ScreenTitle, SectionTitle } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'FAQs'>

export default function FAQsScreen({ route }: Props) {
  const { user } = useAuth()
  const [faqs, setFaqs] = useState<Faq[] | null>(null)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getFaqs(route.params.page)
      .then(setFaqs)
      .catch(() => setFaqs([]))
  }, [route.params.page])

  const handleSubmit = async () => {
    if (!subject || !description || !user?.email) {
      Alert.alert('Missing details', 'Please fill in a subject and description.')

      return
    }

    setSubmitting(true)

    try {
      await submitContact(user.name ?? 'Devotee', user.email, `${subject}\n\n${description}`)
      Alert.alert('Query submitted', 'We will get back to you soon.')
      setSubject('')
      setDescription('')
    } catch (err) {
      Alert.alert('Submission failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!faqs) return <LoadingView />

  return (
    <Screen>
      <ScreenTitle>FAQs</ScreenTitle>
      {faqs.length === 0 && <EmptyView message='No FAQs published yet.' />}
      {faqs.map(faq => (
        <Card key={faq.id}>
          <Text style={{ fontWeight: '700' }}>{faq.question}</Text>
          <Text style={{ color: '#6b6b6b', marginTop: 4 }}>{faq.answer}</Text>
        </Card>
      ))}

      <SectionTitle>Write us your query</SectionTitle>
      <Field label='Subject' value={subject} onChangeText={setSubject} placeholder='Ex: Want to cancel my booking' />
      <Field label='Description' value={description} onChangeText={setDescription} placeholder='Describe your query' multiline />
      <PrimaryButton label='Submit' onPress={handleSubmit} loading={submitting} />
    </Screen>
  )
}
