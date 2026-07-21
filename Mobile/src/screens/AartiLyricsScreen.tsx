import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Linking, Text } from 'react-native'

import { getMantras } from '../api/content'
import type { Mantra } from '../api/types'
import { ErrorView, GapNotice, LoadingView, PrimaryButton, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'AartiLyrics'>

export default function AartiLyricsScreen({ route }: Props) {
  const [mantra, setMantra] = useState<Mantra | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMantras()
      .then(all => setMantra(all.find(m => m.id === route.params.mantraId) ?? null))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [route.params.mantraId])

  if (error) return <ErrorView message={error} />
  if (!mantra) return <LoadingView />

  return (
    <Screen>
      <ScreenTitle>{mantra.title}</ScreenTitle>
      <Text style={{ color: '#6b6b6b', marginBottom: 12 }}>{mantra.subtitle} · {mantra.deity} · {mantra.duration}</Text>
      <PrimaryButton label='Play audio' onPress={() => Linking.openURL(mantra.fileUrl)} />
      <GapNotice>
        Full lyrics text isn&apos;t stored on the backend yet (Mantra model has no `lyrics` field) — see
        docs/MOBILE_API_MAPPING.md cross-cutting issue #8. Audio playback here just opens the file URL; swap for
        `expo-av`&apos;s Audio API for an in-app player.
      </GapNotice>
    </Screen>
  )
}
