import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { GapNotice, PrimaryButton, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'SessionGap'>

export default function SessionGapScreen({ route, navigation }: Props) {
  const { mode } = route.params

  return (
    <Screen>
      <ScreenTitle>{mode === 'chat' ? 'Chat' : 'Call'}</ScreenTitle>
      <GapNotice>
        Your consultation is booked, but there&apos;s no real-time messaging/calling layer on the backend yet — see
        docs/MOBILE_API_MAPPING.md cross-cutting issue #6. This needs a WebSocket relay or a third-party SDK (e.g.
        Stream, Agora, Twilio) before a live {mode} session can run here.
      </GapNotice>
      <PrimaryButton label='Back to Home' onPress={() => navigation.popToTop()} />
    </Screen>
  )
}
