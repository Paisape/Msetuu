import NotificationsClient from './NotificationsClient'

export const metadata = {
  title: 'Multi-Channel Notifications | Mandirsetuu Admin',
  description: 'Broadcast notifications across Email, SMS, WhatsApp, and Firebase Push Notifications.'
}

export default function NotificationsPage() {
  return <NotificationsClient />
}
