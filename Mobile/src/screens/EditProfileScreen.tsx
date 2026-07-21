import { Text } from 'react-native'

import { GapNotice, Screen, ScreenTitle } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function EditProfileScreen() {
  const { user } = useAuth()

  return (
    <Screen>
      <ScreenTitle>My Profile</ScreenTitle>
      <Text style={{ fontWeight: '700' }}>{user?.name}</Text>
      <Text style={{ color: '#6b6b6b', marginTop: 4 }}>{user?.email}</Text>
      <GapNotice>
        There&apos;s no self-service profile-update endpoint yet (GET/PATCH /api/profile) — see
        docs/MOBILE_API_MAPPING.md cross-cutting issue #9. Fields like gotra, occupation, birth place/time and
        profile photo can&apos;t be edited from mobile until that's added.
      </GapNotice>
    </Screen>
  )
}
