import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'

type Props = {
  userName: string
  onSelectModule: (module: string) => void
}

const MODULES = [
  { key: 'chadhava', label: 'Chadhava' },
  { key: 'epuja', label: 'E-Puja' },
  { key: 'kundli', label: 'Kundli' },
  { key: 'jyotish', label: 'Jyotish' },
  { key: 'ecommerce', label: 'E-commerce' },
  { key: 'yatra', label: 'Yatra Booking' },
  { key: 'darshan', label: 'Darshan Experience' },
  { key: 'geotag', label: 'Geo Tagging' }
]

export default function HomeScreen({ userName, onSelectModule }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Namaste, {userName} 🙏</Text>
      <FlatList
        data={MODULES}
        keyExtractor={item => item.key}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.tile} onPress={() => onSelectModule(item.key)}>
            <Text style={styles.tileText}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  greeting: { fontSize: 20, fontWeight: '600', marginVertical: 16 },
  row: { justifyContent: 'space-between' },
  tile: {
    backgroundColor: '#fff4ec',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center'
  },
  tileText: { fontWeight: '600', color: '#ff6b35' }
})
