import type { ReactNode } from 'react'
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export const colors = {
  primary: '#ff6b35',
  text: '#1a1a1a',
  muted: '#6b6b6b',
  border: '#e5e5e5',
  background: '#ffffff',
  surface: '#fff4ec'
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>{children}</View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>{children}</ScrollView>
    </SafeAreaView>
  )
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>
}

export function PrimaryButton({ label, onPress, loading, disabled }: { label: string; onPress: () => void; loading?: boolean; disabled?: boolean }) {
  return (
    <TouchableOpacity style={[styles.button, disabled && styles.buttonDisabled]} onPress={onPress} disabled={loading || disabled}>
      {loading ? <ActivityIndicator color='#fff' /> : <Text style={styles.buttonText}>{label}</Text>}
    </TouchableOpacity>
  )
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.secondaryButton} onPress={onPress}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  )
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  multiline
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric'
  secureTextEntry?: boolean
  multiline?: boolean
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor='#999'
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  )
}

export function Card({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  const Wrapper = onPress ? TouchableOpacity : View

  return (
    <Wrapper style={styles.card} onPress={onPress}>
      {children}
    </Wrapper>
  )
}

export function LoadingView() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator color={colors.primary} size='large' />
    </View>
  )
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && <SecondaryButton label='Retry' onPress={onRetry} />}
    </View>
  )
}

export function EmptyView({ message }: { message: string }) {
  return (
    <View style={styles.centered}>
      <Text style={styles.mutedText}>{message}</Text>
    </View>
  )
}

/** Marks a screen whose backend support doesn't exist yet — see docs/MOBILE_API_MAPPING.md.
 * Keeps the screen navigable/reviewable in the app instead of silently crashing on a
 * missing endpoint. */
export function GapNotice({ children }: { children: ReactNode }) {
  return (
    <View style={styles.gapNotice}>
      <Text style={styles.gapNoticeTitle}>Backend not built yet</Text>
      <Text style={styles.gapNoticeText}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: 16 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 20, marginBottom: 8 },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: colors.primary },
  secondaryButtonText: { color: colors.primary, fontWeight: '600' },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 15, color: colors.text },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 12 },
  errorText: { color: '#c0392b', textAlign: 'center' },
  mutedText: { color: colors.muted, textAlign: 'center' },
  gapNotice: { backgroundColor: '#fff8e1', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#f1c40f', marginTop: 12 },
  gapNoticeTitle: { fontWeight: '700', color: '#8a6d00', marginBottom: 4 },
  gapNoticeText: { color: '#8a6d00', fontSize: 13, lineHeight: 18 }
})
