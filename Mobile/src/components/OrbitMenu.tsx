import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export type OrbitItem = {
  key: string
  label: string
  icon: string
  onPress: () => void
}

/**
 * Renders items evenly spaced around a ring, matching the home-screen menu from the
 * Figma design (a circle of icon buttons around the Mandir Setu mark). Pure View/Text
 * positioning via trig — no SVG dependency needed.
 */
export function OrbitMenu({ items, size = 300 }: { items: OrbitItem[]; size?: number }) {
  const radius = size / 2
  const itemSize = 72
  const center = radius

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <View style={[styles.ring, { width: size - itemSize, height: size - itemSize, borderRadius: (size - itemSize) / 2, top: itemSize / 2, left: itemSize / 2 }]} />
      {items.map((item, index) => {
        const angle = (index / items.length) * 2 * Math.PI - Math.PI / 2
        const x = center + radius * 0.78 * Math.cos(angle) - itemSize / 2
        const y = center + radius * 0.78 * Math.sin(angle) - itemSize / 2

        return (
          <TouchableOpacity key={item.key} style={[styles.item, { left: x, top: y, width: itemSize, height: itemSize }]} onPress={item.onPress}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { alignSelf: 'center', position: 'relative' },
  ring: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(45, 212, 212, 0.5)' },
  item: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 212, 0.7)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: { fontSize: 22 },
  label: { color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 4, textAlign: 'center' }
})
