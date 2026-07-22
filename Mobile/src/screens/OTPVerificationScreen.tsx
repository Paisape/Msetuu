import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Text } from 'react-native'

import * as authApi from '../api/auth'
import { Field, PrimaryButton, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'OTPVerification'>

export default function OTPVerificationScreen({ route, navigation }: Props) {
  const { email } = route.params
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    if (otp.length < 4) {
      Alert.alert('Enter the code', 'Please enter the verification code sent to your email.')

      return
    }

    setLoading(true)

    try {
      await authApi.verifyEmail(email, otp)
      Alert.alert('Verified', 'Your email is verified. You can now log in.', [
        { text: 'OK', onPress: () => navigation.navigate('SignIn') }
      ])
    } catch (err) {
      Alert.alert('Verification failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen scroll={false}>
      <ScreenTitle>OTP Verification</ScreenTitle>
      <Text style={{ color: '#6b6b6b', marginBottom: 20 }}>
        Enter the code sent to {email}.{'\n'}
        Note: this verifies your email.
      </Text>
      <Field label='Verification code' value={otp} onChangeText={setOtp} placeholder='0000' keyboardType='numeric' />
      <PrimaryButton label='Verify OTP' onPress={handleVerify} loading={loading} />
    </Screen>
  )
}

