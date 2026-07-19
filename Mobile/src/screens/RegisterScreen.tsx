import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'

import { register } from '../api/client'

type Props = {
  onRegistered: () => void
  onNavigateToLogin: () => void
}

export default function RegisterScreen({ onRegistered, onNavigateToLogin }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!name || !email || password.length < 8) {
      Alert.alert('Missing details', 'Name, email and an 8+ character password are required.')

      return
    }

    setLoading(true)

    try {
      await register(name, email, password, phone || undefined)
      Alert.alert('Account created', 'You can now log in.', [{ text: 'OK', onPress: onRegistered }])
    } catch (err) {
      Alert.alert('Registration failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput style={styles.input} placeholder='Full name' value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder='Email'
        autoCapitalize='none'
        keyboardType='email-address'
        value={email}
        onChangeText={setEmail}
      />
      <TextInput style={styles.input} placeholder='Phone (optional)' keyboardType='phone-pad' value={phone} onChangeText={setPhone} />
      <TextInput style={styles.input} placeholder='Password' secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating…' : 'Create Account'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNavigateToLogin}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 32, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#ff6b35', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 16, color: '#ff6b35' }
})
