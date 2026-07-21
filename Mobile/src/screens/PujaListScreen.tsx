import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Image, StyleSheet, Text, View } from 'react-native'

import { getPujaListings } from '../api/bookings'
import type { PujaListing } from '../api/types'
import { Card, EmptyView, ErrorView, LoadingView, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'PujaList'>

export default function PujaListScreen({ route, navigation }: Props) {
  const category = route.params?.category
  const [listings, setListings] = useState<PujaListing[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setError(null)
    setListings(null)
    getPujaListings(category)
      .then(setListings)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
  }

  useEffect(load, [category])

  if (error) return <ErrorView message={error} onRetry={load} />
  if (!listings) return <LoadingView />

  return (
    <Screen>
      <ScreenTitle>{category ? `Pujas — ${category}` : 'Pujas'}</ScreenTitle>
      {listings.length === 0 && <EmptyView message='No pujas available right now.' />}
      {listings.map(item => (
        <Card key={item.id} onPress={() => navigation.navigate('PujaDetails', { id: item.id })}>
          <View style={styles.row}>
            <Image source={{ uri: item.image }} style={styles.thumb} />
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              {item.templeName && <Text style={styles.subtitle}>{item.templeName}</Text>}
              <Text style={styles.price}>From ₹{item.price}</Text>
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee' },
  info: { flex: 1, justifyContent: 'center' },
  title: { fontWeight: '700' },
  subtitle: { color: '#6b6b6b', marginTop: 2 },
  price: { color: '#ff6b35', fontWeight: '700', marginTop: 4 }
})
