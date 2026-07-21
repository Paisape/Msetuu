import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from 'react-native'

import { getChadhavaOrder, getKundliOrder, getMyPujaOrders } from '../api/bookings'
import { getMyConsultations } from '../api/jyotish'
import { Card, ErrorView, GapNotice, LoadingView, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetail'>

export default function BookingDetailScreen({ route }: Props) {
  const { type, id, label } = route.params
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        let result: Record<string, unknown> | undefined

        if (type === 'CHADHAVA') {
          result = await getChadhavaOrder(id)
        } else if (type === 'KUNDLI') {
          result = await getKundliOrder(id)
        } else if (type === 'EPUJA') {
          // No GET /api/epuja/[id] confirmed yet — fall back to the caller's own order
          // list and find it client-side (see docs/MOBILE_API_MAPPING.md).
          const orders = await getMyPujaOrders()

          result = orders.find(o => o.id === id)
        } else if (type === 'JYOTISH') {
          const bookings = await getMyConsultations()

          result = bookings.find(b => b.id === id)
        }

        if (!cancelled) setDetail(result ?? null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [type, id])

  if (error) return <ErrorView message={error} />
  if (loading) return <LoadingView />

  return (
    <Screen>
      <ScreenTitle>{label}</ScreenTitle>
      {detail ? (
        <Card>
          <Text style={{ fontWeight: '700' }}>Status: {String(detail.status ?? '—')}</Text>
          <Text style={{ color: '#6b6b6b', marginTop: 4 }}>Payment: {String(detail.paymentStatus ?? '—')}</Text>
          <Text style={{ color: '#6b6b6b', marginTop: 4 }}>Booking ID: {id}</Text>
        </Card>
      ) : (
        <GapNotice>
          {type === 'ECOMMERCE' || type === 'YATRA'
            ? `There's no single-order detail endpoint confirmed for ${type} orders yet — see docs/MOBILE_API_MAPPING.md.`
            : "Couldn't find this booking."}
        </GapNotice>
      )}
    </Screen>
  )
}
