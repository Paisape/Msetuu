import { useState } from 'react'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'

import { Field, GapNotice, Screen, ScreenTitle } from '../components/ui'

// The backend has no city/places endpoint (see docs/MOBILE_API_MAPPING.md). This is a
// static list good enough to unblock the UI; swap for a real geo/places API later.
const CITIES = [
  'Pune', 'Mumbai', 'Kolhapur', 'Nagpur', 'Nashik', 'Varanasi', 'Prayagraj', 'Ujjain',
  'Madurai', 'Chennai', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Jodhpur', 'Patna', 'Guwahati'
]

export default function CitySearchScreen() {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const filtered = CITIES.filter(c => c.toLowerCase().includes(query.toLowerCase()))

  return (
    <Screen scroll={false}>
      <ScreenTitle>Search City</ScreenTitle>
      <Field label='City' value={query} onChangeText={setQuery} placeholder='Ex: Pune' />
      <FlatList
        data={filtered}
        keyExtractor={c => c}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelected(item)} style={{ paddingVertical: 12 }}>
            <Text style={{ fontWeight: item === selected ? '700' : '400' }}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      {selected && (
        <View>
          <GapNotice>
            Selected &quot;{selected}&quot;. There&apos;s no backend endpoint to persist a city preference or filter
            listings by city yet — wire this once a places/geo API is added.
          </GapNotice>
        </View>
      )}
    </Screen>
  )
}
