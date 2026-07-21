import { GapNotice, Screen, ScreenTitle } from '../components/ui'

export default function GodGoddessesScreen() {
  return (
    <Screen>
      <ScreenTitle>God / Goddesses</ScreenTitle>
      <GapNotice>
        There&apos;s no deity model in the backend yet. Once one exists (or if this should reuse the e-puja
        categories), wire this screen to the corresponding listing endpoint — see docs/MOBILE_API_MAPPING.md,
        &quot;God/Goddesses&quot; row.
      </GapNotice>
    </Screen>
  )
}
