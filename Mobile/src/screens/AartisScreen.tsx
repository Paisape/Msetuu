import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from 'react-native'

import { getMantras } from '../api/content'
import type { Mantra } from '../api/types'
import { Card, EmptyView, ErrorView, LoadingView, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Aartis'>

export default function AartisScreen({ navigation }: Props) {
  const [mantras, setMantras] = useState<Mantra[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setError(null)
    setMantras(null)
    getMantras()
      .then(setMantras)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
  }

  useEffect(load, [])

  if (error) return <ErrorView message={error} onRetry={load} />
  if (!mantras) return <LoadingView />

  return (
    <Screen>
      <ScreenTitle>Aartis, Chalisas & Mantras</ScreenTitle>
      {mantras.length === 0 && <EmptyView message='No mantras uploaded yet.' />}
      {mantras.map(item => (
        <Card key={item.id} onPress={() => navigation.navigate('AartiLyrics', { mantraId: item.id })}>
          <Text style={{ fontWeight: '700' }}>{item.title}</Text>
          <Text style={{ color: '#6b6b6b', marginTop: 2 }}>{item.subtitle} · {item.deity} · {item.duration}</Text>
        </Card>
      ))}
    </Screen>
  )
}
