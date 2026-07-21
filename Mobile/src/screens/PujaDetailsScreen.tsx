import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Image, Text } from 'react-native'

import { getPujaListing } from '../api/bookings'
import type { PujaListing } from '../api/types'
import { Card, ErrorView, LoadingView, PrimaryButton, Screen, ScreenTitle, SectionTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'PujaDetails'>

export default function PujaDetailsScreen({ route, navigation }: Props) {
  const [listing, setListing] = useState<PujaListing | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setError(null)
    getPujaListing(route.params.id)
      .then(setListing)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
  }

  useEffect(load, [route.params.id])

  if (error) return <ErrorView message={error} onRetry={load} />
  if (!listing) return <LoadingView />

  return (
    <Screen>
      <Image source={{ uri: listing.image }} style={{ width: '100%', height: 180, borderRadius: 12, backgroundColor: '#eee' }} />
      <ScreenTitle>{listing.title}</ScreenTitle>
      {listing.templeName && <Text style={{ color: '#6b6b6b', marginBottom: 8 }}>{listing.templeName} · {listing.templeLocation}</Text>}
      <Text>{listing.description}</Text>
      {listing.benefits && (
        <>
          <SectionTitle>Benefits</SectionTitle>
          <Text>{listing.benefits}</Text>
        </>
      )}

      <SectionTitle>Choose a Package</SectionTitle>
      {listing.packages.map(pkg => (
        <Card key={pkg.id} onPress={() => navigation.navigate('PujaForm', { listingId: listing.id, packageId: pkg.id })}>
          <Text style={{ fontWeight: '700' }}>{pkg.type}</Text>
          <Text style={{ color: '#ff6b35', fontWeight: '700' }}>₹{pkg.offerPrice ?? pkg.price}</Text>
        </Card>
      ))}
      {listing.packages.length === 0 && (
        <PrimaryButton label={`Book for ₹${listing.price}`} onPress={() => navigation.navigate('PujaForm', { listingId: listing.id, packageId: '' })} />
      )}
    </Screen>
  )
}
