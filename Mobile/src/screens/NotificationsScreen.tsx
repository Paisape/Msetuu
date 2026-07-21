import { GapNotice, Screen, ScreenTitle } from '../components/ui'

export default function NotificationsScreen() {
  return (
    <Screen>
      <ScreenTitle>Notifications</ScreenTitle>
      <GapNotice>
        There's no notifications endpoint on the backend yet (checked every route under Web/src/app/api — nothing
        notification-related besides email sending). This screen needs a new model + GET /api/notifications
        (and ideally push delivery via Expo Notifications) before it can show anything real.
      </GapNotice>
    </Screen>
  )
}
