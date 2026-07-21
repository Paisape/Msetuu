import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Image, Text, View } from 'react-native'

import { getAstrologers } from '../api/jyotish'
import type { Astrologer } from '../api/types'
import { Card, EmptyView, ErrorView, LoadingView, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'AstrologerList'>

export default function AstrologerListScreen({ navigation }: Props) {
  const [astrologers, setAstrologers] = useState<Astrologer[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setError(null)
    setAstrologers(null)
    getAstrologers()
      .then(setAstrologers)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
  }

  useEffect(load, [])

  if (error) return <ErrorView message={error} onRetry={load} />
  if (!astrologers) return <LoadingView />

  return (
    <Screen>
      <ScreenTitle>Talk to an Astrologer</ScreenTitle>
      {astrologers.length === 0 && <EmptyView message='No astrologers available right now.' />}
      {astrologers.map(item => (
        <Card key={item.id} onPress={() => navigation.navigate('AstrologerProfile', { id: item.id })}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Image source={{ uri: item.image }} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#eee' }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700' }}>{item.name}</Text>
              <Text style={{ color: '#6b6b6b', marginTop: 2 }}>{item.specialties}</Text>
              <Text style={{ color: '#ff6b35', fontWeight: '700', marginTop: 4 }}>
                ⭐ {item.rating.toFixed(1)} · ₹{item.offerPrice30 ?? item.price30}/30min
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  )
}
