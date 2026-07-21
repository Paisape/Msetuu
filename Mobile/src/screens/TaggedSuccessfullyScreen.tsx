import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StyleSheet, Text, View } from 'react-native'

import { PrimaryButton } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'TaggedSuccessfully'>

export default function TaggedSuccessfullyScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🙏</Text>
      <Text style={styles.title}>Tagged successfully!</Text>
      <Text style={styles.message}>Thank you for tagging yourself as a temple visitor.</Text>
      <PrimaryButton label='Back to Home' onPress={() => navigation.popToTop()} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  message: { color: '#6b6b6b', textAlign: 'center', marginBottom: 20 }
})
