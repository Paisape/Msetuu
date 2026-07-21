import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from 'react-native'

import { Card, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'PilgrimServices'>

const SERVICES: { label: string; screen: keyof RootStackParamList }[] = [
  { label: 'Darshan', screen: 'DarshanList' },
  { label: 'Chadhava', screen: 'ChadhavaList' },
  { label: 'Mandir Pujan (Offline Puja)', screen: 'PujaList' },
  { label: 'e-Pujan (Online Puja)', screen: 'PujaList' },
  { label: 'Gold / Silver Offering', screen: 'ChadhavaList' }
]

export default function PilgrimServicesScreen({ navigation }: Props) {
  return (
    <Screen>
      <ScreenTitle>Pilgrim Services</ScreenTitle>
      {SERVICES.map(service => (
        <Card key={service.label} onPress={() => navigation.navigate(service.screen as any)}>
          <Text style={{ fontWeight: '600' }}>{service.label}</Text>
        </Card>
      ))}
    </Screen>
  )
}
