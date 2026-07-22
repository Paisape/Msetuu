import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert } from 'react-native'

import * as authApi from '../api/auth'
import { Field, PrimaryButton, Screen, ScreenTitle, SecondaryButton } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>

export default function RegisterScreen({ navigation }: Props) {
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
      await authApi.register(name, email, password, phone || undefined)
      Alert.alert('Account created', 'Enter the verification code we emailed you to finish signing up.', [
        { text: 'OK', onPress: () => navigation.navigate('OTPVerification', { email }) }
      ])
    } catch (err) {
      Alert.alert('Registration failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <ScreenTitle>Create Account</ScreenTitle>
      <Field label='Full name' value={name} onChangeText={setName} placeholder='Abhijeet Patil' />
      <Field label='Email' value={email} onChangeText={setEmail} placeholder='you@example.com' keyboardType='email-address' />
      <Field label='Phone (optional)' value={phone} onChangeText={setPhone} placeholder='98765 43210' keyboardType='phone-pad' />
      <Field label='Password' value={password} onChangeText={setPassword} placeholder='At least 8 characters' secureTextEntry />
      <PrimaryButton label='Create Account' onPress={handleRegister} loading={loading} />
      <SecondaryButton label='Already have an account? Sign in' onPress={() => navigation.navigate('SignIn')} />
    </Screen>
  )
}

