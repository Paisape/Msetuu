import { useState } from 'react'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { OrbitMenu } from '../components/OrbitMenu'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../navigation/types'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function HomeScreen({ navigation }: { navigation: Nav }) {
  const { logout } = useAuth()
  const [muted, setMuted] = useState(false)

  const menuItems = [
    { key: 'darshan', label: 'Darshan', icon: '🛕', onPress: () => navigation.navigate('DarshanList') },
    { key: 'store', label: 'Puja Store', icon: '🛒', onPress: () => navigation.navigate('SearchPujaExpertise') },
    { key: 'kundli', label: 'Kundli', icon: '🔯', onPress: () => navigation.navigate('Horoscope') },
    { key: 'geotag', label: 'Geo Tag', icon: '📍', onPress: () => navigation.navigate('CameraGeotag') },
    { key: 'epuja', label: 'E-Puja', icon: '🪔', onPress: () => navigation.navigate('PujaList', {}) },
    { key: 'jyotishi', label: 'Jyotishi', icon: '🔮', onPress: () => navigation.navigate('AstrologerList') },
    { key: 'yatra', label: 'Yatra', icon: '🏔️', onPress: () => navigation.navigate('Yatra') },
    { key: 'chadhava', label: 'Chadhava', icon: '🌸', onPress: () => navigation.navigate('ChadhavaList') }
  ]

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setMuted(m => !m)}>
            <Text style={styles.iconButtonText}>{muted ? '🔇' : '🔊'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.iconButtonText}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.iconButtonText}>🔔</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoBlock}>
          <Text style={styles.logo}>Mandir Setu</Text>
          <Text style={styles.tagline}>Connect with the Divine, Anytime, Anywhere</Text>
        </View>

        <OrbitMenu items={menuItems} size={320} />

        <TouchableOpacity onPress={() => navigation.navigate('MyBookings')} style={styles.bookingsLink}>
          <Text style={styles.bookingsLinkText}>My Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={logout} style={{ marginTop: 12 }}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0e2a' },
  safe: { flex: 1, alignItems: 'center' },
  topBar: { flexDirection: 'row', gap: 12, alignSelf: 'flex-end', paddingHorizontal: 16, paddingTop: 8 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(45, 212, 212, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  iconButtonText: { fontSize: 18 },
  logoBlock: { alignItems: 'center', marginTop: 12, marginBottom: 8 },
  logo: { fontSize: 26, fontWeight: '800', color: '#ff6b35' },
  tagline: { color: '#e5e5e5', fontSize: 12, marginTop: 4 },
  bookingsLink: { marginTop: 16, borderWidth: 1, borderColor: '#ff6b35', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  bookingsLinkText: { color: '#ff6b35', fontWeight: '700' },
  logout: { color: '#e57373', fontWeight: '600' }
})
