import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Image, Text } from 'react-native'

import { getAstrologer } from '../api/jyotish'
import type { Astrologer } from '../api/types'
import { ErrorView, LoadingView, PrimaryButton, Screen, ScreenTitle, SecondaryButton, SectionTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'AstrologerProfile'>

export default function AstrologerProfileScreen({ route, navigation }: Props) {
  const [astrologer, setAstrologer] = useState<Astrologer | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAstrologer(route.params.id)
      .then(setAstrologer)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [route.params.id])

  if (error) return <ErrorView message={error} />
  if (!astrologer) return <LoadingView />

  return (
    <Screen>
      <Image source={{ uri: astrologer.image }} style={{ width: 96, height: 96, borderRadius: 48, alignSelf: 'center', backgroundColor: '#eee' }} />
      <ScreenTitle>{astrologer.name}</ScreenTitle>
      <Text style={{ color: '#6b6b6b' }}>{astrologer.specialties}</Text>
      <Text style={{ marginTop: 8 }}>{astrologer.bio}</Text>

      <SectionTitle>Pricing</SectionTitle>
      <Text>30 min — ₹{astrologer.offerPrice30 ?? astrologer.price30}</Text>
      <Text>60 min — ₹{astrologer.offerPrice60 ?? astrologer.price60}</Text>

      <PrimaryButton label='Chat Now' onPress={() => navigation.navigate('StartSession', { astrologerId: astrologer.id, mode: 'chat' })} />
      <SecondaryButton label='Call Now' onPress={() => navigation.navigate('StartSession', { astrologerId: astrologer.id, mode: 'call' })} />
    </Screen>
  )
}
