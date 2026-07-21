import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text, View } from 'react-native'

import { getAstrologers } from '../api/jyotish'
import { Card, GapNotice, LoadingView, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'SpecializationFilter'>

export default function SpecializationFilterScreen({ route }: Props) {
  const { kind } = route.params
  const [options, setOptions] = useState<string[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (kind === 'language') {
      // Astrologer has no `languages` field — see docs/MOBILE_API_MAPPING.md.
      setOptions([])

      return
    }

    getAstrologers()
      .then(astrologers => {
        const specialties = new Set<string>()

        astrologers.forEach(a => a.specialties.split(',').forEach(s => specialties.add(s.trim())))
        setOptions([...specialties].filter(Boolean))
      })
      .catch(() => setOptions([]))
  }, [kind])

  if (!options) return <LoadingView />

  return (
    <Screen>
      <ScreenTitle>{kind === 'specialization' ? 'Search Specialization' : 'Search Language'}</ScreenTitle>
      {options.length === 0 ? (
        <GapNotice>
          {kind === 'language'
            ? "There's no `languages` field on the Astrologer model yet — this filter has nothing to show."
            : 'No specialties found on any astrologer profile yet.'}
        </GapNotice>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {options.map(opt => (
            <Card
              key={opt}
              onPress={() =>
                setSelected(prev => {
                  const next = new Set(prev)

                  if (next.has(opt)) next.delete(opt)
                  else next.add(opt)

                  return next
                })
              }
            >
              <Text style={{ fontWeight: selected.has(opt) ? '700' : '500' }}>{opt}</Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  )
}
