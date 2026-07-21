import { useEffect, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

import { getDarshanTemples } from '../api/content'
import type { DarshanTemple } from '../api/types'
import { Card, EmptyView, ErrorView, GapNotice, LoadingView, Screen, ScreenTitle } from '../components/ui'

export default function DarshanListScreen() {
  const [temples, setTemples] = useState<DarshanTemple[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setError(null)
    setTemples(null)
    getDarshanTemples()
      .then(setTemples)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
  }

  useEffect(load, [])

  if (error) return <ErrorView message={error} onRetry={load} />
  if (!temples) return <LoadingView />

  return (
    <Screen>
      <ScreenTitle>Darshan</ScreenTitle>
      {temples.length === 0 && <EmptyView message='No temples listed yet.' />}
      {temples.map(temple => (
        <Card key={temple.id}>
          <View style={styles.row}>
            <Image source={{ uri: temple.image }} style={styles.thumb} />
            <View style={styles.info}>
              <Text style={styles.title}>{temple.name}</Text>
              {temple.location && <Text style={styles.subtitle}>{temple.location}</Text>}
            </View>
          </View>
        </Card>
      ))}
      <GapNotice>
        Ticketed darshan booking (participants, payment, QR ticket) has no backend model yet — this screen only
        shows the temple directory. See docs/MOBILE_API_MAPPING.md, cross-cutting issue #3, for the two ways to
        close this gap.
      </GapNotice>
    </Screen>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  thumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee' },
  info: { flex: 1, justifyContent: 'center' },
  title: { fontWeight: '700' },
  subtitle: { color: '#6b6b6b', marginTop: 2 }
})
