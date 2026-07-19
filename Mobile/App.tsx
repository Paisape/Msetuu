import { useState } from 'react'
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native'

import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import HomeScreen from './src/screens/HomeScreen'

type AuthUser = { id: string; name: string; email: string; role: string }
type Screen = 'login' | 'register' | 'home' | 'module'

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [activeModule, setActiveModule] = useState<string | null>(null)

  if (screen === 'login') {
    return (
      <SafeAreaView style={styles.flex}>
        <LoginScreen
          onLoggedIn={loggedInUser => {
            setUser(loggedInUser)
            setScreen('home')
          }}
          onNavigateToRegister={() => setScreen('register')}
        />
      </SafeAreaView>
    )
  }

  if (screen === 'register') {
    return (
      <SafeAreaView style={styles.flex}>
        <RegisterScreen onRegistered={() => setScreen('login')} onNavigateToLogin={() => setScreen('login')} />
      </SafeAreaView>
    )
  }

  if (screen === 'module' && activeModule) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.centered}>
          <Text style={styles.moduleTitle}>{activeModule}</Text>
          <Text style={styles.moduleSubtitle}>
            Screen not built yet — wire this up to GET/POST /api/{activeModule} on the backend.
          </Text>
          <TouchableOpacity onPress={() => setScreen('home')}>
            <Text style={styles.link}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.flex}>
      <HomeScreen
        userName={user?.name ?? 'Devotee'}
        onSelectModule={module => {
          setActiveModule(module)
          setScreen('module')
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  moduleTitle: { fontSize: 22, fontWeight: '700', textTransform: 'capitalize', marginBottom: 8 },
  moduleSubtitle: { textAlign: 'center', color: '#666', marginBottom: 16 },
  link: { color: '#ff6b35', fontWeight: '600' }
})
