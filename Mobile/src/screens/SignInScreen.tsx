import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Text } from 'react-native'

import { Field, PrimaryButton, Screen, ScreenTitle, SecondaryButton } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'SignIn'>

export default function SignInScreen({ navigation }: Props) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Please enter both email and password.')

      return
    }

    setLoading(true)

    try {
      await login(email, password)
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        navigation.replace('Home')
      }
    } catch (err) {
      Alert.alert('Login failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen scroll={false}>
      <ScreenTitle>Mandir Setu</ScreenTitle>
      <Text style={{ marginBottom: 20, color: '#6b6b6b' }}>Connect with the Divine, Anytime, Anywhere</Text>
      <Field label='Email' value={email} onChangeText={setEmail} placeholder='you@example.com' keyboardType='email-address' />
      <Field label='Password' value={password} onChangeText={setPassword} placeholder='••••••••' secureTextEntry />
      <PrimaryButton label='Get OTP / Login' onPress={handleLogin} loading={loading} />
      <SecondaryButton label='New here? Create an account' onPress={() => navigation.navigate('Register')} />
    </Screen>
  )
}

