import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { OrbitMenu } from '../components/OrbitMenu'

const noop = () => {}

const SPLASH_ITEMS = [
  { key: 'chadhava', label: 'Chadhava', icon: '🌸', onPress: noop },
  { key: 'darshan', label: 'Darshan', icon: '🛕', onPress: noop },
  { key: 'store', label: 'Store', icon: '🛒', onPress: noop },
  { key: 'kundli', label: 'Kundli', icon: '🔯', onPress: noop },
  { key: 'geotag', label: 'GeoTag', icon: '📍', onPress: noop },
  { key: 'jyotishi', label: 'Jyotishi', icon: '🔮', onPress: noop },
  { key: 'epuja', label: 'E-Puja', icon: '🪔', onPress: noop },
  { key: 'yatra', label: 'Yatra', icon: '🏔️', onPress: noop }
]

export default function SplashScreen({ onFinished }: { onFinished: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinished, 1400)

    return () => clearTimeout(timer)
  }, [onFinished])

  return (
    <View style={styles.container}>
      <View style={styles.orbitWrapper}>
        <OrbitMenu items={SPLASH_ITEMS} size={320} />
        <View style={styles.centerMark}>
          <Text style={styles.centerMarkText}>🛕</Text>
        </View>
      </View>
      <Text style={styles.logo}>Mandir Setu</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0e2a', padding: 24 },
  orbitWrapper: { alignItems: 'center', justifyContent: 'center' },
  centerMark: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2,
    borderColor: '#ff6b35',
    alignItems: 'center',
    justifyContent: 'center'
  },
  centerMarkText: { fontSize: 34 },
  logo: { fontSize: 30, fontWeight: '800', color: '#ff6b35', marginTop: 24 }
})
