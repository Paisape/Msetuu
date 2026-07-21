import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from 'react-native'

import { getMyOrders } from '../api/orders'
import type { MyOrder } from '../api/types'
import { Card, EmptyView, ErrorView, LoadingView, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'MyBookings'>

export default function MyBookingsScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<MyOrder[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setError(null)
    getMyOrders()
      .then(setOrders)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [])

  useFocusEffect(load)

  if (error) return <ErrorView message={error} onRetry={load} />
  if (!orders) return <LoadingView />

  return (
    <Screen>
      <ScreenTitle>My Bookings</ScreenTitle>
      {orders.length === 0 && <EmptyView message="You haven't booked anything yet." />}
      {orders.map(order => (
        <Card key={`${order.type}-${order.id}`} onPress={() => navigation.navigate('BookingDetail', { type: order.type, id: order.id, label: order.label })}>
          <Text style={{ fontWeight: '700' }}>{order.label}</Text>
          <Text style={{ color: '#6b6b6b', marginTop: 2 }}>{order.type} · {order.status}</Text>
          <Text style={{ color: '#ff6b35', fontWeight: '700', marginTop: 4 }}>
            ₹{order.amount} · {order.paymentStatus}
          </Text>
        </Card>
      ))}
    </Screen>
  )
}
