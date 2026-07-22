import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from 'react-native'

import { Card, GapNotice, PrimaryButton, Screen, ScreenTitle } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>

export default function EditProfileScreen({ navigation }: Props) {
  const { user } = useAuth()

  if (!user) {
    return (
      <Screen>
        <ScreenTitle>My Profile</ScreenTitle>
        <Card style={{ paddingVertical: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#ff6b35', marginBottom: 8 }}>Sign In Required</Text>
          <Text style={{ color: '#6b6b6b', textAlign: 'center', marginBottom: 16 }}>
            Sign in or create an account to view and manage your profile details.
          </Text>
          <PrimaryButton label='Sign In / Register' onPress={() => navigation.navigate('SignIn')} />
        </Card>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenTitle>My Profile</ScreenTitle>
      <Text style={{ fontWeight: '700' }}>{user.name}</Text>
      <Text style={{ color: '#6b6b6b', marginTop: 4 }}>{user.email}</Text>
      <GapNotice>
        There&apos;s no self-service profile-update endpoint yet (GET/PATCH /api/profile) — see
        docs/MOBILE_API_MAPPING.md cross-cutting issue #9. Fields like gotra, occupation, birth place/time and
        profile photo can&apos;t be edited from mobile until that's added.
      </GapNotice>
    </Screen>
  )
}

