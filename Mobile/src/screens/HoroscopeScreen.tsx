import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from 'react-native'

import { getKundliListings } from '../api/bookings'
import type { KundliListing } from '../api/types'
import { Card, EmptyView, ErrorView, LoadingView, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Horoscope'>

export default function HoroscopeScreen({ navigation }: Props) {
  const [listings, setListings] = useState<KundliListing[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setError(null)
    setListings(null)
    getKundliListings()
      .then(setListings)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
  }

  useEffect(load, [])

  if (error) return <ErrorView message={error} onRetry={load} />
  if (!listings) return <LoadingView />

  return (
    <Screen>
      <ScreenTitle>Choose Kundali Type</ScreenTitle>
      {listings.length === 0 && <EmptyView message='No kundali packages available right now.' />}
      {listings.map(item => (
        <Card key={item.id} onPress={() => navigation.navigate('Kundali', { listingId: item.id, listingTitle: item.title })}>
          <Text style={{ fontWeight: '700' }}>{item.title}</Text>
          <Text style={{ color: '#6b6b6b', marginTop: 4 }}>{item.description}</Text>
          <Text style={{ color: '#ff6b35', fontWeight: '700', marginTop: 6 }}>
            {item.price === 0 ? 'Free' : `₹${item.offerPrice ?? item.price}`} · {item.delivery}
          </Text>
        </Card>
      ))}
    </Screen>
  )
}
